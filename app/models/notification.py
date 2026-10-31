from datetime import datetime
from app.extensions import db


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = db.Column(db.String(100), nullable=True)
    staff_id = db.Column(db.Integer, db.ForeignKey("staff.id", ondelete="SET NULL"), nullable=True)
    request_id = db.Column(db.Integer, db.ForeignKey("barangay_requests.id", ondelete="CASCADE"), nullable=True)
    title = db.Column(db.String(150), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    read_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id, "type": self.type,
            "staff_id": self.staff_id, "request_id": self.request_id,
            "title": self.title,
            "message": self.message,
            "is_read": self.is_read,
            "read_at": self.read_at.isoformat() if self.read_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<Notification UserID={self.user_id} Title={self.title}>"
