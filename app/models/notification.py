# Debug: Database model for user notifications.
from datetime import datetime
from app.extensions import db


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column("notification_id", db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False
    )
    type = db.Column(db.String(100), default="general", nullable=False)
    staff_id = db.Column(
        db.Integer, db.ForeignKey("staff.staff_id", ondelete="SET NULL"), nullable=True
    )
    request_id = db.Column(
        db.Integer,
        db.ForeignKey("barangay_requests.request_id", ondelete="CASCADE"),
        nullable=True,
    )
    title = db.Column(db.String(150), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    read_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def __init__(
        self,
        *,
        user_id: int,
        title: str,
        message: str,
        type: str | None = None,
        staff_id: int | None = None,
        request_id: int | None = None,
        is_read: bool = False,
        read_at: datetime | None = None,
    ) -> None:
        self.user_id = user_id
        self.title = title
        self.message = message
        self.type = type or "general"
        self.staff_id = staff_id
        self.request_id = request_id
        self.is_read = is_read
        self.read_at = read_at

    def to_dict(self):
        return {
            "id": self.id,
            "notification_id": self.id,
            "user_id": self.user_id,
            "type": self.type,
            "staff_id": self.staff_id,
            "request_id": self.request_id,
            "title": self.title,
            "message": self.message,
            "is_read": self.is_read,
            "read_at": self.read_at.isoformat() if self.read_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<Notification UserID={self.user_id} Title={self.title}>"
