from datetime import datetime, date
from functools import wraps
import re

from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from werkzeug.security import check_password_hash, generate_password_hash

from app.extensions import db
from app.models import User, DocumentType, BarangayRequest, Notification, AuditLog, Staff
from app.services.tracking_number_service import TrackingNumberService
from app.services.request_status_service import RequestStatusService

api_bp = Blueprint("api", __name__)


def success(data=None, message="Success", status=200):
    payload = {"status": "success", "message": message}
    if data is not None:
        payload["data"] = data
    return jsonify(payload), status


def failure(message, status=400, errors=None):
    payload = {"status": "error", "message": message}
    if errors is not None:
        payload["errors"] = errors
    return jsonify(payload), status


def role_required(*roles):
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            user = db.session.get(User, int(get_jwt_identity()))
            if not user or user.role not in roles:
                return failure("Forbidden", 403)
            return fn(user, *args, **kwargs)
        return wrapper
    return decorator


@api_bp.get("/test")
def api_test():
    return success({"message": "API is working"})


@api_bp.get("/test-qr")
def test_qr():
    from flask import Response
    from app.services.qr_code_service import QrCodeService
    return Response(QrCodeService.generate("BRGY-2026-TEST01"), mimetype="image/svg+xml")


@api_bp.post("/ocr/test")
def ocr_test():
    image = request.files.get("image")
    if image is None:
        return failure("Validation failed", 422, {"image": ["The image field is required."]})
    if image.mimetype not in ("image/jpeg", "image/png") or not image.filename:
        return failure("Validation failed", 422, {"image": ["The file must be an image."]})
    try:
        import pytesseract
        from PIL import Image
        raw_text = pytesseract.image_to_string(Image.open(image.stream))
        return success({"text": raw_text.strip()}, "OCR completed")
    except ImportError:
        return failure("OCR service is unavailable on this server.", 503)


@api_bp.get("/health")
def health():
    return success({"service": "barangay-request-system"})


@api_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    # Preserve support for the original Python API while validating Laravel's resident registration shape.
    required = ("email", "password")
    if data.get("username"):
        required += ("username", "first_name", "last_name", "birth_date", "gender", "civil_status", "address", "contact_number")
    elif "name" not in data:
        required += ("username", "first_name", "last_name", "birth_date", "gender", "civil_status", "address", "contact_number")
    missing = [field for field in required if field not in data or data[field] is None or str(data[field]).strip() == ""]
    if missing:
        return failure("Validation failed", 422, {field: ["This field is required."] for field in missing})
    password_confirmation = data.get("password_confirmation")
    if password_confirmation is not None and password_confirmation != data["password"]:
        return failure("Validation failed", 422, {"password": ["Password confirmation does not match."]})
    if len(data["password"]) < 8:
        return failure("Validation failed", 422, {"password": ["The password must be at least 8 characters."]})
    if data.get("username") and not re.fullmatch(r"[A-Za-z0-9_-]+", data["username"]):
        return failure("Validation failed", 422, {"username": ["The username may only contain letters, numbers, dashes and underscores."]})
    username = data.get("username") or (data.get("name") or data["email"].split("@", 1)[0])
    email = data["email"].strip().lower()
    if User.query.filter_by(email=email).first() or User.query.filter_by(username=username).first():
        errors = {}
        if User.query.filter_by(email=email).first(): errors["email"] = ["The email has already been taken."]
        if User.query.filter_by(username=username).first(): errors["username"] = ["The username has already been taken."]
        return failure("Validation failed", 422, errors)
    full_name = data.get("name", "")
    name_parts = full_name.strip().split()
    first_name = data.get("first_name") or (name_parts[0] if name_parts else full_name or "Resident")
    last_name = data.get("last_name") or (name_parts[-1] if len(name_parts) > 1 else "User")
    try:
        birth_date_value = date.fromisoformat(data["birth_date"]) if data.get("birth_date") else None
        if birth_date_value and birth_date_value > date.today():
            return failure("Validation failed", 422, {"birth_date": ["Birth date cannot be in the future."]})
    except ValueError:
        return failure("Validation failed", 422, {"birth_date": ["The birth date is invalid."]})
    user = User(username=username, name=full_name or " ".join(filter(None, [first_name, data.get("middle_name"), last_name])),
                first_name=first_name, middle_name=data.get("middle_name"), last_name=last_name,
                birth_date=birth_date_value if data.get("birth_date") else None,
                gender=data.get("gender"), civil_status=data.get("civil_status"), email=email,
                password_hash=generate_password_hash(data["password"]), phone=data.get("phone") or data.get("contact_number"),
                contact_number=data.get("contact_number") or data.get("phone"), address=data.get("address"),
                verification_status="pending", role="resident")
    db.session.add(user)
    db.session.commit()
    return success(user.to_dict(), "User registered successfully." if data.get("username") else "Registration successful", 201)


