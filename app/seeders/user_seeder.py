# Seed the default resident account from the Laravel UserSeeder.
from datetime import date

from app.extensions import db
from app.models.user import User
from app.utils.passwords import hash_password


def seed_resident():
    user = User.query.filter_by(username="resident").first()

    values = {
        "password_hash": hash_password("password123"),
        "first_name": "Juan",
        "middle_name": None,
        "last_name": "Dela Cruz",
        "birth_date": date(1995, 6, 20),
        "gender": "Male",
        "civil_status": "Single",
        "address": "123 Main Street, Barangay San Fabian",
        "contact_number": "09192222222",
        "email": "resident@barangay.local",
        "valid_id_type": "Barangay ID",
        "valid_id_front": "seed/valid_id_front.jpg",
        "valid_id_back": None,
        "verification_status": "verified",
    }

    if user is None:
        user = User(username="resident", **values)
        db.session.add(user)
    else:
        for field, value in values.items():
            setattr(user, field, value)

    return user