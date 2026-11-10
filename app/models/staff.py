# Debug: Database model for staff accounts.
from datetime import datetime
from typing import TYPE_CHECKING

from app.extensions import db
from sqlalchemy.orm import Mapped, relationship

if TYPE_CHECKING:
    from app.models.admin import Admin
    from app.models.user import User


class Staff(db.Model):
    __tablename__ = "staff"

    id = db.Column("staff_id", db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.user_id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    assigned_by = db.Column(
        db.Integer, db.ForeignKey("admins.admin_id", ondelete="CASCADE"), nullable=True
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    user: Mapped["User"] = relationship(
        "User",
        foreign_keys=[user_id],
        back_populates="staff_profile",
        uselist=False,
    )
    assigned_by_admin: Mapped["Admin | None"] = relationship(
        "Admin", foreign_keys=[assigned_by]
    )

    def __init__(
        self,
        *,
        user_id: int,
        assigned_by: int | None = None,
        position: str = "Staff",
    ) -> None:
        self.user_id = user_id
        self.assigned_by = assigned_by
        self.position = position

    @property
    def position(self):
        return "Staff"

    @position.setter
    def position(self, value):
        pass

    @property
    def employee_id(self):
        return None

    @employee_id.setter
    def employee_id(self, value):
        pass

    def to_dict(self):
        return {
            "id": self.id,
            "staff_id": self.id,
            "user_id": self.user_id,
            "position": self.position,
            "employee_id": self.employee_id,
            "user": self.user.to_dict() if self.user else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<Staff UserID={self.user_id} Position={self.position}>"
