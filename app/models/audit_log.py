# Debug: Database model for audit history records.
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from app.extensions import db
from sqlalchemy.orm import Mapped, relationship

if TYPE_CHECKING:
    from app.models.user import User


class AuditLog(db.Model):
    __tablename__ = "audit_logs"

    id = db.Column("audit_log_id", db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True
    )
    action = db.Column(db.String(100), nullable=False)
    staff_id = db.Column(
        db.Integer, db.ForeignKey("staff.staff_id", ondelete="SET NULL"), nullable=True
    )
    table_name = db.Column(db.String(100), nullable=True)
    record_id = db.Column(db.Integer, nullable=True)
    details = db.Column("description", db.Text, nullable=True)
    old_values = db.Column(db.JSON, nullable=True)
    new_values = db.Column(db.JSON, nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    user: Mapped[Optional["User"]] = relationship("User", lazy=True)

    def __init__(
        self,
        *,
        action: str,
        user_id: int | None = None,
        staff_id: int | None = None,
        table_name: str | None = None,
        record_id: int | None = None,
        details: str | None = None,
        old_values: dict | None = None,
        new_values: dict | None = None,
        ip_address: str | None = None,
        target_type: str | None = None,
        target_id: int | None = None,
    ) -> None:
        self.action = action
        self.user_id = user_id
        self.staff_id = staff_id
        self.table_name = table_name or target_type
        self.record_id = record_id or target_id
        self.details = details
        self.old_values = old_values
        self.new_values = new_values
        self.ip_address = ip_address

    @property
    def target_type(self):
        return self.table_name

    @target_type.setter
    def target_type(self, value):
        self.table_name = value

    @property
    def target_id(self):
        return self.record_id

    @target_id.setter
    def target_id(self, value):
        self.record_id = value

    def to_dict(self):
        return {
            "id": self.id,
            "audit_log_id": self.id,
            "user_id": self.user_id,
            "action": self.action,
            "staff_id": self.staff_id,
            "target_type": self.target_type,
            "table_name": self.table_name or self.target_type,
            "record_id": self.record_id or self.target_id,
            "old_values": self.old_values,
            "new_values": self.new_values,
            "target_id": self.target_id,
            "details": self.details,
            "description": self.details,
            "ip_address": self.ip_address,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "user": self.user.to_dict() if self.user else None,
        }

    def __repr__(self):
        return f"<AuditLog Action={self.action} Target={self.target_type}:{self.target_id}>"
