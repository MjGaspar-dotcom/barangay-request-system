# Debug: Barangay request creation, updates, and tracking endpoints.
import mimetypes
import os
from datetime import datetime
from pathlib import Path
from uuid import uuid4

from flask import current_app, jsonify, request, send_file
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy.exc import SQLAlchemyError
from werkzeug.utils import secure_filename

from app.extensions import db
from app.models import (
    User,
    DocumentType,
    BarangayRequest,
    BarangayRequestDocument,
    AuditLog,
    Staff,
)
from app.services.tracking_number_service import TrackingNumberService
from app.services.request_status_service import RequestStatusService
from app.services.audit_service import AuditService
from app.controllers.base import success, failure
from app.middleware.roles import role_required


def track(tracking_number):
    item = BarangayRequest.query.filter_by(tracking_number=tracking_number).first()
    if not item:
        return failure("Request not found", 404)
    return jsonify(
        {
            "success": True,
            "data": {
                "tracking_number": item.tracking_number,
                "status": item.status,
                "document_type": (
                    item.document_type.document_name if item.document_type else None
                ),
                "purpose": item.purpose,
                "submitted_at": (
                    item.created_at.isoformat() if item.created_at else None
                ),
                "remarks": item.remarks,
            },
        }
    )


@jwt_required()
def barangay_requests():
    user = db.session.get(User, int(get_jwt_identity()))
    if not user:
        return failure("User not found", 404)
    if request.method == "GET":
        query = BarangayRequest.query
        if user.role not in ("staff", "admin"):
            query = query.filter_by(user_id=user.id)
        items = query.order_by(BarangayRequest.created_at.desc()).all()
        return jsonify(
            {
                "success": True,
                "status": "success",
                "data": [item.to_dict() for item in items],
            }
        )
    if user.verification_status != "verified":
        return failure(
            "Unauthorized. Only verified users can submit a barangay request.", 403
        )
    data = request.get_json(silent=True) or {}
    document_type = db.session.get(
        DocumentType, data.get("document_type_id") or data.get("document_type")
    )
    if not document_type or not (data.get("purpose") or "").strip():
        return failure(
            "Validation failed",
            422,
            (
                {"document_type_id": ["The document type is required."]}
                if not document_type
                else {"purpose": ["The purpose is required."]}
            ),
        )
    tracking = TrackingNumberService.generate()
    item = BarangayRequest(
        tracking_number=tracking,
        user_id=user.id,
        document_type_id=document_type.document_type_id,
        purpose=data["purpose"].strip(),
        status="Pending",
    )
    db.session.add(item)
    db.session.flush()
    from app.services.notification_service import NotificationService

    NotificationService.new_request_for_staff(item)
    from app.services.audit_service import AuditService

    AuditService.log(
        "created",
        item,
        f"New barangay request submitted (Tracking: {item.tracking_number})",
    )
    db.session.commit()
    from app.services.qr_code_service import QrCodeService

    return (
        jsonify(
            {
                "success": True,
                "message": "Barangay request created successfully.",
                "data": {
                    "request": item.to_dict(),
                    "qr_code": QrCodeService.generate(tracking),
                },
            }
        ),
        201,
    )


@role_required("staff", "admin")
def verify_request_requirements(user, request_id):
    item = db.session.get(BarangayRequest, request_id)
    if not item:
        return failure("Request not found", 404)
    if item.status != RequestStatusService.STATUS_PENDING:
        return failure("Only pending requests can have requirements reviewed.", 409)
    if item.verified_at:
        return failure("Requirements have already been reviewed.", 409)

    data = request.get_json(silent=True)
    if not isinstance(data, dict) or not isinstance(
        data.get("requirements_complete"), bool
    ):
        return failure(
            "Validation failed",
            422,
            {
                "requirements_complete": [
                    "A boolean requirements_complete value is required."
                ]
            },
        )

    staff = Staff.query.filter_by(user_id=user.id).first()
    item.verified_by = staff.id if staff else None
    item.verified_at = datetime.utcnow()
    item.requirements_complete = data["requirements_complete"]
    AuditService.log(
        "requirements_verified",
        item,
        (
            "Requirements reviewed as complete."
            if item.requirements_complete
            else "Requirements reviewed; additional requirements are needed."
        ),
        old_values={"requirements_complete": None},
        new_values={"requirements_complete": item.requirements_complete},
    )
    db.session.commit()
    return success(_request_detail_dict(item), "Requirements review recorded")


def _request_detail_dict(item):
    data = item.to_dict()
    data["documents"] = [document.to_dict() for document in item.documents]
    data["history"] = [
        event.to_dict()
        for event in AuditLog.query.filter_by(
            table_name="barangay_requests", record_id=item.id
        )
        .order_by(AuditLog.created_at.asc(), AuditLog.id.asc())
        .all()
    ]
    return data


