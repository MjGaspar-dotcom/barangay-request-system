from datetime import datetime
from app.extensions import db


class AuditLog(db.Model):
    __tablename__ = "audit_logs"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = db.Column(db.String(100), nullable=False)
    staff_id = db.Column(db.Integer, db.ForeignKey("staff.id", ondelete="SET NULL"), nullable=True)
    target_type = db.Column(db.String(50), nullable=True)
    target_id = db.Column(db.Integer, nullable=True)
    table_name = db.Column(db.String(100), nullable=True)
    record_id = db.Column(db.Integer, nullable=True)
    details = db.Column(db.Text, nullable=True)
    old_values = db.Column(db.JSON, nullable=True)
    new_values = db.Column(db.JSON, nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "action": self.action, "staff_id": self.staff_id,
            "target_type": self.target_type,
            "table_name": self.table_name or self.target_type,
            "record_id": self.record_id or self.target_id,
            "old_values": self.old_values, "new_values": self.new_values,
            "target_id": self.target_id,
            "details": self.details,
            "ip_address": self.ip_address,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "user": self.user.to_dict() if self.user else None,
        }

    def __repr__(self):
        return f"<AuditLog Action={self.action} Target={self.target_type}:{self.target_id}>"
