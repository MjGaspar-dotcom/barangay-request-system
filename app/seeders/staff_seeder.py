# Seed the default staff account from the Laravel StaffSeeder.
from datetime import date

from app.extensions import db
from app.models.admin import Admin
from app.models.staff import Staff
from app.models.user import User
from app.utils.passwords import hash_password


def seed_staff(admin_user):
    admin = Admin.query.filter_by(user_id=admin_user.id).first()
    if admin is None:
        raise ValueError("Cannot seed staff without an administrator profile.")

    user = User.query.filter_by(username="staff").first()

    values = {
        "password_hash": hash_password("password123"),
        "first_name": "Barangay",
        "middle_name": None,
        "last_name": "Staff",
        "birth_date": date(1992, 5, 15),
        "gender": "Female",
        "civil_status": "Single",
        "address": "Barangay Hall",
        "contact_number": "09171111111",
        "email": "staff@barangay.local",
        "valid_id_type": None,
        "valid_id_front": None,
        "valid_id_back": None,
        "verification_status": "verified",
    }

    if user is None:
        user = User(username="staff", **values)
        db.session.add(user)
    else:
        for field, value in values.items():
            setattr(user, field, value)

    db.session.flush()

    staff = Staff.query.filter_by(user_id=user.id).first()
    if staff is None:
        db.session.add(Staff(user_id=user.id, assigned_by=admin.id))
    else:
        staff.assigned_by = admin.id

    return user