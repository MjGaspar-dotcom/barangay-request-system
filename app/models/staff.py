# Debug: Database model for staff accounts.
from datetime import datetime
from app.extensions import db


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
        db.Integer, db.ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    user = db.relationship(
        "User", foreign_keys=[user_id], backref="staff_profile", uselist=False
    )
    assigned_by_user = db.relationship("User", foreign_keys=[assigned_by])

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
