import csv
from pathlib import Path

from app.extensions import db
from app.models.barangay_request import BarangayRequest
from app.models.user import User
from app.services.tracking_number_service import TrackingNumberService


def seed_bulk_requests():
    csv_path = Path(__file__).with_name("test_requests.csv")
    created = 0
    skipped = 0

    with csv_path.open(newline="", encoding="utf-8") as csv_file:
        for row in csv.DictReader(csv_file):
            user = User.query.filter_by(username=row["username"]).first()
            if user is None:
                skipped += 1
                continue

            db.session.add(
                BarangayRequest(
                    user_id=user.id,
                    document_type_id=int(row["document_type_id"]),
                    tracking_number=TrackingNumberService.generate(),
                    purpose=row["purpose"],
                    status=row["status"],
                )
            )
            created += 1

    return created, skipped
