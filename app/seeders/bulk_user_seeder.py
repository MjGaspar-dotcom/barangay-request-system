import csv
from datetime import datetime
from pathlib import Path

from app.extensions import db
from app.models.user import User
from app.utils.passwords import hash_password


def seed_bulk_users():
    csv_path = Path(__file__).with_name("test_users.csv")
    created = 0
    skipped = 0

    with csv_path.open(newline="", encoding="utf-8") as csv_file:
        for row in csv.DictReader(csv_file):
            if User.query.filter_by(username=row["username"]).first():
                skipped += 1
                continue

            db.session.add(
                User(
                    username=row["username"],
                    password_hash=hash_password("password123"),
                    first_name=row["first_name"],
                    middle_name=row["middle_name"] or None,
                    last_name=row["last_name"],
                    birth_date=datetime.strptime(row["birth_date"], "%Y-%m-%d").date(),
                    gender=row["gender"],
                    civil_status=row["civil_status"],
                    address=row["address"],
                    contact_number=row["contact_number"],
                    email=row["email"],
                    verification_status=row["verification_status"],
                    valid_id_type="Barangay ID",
                )
            )
            created += 1

    return created, skipped