@api_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    identifier = (data.get("username") or data.get("email") or "").strip().lower()
    user = User.query.filter_by(username=identifier).first()
    if not user and data.get("email"):
        user = User.query.filter_by(email=identifier).first()
    if not user or not check_password_hash(user.password_hash, data.get("password", "")):
        return failure("Invalid username or password." if data.get("username") else "Invalid credentials", 401)
    if not user.is_active:
        return failure("Account is inactive", 403)
    role = "admin" if user.role == "admin" else "staff" if user.role == "staff" else "user"
    token = create_access_token(identity=str(user.id), additional_claims={"role": role})
    return jsonify({"success": True, "status": "success", "message": "Login successful.", "token": token,
                    "role": role, "data": user.to_dict(), "user": user.to_dict()})


@api_bp.get("/user")
@jwt_required()
def current_user():
    user = db.session.get(User, int(get_jwt_identity()))
    if not user:
        return failure("User not found", 404)
    role = "admin" if user.role == "admin" else "staff" if user.role == "staff" else "user"
    return jsonify({"success": True, "status": "success", "role": role, "data": user.to_dict()})


@api_bp.post("/logout")
@jwt_required()
def logout():
    return success(message="Logged out successfully")


@api_bp.patch("/profile")
@jwt_required()
def update_profile():
    user = db.session.get(User, int(get_jwt_identity()))
    data = request.get_json(silent=True) or {}
    for field in ("name", "phone", "address"):
        if field in data:
            setattr(user, field, data[field])
    db.session.commit()
    return success(user.to_dict(), "Profile updated")


@api_bp.get("/document-types")
def document_types():
    items = DocumentType.query.filter_by(is_active=True).order_by(DocumentType.name).all()
    return success([item.to_dict() for item in items])


@api_bp.get("/track/<tracking_number>")
def track(tracking_number):
    item = BarangayRequest.query.filter_by(tracking_number=tracking_number).first()
    if not item:
        return failure("Request not found", 404)
    return jsonify({"success": True, "data": {
        "tracking_number": item.tracking_number, "status": item.status,
        "document_type": item.document_type.name if item.document_type else None,
        "purpose": item.purpose, "submitted_at": item.created_at.isoformat() if item.created_at else None,
        "remarks": item.remarks,
    }})


@api_bp.route("/barangay-requests", methods=["GET", "POST"])
@jwt_required()
def barangay_requests():
    user = db.session.get(User, int(get_jwt_identity()))
    if request.method == "GET":
        query = BarangayRequest.query
        if user.role not in ("staff", "admin"):
            query = query.filter_by(user_id=user.id)
        items = query.order_by(BarangayRequest.created_at.desc()).all()
        return jsonify({"success": True, "status": "success", "data": [item.to_dict() for item in items]})
    if user.verification_status != "verified":
        return failure("Unauthorized. Only verified users can submit a barangay request.", 403)
    data = request.get_json(silent=True) or {}
    document_type = db.session.get(DocumentType, data.get("document_type_id") or data.get("document_type"))
    if not document_type or not (data.get("purpose") or "").strip():
        return failure("Validation failed", 422, {"document_type_id": ["The document type is required."]} if not document_type else {"purpose": ["The purpose is required."]})
    tracking = TrackingNumberService.generate()
    item = BarangayRequest(tracking_number=tracking, user_id=user.id, document_type_id=document_type.id,
                           purpose=data["purpose"].strip(), status="Pending")
    db.session.add(item)
    db.session.flush()
    from app.services.notification_service import NotificationService
    NotificationService.new_request_for_staff(item)
    from app.services.audit_service import AuditService
    AuditService.log("created", item, f"New barangay request submitted (Tracking: {item.tracking_number})")
    db.session.commit()
    from app.services.qr_code_service import QrCodeService
    return jsonify({"success": True, "message": "Barangay request created successfully.",
                    "data": {"request": item.to_dict(), "qr_code": QrCodeService.generate(tracking)}}), 201


@api_bp.route("/barangay-requests/<int:request_id>", methods=["GET", "PUT", "PATCH", "DELETE"])
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
            item = RequestStatusService.update_barangay_request_atomically(item, data["status"], data, data.get("remarks"))
        except ValueError as exc:
            db.session.rollback()
            return failure(str(exc), 422)
    else:
        for field in ("purpose", "remarks"):
            if field in data:
                setattr(item, field, data[field])
        db.session.commit()
    return jsonify({"success": True, "message": "Barangay request updated successfully.", "data": item.to_dict()})


@api_bp.get("/notifications")
@jwt_required()
def notifications():
    user = db.session.get(User, int(get_jwt_identity()))
    items = Notification.query.filter_by(user_id=user.id).order_by(Notification.created_at.desc()).all()
    return success([item.to_dict() for item in items])


