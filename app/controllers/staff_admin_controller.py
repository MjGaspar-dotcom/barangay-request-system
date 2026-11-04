# Debug: Staff and administrator endpoints.
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


@role_required("staff", "admin")
def staff_list(user):
    return success([item.to_dict() for item in Staff.query.all()])


@role_required("staff", "admin")
def staff_requests(user):
    items = BarangayRequest.query.order_by(BarangayRequest.created_at.desc()).all()
    return success([item.to_dict() for item in items])


@role_required("admin")
def admin_stats(user):
    return success(
        {
            "users": User.query.count(),
            "requests": BarangayRequest.query.count(),
            "pending": BarangayRequest.query.filter_by(status="Pending").count(),
            "document_types": DocumentType.query.count(),
        }
    )


@role_required("admin")
def admin_users(user):
    return success(
        [item.to_dict() for item in User.query.order_by(User.created_at.desc()).all()]
    )


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


@role_required("admin")
def verify_user(user, user_id):
    target = db.session.get(User, user_id)
    if not target:
        return failure("User not found", 404)
    data = request.get_json(silent=True) or {}
    new_status = data.get(
        "verification_status",
        "verified" if data.get("is_verified", True) else "rejected",
    )
    if new_status not in ("pending", "verified", "rejected"):
        return failure(
            "Validation failed",
            422,
            {"verification_status": ["The selected verification status is invalid."]},
        )
    if target.role in ("staff", "admin"):
        return failure("Verification status only applies to resident accounts.", 422)
    old_status = target.verification_status
    target.verification_status = new_status
    target.is_active = new_status != "rejected"
    if old_status != new_status:
        from app.services.audit_service import AuditService

        AuditService.log(
            "verification_updated",
            target,
            f"Verification status changed from {old_status} to {new_status}",
            {"verification_status": old_status},
            {"verification_status": new_status},
        )
    db.session.commit()
    return success(target.to_dict(), "Verification updated")


@role_required("admin")
def admin_staff(user):
    if request.method == "GET":
        return success([item.to_dict() for item in Staff.query.all()])
    data = request.get_json(silent=True) or {}
    required = (
        "username",
        "password",
        "first_name",
        "last_name",
        "birth_date",
        "gender",
        "civil_status",
        "address",
        "contact_number",
        "email",
    )
    errors = {
        field: ["This field is required."]
        for field in required
        if field not in data or data[field] is None or str(data[field]).strip() == ""
    }
    if errors:
        return failure("Validation failed", 422, errors)
    email = str(data["email"]).strip().lower()
    username = str(data["username"]).strip()
    if User.query.filter_by(email=email).first():
        errors.setdefault("email", []).append("The email has already been taken.")
    if User.query.filter_by(username=username).first():
        errors.setdefault("username", []).append("The username has already been taken.")
    if len(str(data["password"])) < 8:
        errors.setdefault("password", []).append(
            "The password must be at least 8 characters."
        )
    if errors:
        return failure("Validation failed", 422, errors)
    try:
        birth_date_value = date.fromisoformat(str(data["birth_date"]))
    except ValueError:
        return failure(
            "Validation failed", 422, {"birth_date": ["The birth date is invalid."]}
        )

    target = User(
        username=username,
        first_name=data["first_name"].strip(),
        middle_name=(data.get("middle_name") or "") or None,
        last_name=data["last_name"].strip(),
        birth_date=birth_date_value,
        gender=data["gender"],
        civil_status=data["civil_status"],
        address=data["address"],
        contact_number=data["contact_number"],
        phone=data["contact_number"],
        email=email,
        password_hash=hash_password(data["password"]),
        role="staff",
        verification_status="verified",
        name=" ".join(
            filter(
                None, [data["first_name"], data.get("middle_name"), data["last_name"]]
            )
        ),
    )
    db.session.add(target)
    db.session.flush()
    profile = Staff(user_id=target.id, position="Staff")
    db.session.add(profile)
    db.session.commit()
    return success(profile.to_dict(), "Staff created", 201)


@role_required("admin")
def delete_staff(user, staff_id):
    profile = db.session.get(Staff, staff_id)
    if profile:
        db.session.delete(profile.user)
        db.session.commit()
    return success(message="Staff deleted")


@role_required("admin")
def recent_activity(user):
    return success(
        [
            item.to_dict()
            for item in AuditLog.query.order_by(AuditLog.created_at.desc())
            .limit(20)
            .all()
        ]
    )