def _request_document(item, purpose, upload, user):
    if upload is None or not upload.filename:
        return None, failure("Select a document to upload.", 422)

    original_name = secure_filename(upload.filename)
    if not original_name:
        return None, failure("The uploaded file must have a valid filename.", 422)
    extension = Path(original_name).suffix.lower()
    mime_types = {
        ".pdf": "application/pdf",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
    }
    mime_type = mime_types.get(extension)
    if not mime_type:
        return None, failure("Documents must be PDF, JPG, or PNG files.", 422)

    upload.stream.seek(0, os.SEEK_END)
    size = upload.stream.tell()
    upload.stream.seek(0)
    if size == 0 or size > 20 * 1024 * 1024:
        return None, failure("Each document must be between 1 byte and 20 MB.", 422)

    relative_path = Path("requests") / str(item.id) / f"{uuid4().hex}{extension}"
    storage_root = Path(current_app.config["PUBLIC_STORAGE_ROOT"]).resolve()
    destination = storage_root / relative_path
    destination.parent.mkdir(parents=True, exist_ok=True)
    upload.save(destination)

    document = BarangayRequestDocument(
        request_id=item.id,
        uploaded_by=user.id,
        purpose=purpose,
        original_name=original_name,
        storage_path=relative_path.as_posix(),
        mime_type=mime_type,
    )
    db.session.add(document)
    return document, None


@jwt_required()
def resubmit_request_requirements(request_id):
    user = db.session.get(User, int(get_jwt_identity()))
    if not user:
        return failure("User not found", 404)
    item = db.session.get(BarangayRequest, request_id)
    if not item:
        return failure("Request not found", 404)
    if item.user_id != user.id:
        return failure("Forbidden", 403)
    if item.status != RequestStatusService.STATUS_ADDITIONAL_REQUIREMENTS:
        return failure(
            "This request is not waiting for additional requirements.", 409
        )

    notes = (request.form.get("notes") or "").strip()
    uploads = [upload for upload in request.files.values() if upload.filename]
    if not notes or not uploads:
        return failure(
            "Validation failed",
            422,
            {
                "notes": ["A note describing the resubmission is required."]
                if not notes
                else [],
                "documents": ["Attach at least one requested document."]
                if not uploads
                else [],
            },
        )

    saved_documents = []
    for upload in uploads:
        document, error = _request_document(
            item, "additional_requirement", upload, user
        )
        if error:
            for saved_path in saved_documents:
                saved_path.unlink(missing_ok=True)
            db.session.rollback()
            return error
        saved_documents.append(
            Path(current_app.config["PUBLIC_STORAGE_ROOT"])
            / document.storage_path
        )

    old_status = item.status
    item.status = RequestStatusService.STATUS_PENDING
    item.verified_by = None
    item.verified_at = None
    item.requirements_complete = False
    item.remarks = None
    AuditService.log(
        "requirements_resubmitted",
        item,
        notes,
        old_values={"status": old_status},
        new_values={"status": RequestStatusService.STATUS_PENDING},
    )
    try:
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        for saved_path in saved_documents:
            saved_path.unlink(missing_ok=True)
        raise
    return success(_request_detail_dict(item), "Requirements resubmitted for review")


@role_required("staff", "admin")
def upload_prepared_document(user, request_id):
    item = db.session.get(BarangayRequest, request_id)
    if not item:
        return failure("Request not found", 404)
    if item.status != RequestStatusService.STATUS_PROCESSING:
        return failure("Documents can only be prepared while processing.", 409)

    document, error = _request_document(
        item, "prepared_document", request.files.get("document"), user
    )
    if error:
        return error
    now = datetime.utcnow()
    item.document_prepared_at = now
    item.document_prepared_by = user.id
    item.prepared_document = document
    AuditService.log(
        "prepared_document_uploaded",
        item,
        f"Prepared document uploaded: {document.original_name}",
    )
    db.session.commit()
    return success(_request_detail_dict(item), "Prepared document uploaded")


@role_required("admin")
def authorize_request_document(user, request_id):
    item = db.session.get(BarangayRequest, request_id)
    if not item:
        return failure("Request not found", 404)
    if item.status != RequestStatusService.STATUS_PROCESSING:
        return failure("Documents can only be authorized while processing.", 409)
    if not item.document_prepared_at:
        return failure("Upload the prepared document before authorizing it.", 409)

    document, error = _request_document(
        item, "signed_document", request.files.get("document"), user
    )
    if error:
        return error
    item.document_signed_at = datetime.utcnow()
    item.document_signed_by = user.id
    item.signed_document = document
    AuditService.log(
        "request_document_authorized",
        item,
        f"Signed document uploaded and authorized: {document.original_name}",
    )
    db.session.commit()
    return success(_request_detail_dict(item), "Document authorized")


