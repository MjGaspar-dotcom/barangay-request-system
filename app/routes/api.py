from datetime import datetime
from functools import wraps
import secrets

from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from werkzeug.security import check_password_hash, generate_password_hash

from app.extensions import db
from app.models import User, DocumentType, BarangayRequest, Notification, AuditLog, Staff

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


@api_bp.get("/health")
def health():
    return success({"service": "barangay-request-system"})


@api_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    required = ("name", "email", "password")
    missing = [field for field in required if not data.get(field)]
    if missing:
        return failure("Validation failed", 422, {field: ["This field is required."] for field in missing})
    if User.query.filter_by(email=data["email"].strip().lower()).first():
        return failure("Validation failed", 422, {"email": ["The email has already been taken."]})

    user = User(name=data["name"].strip(), email=data["email"].strip().lower(),
                password_hash=generate_password_hash(data["password"]), phone=data.get("phone"),
                address=data.get("address"), role="resident")
    db.session.add(user)
    db.session.commit()
    return success(user.to_dict(), "Registration successful", 201)


@api_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    user = User.query.filter_by(email=(data.get("email") or "").strip().lower()).first()
    if not user or not check_password_hash(user.password_hash, data.get("password", "") ):
        return failure("Invalid credentials", 401)
    if not user.is_active:
        return failure("Account is inactive", 403)
    token = create_access_token(identity=str(user.id), additional_claims={"role": user.role})
    return jsonify({"status": "success", "message": "Login successful", "token": token,
                    "data": user.to_dict(), "user": user.to_dict()})


@api_bp.get("/user")
@jwt_required()
def current_user():
    user = db.session.get(User, int(get_jwt_identity()))
    return success(user.to_dict()) if user else failure("User not found", 404)


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
    return success({"tracking_number": item.tracking_number, "status": item.status,
                    "document_type": item.document_type.name if item.document_type else None,
                    "submitted_at": item.submitted_at.isoformat() if item.submitted_at else None})


@api_bp.route("/barangay-requests", methods=["GET", "POST"])
@jwt_required()
def barangay_requests():
    user = db.session.get(User, int(get_jwt_identity()))
    if request.method == "GET":
        items = BarangayRequest.query.filter_by(user_id=user.id).order_by(BarangayRequest.created_at.desc()).all()
        return success([item.to_dict() for item in items])
    data = request.get_json(silent=True) or {}
    document_type = db.session.get(DocumentType, data.get("document_type_id") or data.get("document_type"))
    if not document_type:
        return failure("Document type is required", 422)
    tracking = "BRGY-" + datetime.utcnow().strftime("%Y") + "-" + secrets.token_hex(4).upper()
    item = BarangayRequest(tracking_number=tracking, user_id=user.id, document_type_id=document_type.id,
                           purpose=data.get("purpose", ""), status="Pending")
    db.session.add(item)
    db.session.commit()
    return success(item.to_dict(), "Request submitted", 201)


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
    data = request.get_json(silent=True) or {}
    for field in ("purpose", "remarks", "status"):
        if field in data and (field != "status" or user.role in ("staff", "admin")):
            setattr(item, field, data[field])
    if "status" in data and user.role in ("staff", "admin"):
        item.processed_by = user.id
        item.processed_at = datetime.utcnow()
    db.session.commit()
    return success(item.to_dict(), "Request updated")


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
    target.is_active = bool((request.get_json(silent=True) or {}).get("is_verified", True))
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
