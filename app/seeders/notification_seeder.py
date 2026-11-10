from app.extensions import db
from app.models.notification import Notification
from app.models.staff import Staff
from app.models.user import User


NOTIFICATIONS = {
    "admin": (
        ("dashboard_update", "Dashboard data is ready", "Audit activity and system notifications are available on your dashboard."),
        ("audit_log_created", "Audit logging is enabled", "Administrative and staff actions are recorded in the audit log."),
    ),
    "staff": (
        ("new_request_for_staff", "Request queue is ready", "New document requests will appear in your request queue."),
        ("dashboard_update", "Dashboard notifications enabled", "Request updates and system notices will appear here."),
    ),
    "resident": (
        ("dashboard_update", "Welcome to Barangay Document System", "You will receive updates here when your document requests change status."),
    ),
}


def seed_notifications():
    for username, notifications in NOTIFICATIONS.items():
        user = User.query.filter_by(username=username).first()
        if user is None:
            raise RuntimeError(f"User account '{username}' must be seeded before notifications.")

        staff = Staff.query.filter_by(user_id=user.id).first()
        for notification_type, title, message in notifications:
            existing = Notification.query.filter_by(
                user_id=user.id, type=notification_type, title=title
            ).first()
            if existing is None:
                db.session.add(
                    Notification(
                        user_id=user.id,
                        staff_id=staff.id if staff else None,
                        type=notification_type,
                        title=title,
                        message=message,
                        is_read=False,
                    )
                )
