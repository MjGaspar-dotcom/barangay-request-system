from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import DateTime, column, func, inspect, literal, select, table, text
from sqlalchemy.sql.elements import ColumnElement

from app.extensions import db


PERIODS = {"daily", "weekly", "monthly", "yearly", "custom"}
REQUESTS = table(
    "barangay_requests",
    column("created_at", DateTime),
    column("deleted_at", DateTime),
)


class DocumentRequestTrendService:
    @classmethod
    def get_trends(
        cls,
        period: str,
        start_date: str | None = None,
        end_date: str | None = None,
        *,
        now: datetime | None = None,
    ) -> dict[str, Any]:
        current = now or datetime.now(timezone.utc).replace(tzinfo=None)
        start, end_exclusive, bucket_period = cls._range(
            period, current, start_date, end_date
        )
        points = cls._empty_points(start, end_exclusive, period)
        counts = cls._aggregate_counts(start, end_exclusive, bucket_period)
        for key, count in counts.items():
            if key in points:
                points[key]["count"] = count

        point_list = list(points.values())
        total = sum(point["count"] for point in point_list)
        peak = max(point_list, key=lambda point: point["count"], default=None)
        if total == 0:
            peak = None

        period_days = (end_exclusive.date() - start.date()).days
        comparison_start = start - timedelta(days=period_days)
        previous_total = sum(
            cls._aggregate_counts(comparison_start, start, bucket_period).values()
        )
        comparison = {
            "previous_start_date": comparison_start.date().isoformat(),
            "previous_end_date": (start - timedelta(days=1)).date().isoformat(),
            "previous_total": previous_total,
            "percentage": (
                round(((total - previous_total) / previous_total) * 100, 1)
                if previous_total > 0
                else None
            ),
            "direction": (
                "no_previous_data"
                if previous_total == 0
                else "increase"
                if total > previous_total
                else "decrease"
                if total < previous_total
                else "same"
            ),
        }

        return {
            "period": period,
            "start_date": start.date().isoformat(),
            "end_date": (end_exclusive - timedelta(days=1)).date().isoformat(),
            "points": point_list,
            "summary": {
                "total_requests": total,
                "average_requests": (
                    round(total / len(point_list), 2) if point_list else 0
                ),
                "peak_period": peak,
                "comparison": comparison,
            },
        }

    @classmethod
    def _range(
        cls,
        period: str,
        now: datetime,
        start_date: str | None,
        end_date: str | None,
    ) -> tuple[datetime, datetime, str]:
        if period == "custom":
            if start_date is None or end_date is None:
                raise ValueError("Both start_date and end_date are required.")
            start_day = datetime.strptime(start_date, "%Y-%m-%d").date()
            end_day = datetime.strptime(end_date, "%Y-%m-%d").date()
            if end_day < start_day:
                raise ValueError("End date must be on or after start date.")
            if (end_day - start_day).days > 365:
                raise ValueError("The selected date range cannot exceed 366 days.")
            return (
                datetime.combine(start_day, datetime.min.time()),
                datetime.combine(end_day + timedelta(days=1), datetime.min.time()),
                "daily",
            )

        today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        if period == "daily":
            end = today + timedelta(days=1)
            return end - timedelta(days=7), end, "daily"
        if period == "weekly":
            current_week = today - timedelta(days=today.weekday())
            end = current_week + timedelta(weeks=1)
            return end - timedelta(weeks=8), end, "weekly"
        if period == "monthly":
            current_month = today.replace(day=1)
            end = cls._add_months(current_month, 1)
            return cls._add_months(end, -12), end, "monthly"
        if period == "yearly":
            first_request = cls._first_request_date()
            first_year = (first_request or now).replace(
                month=1, day=1, hour=0, minute=0, second=0, microsecond=0
            )
            end = now.replace(
                year=now.year + 1,
                month=1,
                day=1,
                hour=0,
                minute=0,
                second=0,
                microsecond=0,
            )
            return first_year, end, "yearly"
        raise ValueError("Invalid period.")

    @staticmethod
    def _add_months(value: datetime, months: int) -> datetime:
        month_index = value.year * 12 + value.month - 1 + months
        year, month = divmod(month_index, 12)
        return value.replace(year=year, month=month + 1, day=1)

    @classmethod
    def _first_request_date(cls) -> datetime | None:
        statement = select(func.min(REQUESTS.c.created_at))
        if cls._has_deleted_at():
            statement = statement.where(REQUESTS.c.deleted_at.is_(None))
        return db.session.execute(statement).scalar_one_or_none()

    @classmethod
    def _has_deleted_at(cls) -> bool:
        inspector = inspect(db.engine)
        return inspector.has_table("barangay_requests") and any(
            item["name"] == "deleted_at"
            for item in inspector.get_columns("barangay_requests")
        )

    @classmethod
    def _aggregate_counts(
        cls, start: datetime, end_exclusive: datetime, period: str
    ) -> dict[str, int]:
        bucket = cls._bucket_expression(period).label("period")
        statement = (
            select(bucket, func.count().label("request_count"))
            .select_from(REQUESTS)
            .where(REQUESTS.c.created_at >= start)
            .where(REQUESTS.c.created_at < end_exclusive)
            .group_by(bucket)
            .order_by(bucket)
        )
        if cls._has_deleted_at():
            statement = statement.where(REQUESTS.c.deleted_at.is_(None))

        return {
            str(row.period): int(row.request_count)
            for row in db.session.execute(statement)
        }

    @staticmethod
    def _bucket_expression(period: str) -> ColumnElement[Any]:
        created_at = REQUESTS.c.created_at
        dialect = db.engine.dialect.name

        if dialect == "sqlite":
            if period == "weekly":
                return func.date(
                    created_at,
                    text(
                        "'-' || ((CAST(strftime('%w', created_at) AS INTEGER) + 6) % 7) || ' days'"
                    ),
                )
            if period == "monthly":
                return func.strftime(literal("%Y-%m-01"), created_at)
            if period == "yearly":
                return func.strftime(literal("%Y-01-01"), created_at)
            return func.date(created_at)

        if dialect == "postgresql":
            if period in {"weekly", "monthly", "yearly"}:
                unit = {
                    "weekly": "week",
                    "monthly": "month",
                    "yearly": "year",
                }[period]
                format_string = {
                    "weekly": "YYYY-MM-DD",
                    "monthly": "YYYY-MM-01",
                    "yearly": "YYYY-01-01",
                }[period]
                return func.to_char(
                    func.date_trunc(unit, created_at), literal(format_string)
                )
            return func.to_char(created_at, literal("YYYY-MM-DD"))

        if period == "weekly":
            return func.date_format(
                func.date_sub(
                    created_at, text("INTERVAL WEEKDAY(created_at) DAY")
                ),
                literal("%Y-%m-%d"),
            )
        if period == "monthly":
            return func.date_format(created_at, literal("%Y-%m-01"))
        if period == "yearly":
            return func.date_format(created_at, literal("%Y-01-01"))
        return func.date(created_at)

    @classmethod
    def _empty_points(
        cls, start: datetime, end_exclusive: datetime, period: str
    ) -> dict[str, dict[str, Any]]:
        cursor = start
        if period == "weekly":
            cursor -= timedelta(days=cursor.weekday())
        elif period == "monthly":
            cursor = cursor.replace(day=1)
        elif period == "yearly":
            cursor = cursor.replace(month=1, day=1)

        points: dict[str, dict[str, Any]] = {}
        while cursor < end_exclusive:
            if period == "weekly":
                key = cursor.date().isoformat()
                label = f"{cursor.strftime('%b')} {cursor.day}"
                tooltip_label = f"Week of {cursor.strftime('%b')} {cursor.day}, {cursor.year}"
                next_cursor = cursor + timedelta(weeks=1)
            elif period == "monthly":
                key = cursor.strftime("%Y-%m-01")
                label = cursor.strftime("%b %Y")
                tooltip_label = cursor.strftime("%B %Y")
                next_cursor = cls._add_months(cursor, 1)
            elif period == "yearly":
                key = cursor.strftime("%Y-01-01")
                label = cursor.strftime("%Y")
                tooltip_label = cursor.strftime("%Y")
                next_cursor = cursor.replace(year=cursor.year + 1)
            else:
                key = cursor.date().isoformat()
                label = cursor.strftime("%b") + f" {cursor.day}"
                tooltip_label = cursor.strftime("%B") + f" {cursor.day}, {cursor.year}"
                next_cursor = cursor + timedelta(days=1)

            points[key] = {
                "period": key,
                "label": label,
                "tooltip_label": tooltip_label,
                "count": 0,
            }
            cursor = next_cursor

        return points
