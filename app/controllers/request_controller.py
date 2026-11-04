# Debug: Barangay request creation, updates, and tracking endpoints.
from datetime import datetime, date
import re
from flask import jsonify, request
from flask_jwt_extended import (
    create_access_token,
    get_jwt,
    get_jwt_identity,
    jwt_required,
)

from app.extensions import db
from app.models import (
    User,
    DocumentType,
    BarangayRequest,
    Notification,
    AuditLog,
    Staff,
)
from app.services.tracking_number_service import TrackingNumberService
from app.services.request_status_service import RequestStatusService
from app.utils.passwords import hash_password, verify_password
from app.controllers.base import success, failure, role_required


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


@jwt_required()
def barangay_request_detail(request_id):
    user = db.session.get(User, int(get_jwt_identity()))
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
        return success(item.to_dict())
    if user.role not in ("staff", "admin"):
        return failure("Unauthorized. Only Staff or Admin can process requests.", 403)
    data = request.get_json(silent=True) or {}
    if "status" in data:
        try:
            item = RequestStatusService.update_barangay_request_atomically(
                item, data["status"], data, data.get("remarks")
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
            "data": item.to_dict(),
        }
    )