@api_bp.get("/notifications/unread-count")
@jwt_required()
def unread_count():
    user = db.session.get(User, int(get_jwt_identity()))
    count = Notification.query.filter_by(user_id=user.id, is_read=False).count()
    return success({"count": count})


@api_bp.patch("/notifications/read-all")
@jwt_required()
def read_all_notifications():
    user = db.session.get(User, int(get_jwt_identity()))
    Notification.query.filter_by(user_id=user.id).update({"is_read": True, "read_at": datetime.utcnow()})
    db.session.commit()
    return success(message="Notifications marked as read")


@api_bp.patch("/notifications/<int:notification_id>/read")
@jwt_required()
def read_notification(notification_id):
    user = db.session.get(User, int(get_jwt_identity()))
    item = db.session.get(Notification, notification_id)
    if not item or item.user_id != user.id:
        return failure("Notification not found", 404)
    item.is_read = True
    item.read_at = datetime.utcnow()
    db.session.commit()
    return success(item.to_dict())


@api_bp.get("/staff")
@role_required("staff", "admin")
def staff_list(user):
    return success([item.to_dict() for item in Staff.query.all()])


@api_bp.get("/staff/requests")
@role_required("staff", "admin")
def staff_requests(user):
    items = BarangayRequest.query.order_by(BarangayRequest.created_at.desc()).all()
    return success([item.to_dict() for item in items])


@api_bp.get("/admin/stats")
@role_required("admin")
def admin_stats(user):
    return success({"users": User.query.count(), "requests": BarangayRequest.query.count(),
                    "pending": BarangayRequest.query.filter_by(status="Pending").count(),
                    "document_types": DocumentType.query.count()})


@api_bp.get("/admin/users")
@role_required("admin")
def admin_users(user):
    return success([item.to_dict() for item in User.query.order_by(User.created_at.desc()).all()])


@api_bp.route("/admin/users/<int:user_id>", methods=["GET", "DELETE"])
@role_required("admin")
def admin_user_detail(user, user_id):
    target = db.session.get(User, user_id)
    if not target:
        return failure("User not found", 404)
    if request.method == "DELETE":
        db.session.delete(target)
        db.session.commit()
        return success(message="User deleted")
    return success(target.to_dict())


@api_bp.patch("/admin/users/<int:user_id>/verification")
@role_required("admin")
def verify_user(user, user_id):
    target = db.session.get(User, user_id)
    if not target:
        return failure("User not found", 404)
    data = request.get_json(silent=True) or {}
    new_status = data.get("verification_status", "verified" if data.get("is_verified", True) else "rejected")
    if new_status not in ("pending", "verified", "rejected"):
        return failure("Validation failed", 422, {"verification_status": ["The selected verification status is invalid."]})
    if target.role in ("staff", "admin"):
        return failure("Verification status only applies to resident accounts.", 422)
    old_status = target.verification_status
    target.verification_status = new_status
    target.is_active = new_status != "rejected"
    if old_status != new_status:
        from app.services.audit_service import AuditService
        AuditService.log("verification_updated", target, f"Verification status changed from {old_status} to {new_status}",
                         {"verification_status": old_status}, {"verification_status": new_status})
    db.session.commit()
    return success(target.to_dict(), "Verification updated")


@api_bp.route("/admin/staff", methods=["GET", "POST"])
@role_required("admin")
def admin_staff(user):
    if request.method == "GET":
        return success([item.to_dict() for item in Staff.query.all()])
    data = request.get_json(silent=True) or {}
    target = User.query.filter_by(email=(data.get("email") or "").lower()).first()
    if not target:
        return failure("User not found", 404)
    target.role = "staff"
    profile = Staff.query.filter_by(user_id=target.id).first()
    if not profile:
        profile = Staff(user_id=target.id)
        db.session.add(profile)
    db.session.commit()
    return success(target.to_dict(), "Staff created", 201)


@api_bp.delete("/admin/staff/<int:staff_id>")
@role_required("admin")
def delete_staff(user, staff_id):
    profile = db.session.get(Staff, staff_id)
    if profile:
        profile.user.role = "resident"
        db.session.delete(profile)
        db.session.commit()
    return success(message="Staff deleted")


@api_bp.get("/admin/recent-activity")
@role_required("admin")
def recent_activity(user):
    return success([item.to_dict() for item in AuditLog.query.order_by(AuditLog.created_at.desc()).limit(20).all()])


@api_bp.route("/audit-logs", methods=["GET"])
@role_required("admin")
def audit_logs(user):
    return success([item.to_dict() for item in AuditLog.query.order_by(AuditLog.created_at.desc()).all()])


@api_bp.get("/audit-logs/<int:log_id>")
@role_required("admin")
def audit_log_detail(user, log_id):
    item = db.session.get(AuditLog, log_id)
    if not item:
        return failure("Audit log not found", 404)
    return success(item.to_dict())
