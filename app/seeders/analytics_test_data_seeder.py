import calendar
from datetime import datetime, timedelta, timezone

from sqlalchemy import column, select, table
from app.extensions import db
from app.models.barangay_request import BarangayRequest
from app.models.document_type import DocumentType
from app.models.user import User


REQUEST_COUNT = 100
TRACKING_PREFIX = "BR-SYNTH-ANALYTICS-"
STATUSES = (
    "Pending",
    "Approved",
    "Processing",
    "Ready for Pickup",
    "Completed",
    "Rejected",
)


def _month_offset(value: datetime, months: int) -> datetime:
    month_index = value.year * 12 + value.month - 1 + months
    year, month = divmod(month_index, 12)
    return value.replace(year=year, month=month + 1, day=1)


def seed_analytics_test_data() -> tuple[int, int]:
    user = User.query.filter_by(username="resident").first()
    document_type_ids = [
        document_type.document_type_id
        for document_type in DocumentType.query.filter_by(is_active=True)
        .order_by(DocumentType.document_type_id)
        .all()
    ]

    if user is None:
        raise RuntimeError(
            "Seed the resident account before adding analytics test requests."
        )
    if not document_type_ids:
        raise RuntimeError(
            "Create an active document type before adding analytics test requests."
        )

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    first_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    first_month = _month_offset(first_month, -5)
    tracking_numbers = [
        f"{TRACKING_PREFIX}{number:03d}"
        for number in range(1, REQUEST_COUNT + 1)
    ]
    requests_table = table("barangay_requests", column("tracking_number"))
    tracking_number_column = requests_table.c.tracking_number
    existing_numbers = set(
        db.session.scalars(
            select(tracking_number_column).where(
                tracking_number_column.in_(tracking_numbers)
            )
        ).all()
    )

    records: list[BarangayRequest] = []
    for number, tracking_number in enumerate(tracking_numbers, start=1):
        if tracking_number in existing_numbers:
            continue

        month_start = _month_offset(first_month, (number - 1) * 6 // REQUEST_COUNT)
        last_day = (
            now.day
            if month_start.year == now.year and month_start.month == now.month
            else calendar.monthrange(month_start.year, month_start.month)[1]
        )
        day = ((number * 7 - 1) % last_day) + 1
        created_at = month_start.replace(
            day=day,
            hour=8 + number % 10,
            minute=(number * 13) % 60,
        )
        if created_at > now:
            created_at = now - timedelta(minutes=number)

        status = STATUSES[(number - 1) % len(STATUSES)]
        approved_at = (
            created_at + timedelta(days=1)
            if status in ("Approved", "Processing", "Ready for Pickup", "Completed")
            else None
        )
        ready_at = (
            created_at + timedelta(days=2)
            if status in ("Ready for Pickup", "Completed")
            else None
        )

        records.append(
            BarangayRequest(
                tracking_number=tracking_number,
                user_id=user.id,
                document_type_id=document_type_ids[(number - 1) % len(document_type_ids)],
                purpose=f"Synthetic analytics test data request {number:03d}",
                status=status,
            )
        )
        request = records[-1]
        request.verified_at = approved_at
        request.approved_at = approved_at
        request.ready_for_pickup_at = ready_at
        request.claimed_at = (
            created_at + timedelta(days=3) if status == "Completed" else None
        )
        request.created_at = created_at
        request.updated_at = created_at

    if records:
        with db.session.begin_nested():
            db.session.add_all(records)
            db.session.flush()

    return len(records), len(existing_numbers)
