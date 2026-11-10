from datetime import datetime

from flask import jsonify, request

from app.controllers.base import failure
from app.middleware.roles import role_required
from app.services.document_request_trend_service import (
    PERIODS,
    DocumentRequestTrendService,
)


@role_required("admin")
def document_request_trends(_user):
    del _user
    period = request.args.get("period", "")
    if period not in PERIODS:
        return failure(
            "Validation failed",
            422,
            {"period": ["Select a valid reporting period."]},
        )

    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    if period == "custom":
        errors: dict[str, list[str]] = {}
        parsed_dates: dict[str, datetime] = {}
        for field, value in (("start_date", start_date), ("end_date", end_date)):
            if not value:
                errors[field] = ["This field is required."]
                continue
            try:
                parsed_date = datetime.strptime(value, "%Y-%m-%d")
                if parsed_date.strftime("%Y-%m-%d") != value:
                    raise ValueError
                parsed_dates[field] = parsed_date
            except ValueError:
                errors[field] = ["Use the YYYY-MM-DD date format."]

        if not errors:
            if parsed_dates["end_date"] < parsed_dates["start_date"]:
                errors["end_date"] = ["End date must be on or after start date."]
            elif (parsed_dates["end_date"] - parsed_dates["start_date"]).days > 365:
                errors["end_date"] = [
                    "The selected date range cannot exceed 366 days."
                ]
        if errors:
            return failure("Validation failed", 422, errors)

    result = DocumentRequestTrendService.get_trends(
        period, start_date=start_date, end_date=end_date
    )
    return jsonify({"success": True, "data": result})
