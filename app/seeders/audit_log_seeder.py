from app.extensions import db
from app.models.audit_log import AuditLog
from app.models.staff import Staff
from app.models.user import User


def seed_audit_logs():
    admin = User.query.filter_by(username="admin").first()
    staff_user = User.query.filter_by(username="staff").first()
    resident = User.query.filter_by(username="resident").first()
    staff = Staff.query.filter_by(user_id=staff_user.id).first() if staff_user else None

    if not all((admin, staff_user, resident, staff)):
        raise RuntimeError("Admin, staff, and resident accounts must be seeded before audit logs.")
    assert admin is not None
    assert staff_user is not None
    assert resident is not None
    assert staff is not None

    entries = (
        {
            "action": "created",
            "table_name": "users",
            "record_id": resident.id,
            "details": "Seeded resident account for dashboard testing.",
            "user_id": admin.id,
            "staff_id": None,
            "old_values": None,
            "new_values": {
                "username": resident.username,
                "verification_status": resident.verification_status,
            },
        },
        {
            "action": "created",
            "table_name": "users",
            "record_id": staff_user.id,
            "details": "Seeded staff account for dashboard testing.",
            "user_id": admin.id,
            "staff_id": None,
            "old_values": None,
            "new_values": {"username": staff_user.username, "role": "staff"},
        },
        {
            "action": "updated",
            "table_name": "users",
            "record_id": resident.id,
            "details": "Resident identity verification was approved.",
            "user_id": staff_user.id,
            "staff_id": staff.id,
            "old_values": {"verification_status": "pending"},
            "new_values": {"verification_status": "verified"},
        },
    )

    for entry in entries:
        existing = AuditLog.query.filter_by(
            action=entry["action"],
            table_name=entry["table_name"],
            record_id=entry["record_id"],
            details=entry["details"],
        ).first()
        if existing is None:
            db.session.add(AuditLog(**entry))