@jwt_required()
def view_request_document(request_id, document_id):
    user = db.session.get(User, int(get_jwt_identity()))
    if not user:
        return failure("User not found", 404)
    item = db.session.get(BarangayRequest, request_id)
    if not item:
        return failure("Request not found", 404)
    if user.role not in ("staff", "admin") and item.user_id != user.id:
        return failure("Forbidden", 403)

    document = db.session.get(BarangayRequestDocument, document_id)
    if not document or document.request_id != item.id:
        return failure("Request document not found.", 404)
    storage_root = Path(current_app.config["PUBLIC_STORAGE_ROOT"]).resolve()
    document_path = (storage_root / document.storage_path).resolve()
    try:
        document_path.relative_to(storage_root)
    except ValueError:
        return failure("Request document not found.", 404)
    if not document_path.is_file():
        return failure("Request document not found.", 404)

    response = send_file(
        document_path,
        mimetype=document.mime_type,
        as_attachment=False,
        download_name=document.original_name,
        conditional=True,
    )
    response.cache_control.no_store = True
    return response


@jwt_required()
def barangay_request_detail(request_id):
    user = db.session.get(User, int(get_jwt_identity()))
    if not user:
        return failure("User not found", 404)
    item = db.session.get(BarangayRequest, request_id)
    if not item:
        return failure("Request not found", 404)
    if user.role == "resident" and item.user_id != user.id:
        return failure("Forbidden", 403)
    if request.method == "DELETE" and user.role not in ("staff", "admin"):
        return failure("Forbidden", 403)
    if request.method == "DELETE":
        db.session.delete(item)
        db.session.commit()
        return success(message="Request deleted")
    if request.method == "GET":
        return success(_request_detail_dict(item))
    if user.role not in ("staff", "admin"):
        return failure("Unauthorized. Only Staff or Admin can process requests.", 403)
    data = request.get_json(silent=True) or {}
    if "status" in data:
        try:
            target_status = data["status"]
            if target_status in {
                RequestStatusService.STATUS_APPROVED,
                RequestStatusService.STATUS_ADDITIONAL_REQUIREMENTS,
                RequestStatusService.STATUS_REJECTED,
            } and not item.verified_at:
                return failure(
                    "Record the requirements review before making a decision.", 409
                )
            if (
                target_status == RequestStatusService.STATUS_APPROVED
                and not item.requirements_complete
            ):
                return failure(
                    "Requirements must be reviewed as complete before approval.",
                    409,
                )
            if (
                target_status
                == RequestStatusService.STATUS_ADDITIONAL_REQUIREMENTS
                and item.requirements_complete
            ):
                return failure(
                    "Additional requirements can only be requested after an incomplete review.",
                    409,
                )
            if target_status in {
                RequestStatusService.STATUS_ADDITIONAL_REQUIREMENTS,
                RequestStatusService.STATUS_REJECTED,
            } and not (data.get("remarks") or "").strip():
                return failure("Assessment remarks are required for this decision.", 422)
            item = RequestStatusService.update_barangay_request_atomically(
                item, target_status, data, data.get("remarks")
            )
        except ValueError as exc:
            db.session.rollback()
            return failure(str(exc), 422)
    else:
        for field in ("purpose", "remarks"):
            if field in data:
                setattr(item, field, data[field])
        db.session.commit()
    return jsonify(
        {
            "success": True,
            "message": "Barangay request updated successfully.",
            "data": _request_detail_dict(item),
        }
    )


@jwt_required()
def request_valid_id(request_id, side):
    if side not in {"front", "back"}:
        return failure("Valid ID image not found.", 404)

    user = db.session.get(User, int(get_jwt_identity()))
    if not user:
        return failure("User not found", 404)

    item = db.session.get(BarangayRequest, request_id)
    if not item:
        return failure("Request not found", 404)
    if user.role not in ("staff", "admin") and item.user_id != user.id:
        return failure("Forbidden", 403)

    relative_path = (
        item.user.valid_id_front if side == "front" else item.user.valid_id_back
    )
    if not relative_path:
        return failure("Valid ID image not found.", 404)

    storage_root = Path(current_app.config["PUBLIC_STORAGE_ROOT"]).resolve()
    candidate = (storage_root / Path(relative_path)).resolve()
    if os.path.commonpath((str(storage_root), str(candidate))) != str(storage_root):
        return failure("Valid ID image not found.", 404)
    if not candidate.is_file():
        return failure("Valid ID image not found.", 404)

    content_type = mimetypes.guess_type(candidate.name)[0] or "application/octet-stream"
    return send_file(candidate, mimetype=content_type, conditional=True)
