# Seed the default administrator account from the Laravel AdminSeeder.
from datetime import date

from app.extensions import db
from app.models.admin import Admin
from app.models.user import User
from app.utils.passwords import hash_password


def seed_admin():
    user = User.query.filter_by(username="admin").first()

    values = {
        "password_hash": hash_password("password123"),
        "first_name": "System",
        "middle_name": None,
        "last_name": "Administrator",
        "birth_date": date(1985, 1, 1),
        "gender": "Male",
        "civil_status": "Single",
        "address": "Barangay Hall",
        "contact_number": "09170000000",
        "email": "admin@barangay.local",
        "valid_id_type": None,
        "valid_id_front": None,
        "valid_id_back": None,
        "verification_status": "verified",
    }

    if user is None:
        user = User(username="admin", **values)
        db.session.add(user)
    else:
        for field, value in values.items():
            setattr(user, field, value)

    db.session.flush()

    if Admin.query.filter_by(user_id=user.id).first() is None:
        db.session.add(Admin(user_id=user.id))

    return user