# Debug: Database model for application users.
from datetime import datetime, date
from app.extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column("user_id", db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(255), unique=True, nullable=True, index=True)
    first_name = db.Column(db.String(255), nullable=False, default="Resident")
    middle_name = db.Column(db.String(255), nullable=True)
    last_name = db.Column(db.String(255), nullable=False, default="User")
    birth_date = db.Column(db.Date, nullable=True)
    gender = db.Column(db.String(50), nullable=True)
    civil_status = db.Column(db.String(50), nullable=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    google_id = db.Column(db.String(255), unique=True, nullable=True)
    password_hash = db.Column("password", db.String(255), nullable=False)
    contact_number = db.Column(db.String(20), nullable=True)
    address = db.Column(db.Text, nullable=True)
    profile_picture = db.Column(db.String(255), nullable=True)
    valid_id_type = db.Column(db.String(100), nullable=True)
    valid_id_front = db.Column(db.String(255), nullable=True)
    valid_id_back = db.Column(db.String(255), nullable=True)
    verification_status = db.Column(db.String(20), default="pending", nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    barangay_requests = db.relationship(
        "BarangayRequest",
        foreign_keys="BarangayRequest.user_id",
        back_populates="user",
        lazy=True,
        cascade="all, delete-orphan",
    )
    notifications = db.relationship(
        "Notification", backref="user", lazy=True, cascade="all, delete-orphan"
    )
    admin_profile = db.relationship(
        "Admin",
        back_populates="user",
        foreign_keys="Admin.user_id",
        uselist=False,
        cascade="all, delete-orphan",
    )
    staff_profile = db.relationship(
        "Staff",
        back_populates="user",
        foreign_keys="Staff.user_id",
        uselist=False,
        cascade="all, delete-orphan",
    )

    def __init__(
        self,
        *,
        username: str | None = None,
        name: str | None = None,
        first_name: str = "Resident",
        middle_name: str | None = None,
        last_name: str = "User",
        birth_date: date | None = None,
        gender: str | None = None,
        civil_status: str | None = None,
        email: str,
        google_id: str | None = None,
        password_hash: str,
        phone: str | None = None,
        contact_number: str | None = None,
        address: str | None = None,
        profile_picture: str | None = None,
        valid_id_type: str | None = None,
        valid_id_front: str | None = None,
        valid_id_back: str | None = None,
        verification_status: str = "pending",
        role: str = "resident",
        is_active: bool = True,
    ) -> None:
        self.username = username
        self.name = name
        self.first_name = first_name
        self.middle_name = middle_name
        self.last_name = last_name
        self.birth_date = birth_date
        self.gender = gender
        self.civil_status = civil_status
        self.email = email
        self.google_id = google_id
        self.password_hash = password_hash
        self.contact_number = contact_number or phone
        self.address = address
        self.profile_picture = profile_picture
        self.valid_id_type = valid_id_type
        self.valid_id_front = valid_id_front
        self.valid_id_back = valid_id_back
        self.verification_status = verification_status
        self.role = role
        self.is_active = is_active

    @property
    def name(self):
        return " ".join(
            filter(None, [self.first_name, self.middle_name, self.last_name])
        )

    @name.setter
    def name(self, value):
        if value and not getattr(self, "first_name", None):
            self.first_name = value

    @property
    def phone(self):
        return self.contact_number

    @phone.setter
    def phone(self, value):
        self.contact_number = value

    @property
    def role(self):
        if getattr(self, "admin_profile", None):
            return "admin"
        if getattr(self, "staff_profile", None):
            return "staff"
        return getattr(self, "_requested_role", "resident")

    @role.setter
    def role(self, value):
        self._requested_role = value

    @property
    def is_active(self):
        return True

    @is_active.setter
    def is_active(self, value):
        pass

    def to_dict(self):
        return {
            "user_id": self.id,
            "id": self.id,
            "username": self.username,
            "name": self.name
            or " ".join(
                filter(None, [self.first_name, self.middle_name, self.last_name])
            ),
            "first_name": self.first_name,
            "middle_name": self.middle_name,
            "last_name": self.last_name,
            "birth_date": self.birth_date.isoformat() if self.birth_date else None,
            "gender": self.gender,
            "civil_status": self.civil_status,
            "email": self.email,
            "google_id": self.google_id,
            "phone": self.phone or self.contact_number,
            "contact_number": self.contact_number or self.phone,
            "address": self.address,
            "profile_picture": self.profile_picture,
            "valid_id_type": self.valid_id_type,
            "valid_id_front": self.valid_id_front,
            "valid_id_back": self.valid_id_back,
            "verification_status": self.verification_status,
            "role": (
                "admin"
                if self.role == "admin"
                else "staff" if self.role == "staff" else "user"
            ),
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<User {self.email} ({self.role})>"
