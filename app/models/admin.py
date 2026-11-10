# Debug: Database model for administrator accounts.
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy.orm import Mapped, relationship

from app.extensions import db

if TYPE_CHECKING:
    from app.models.user import User


class Admin(db.Model):
    __tablename__ = "admins"

    id = db.Column("admin_id", db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.user_id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
    user: Mapped["User"] = relationship(
        "User",
        back_populates="admin_profile",
        foreign_keys=[user_id],
    )

    @property
    def department(self):
        return "General Administration"

    @department.setter
    def department(self, value):
        pass

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "department": self.department,
            "user": self.user.to_dict() if self.user else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<Admin UserID={self.user_id}>" # it shows the user_id of the admin instance when printed
    # sample output: <Admin UserID=1>
