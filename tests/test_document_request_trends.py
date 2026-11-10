from datetime import datetime

from flask_jwt_extended import create_access_token

from app.extensions import db
from app.models import Admin, BarangayRequest, DocumentType, User
from app.services.document_request_trend_service import DocumentRequestTrendService


def _create_request(user_id, document_type_id, tracking_number, created_at):
    request = BarangayRequest(
        tracking_number=tracking_number,
        user_id=user_id,
        document_type_id=document_type_id,
        purpose="Testing analytics",
    )
    request.created_at = created_at
    db.session.add(request)


def _create_request_data():
    user = User(email="trends@example.test", password_hash="unused")
    document_type = DocumentType(document_name="Analytics test document")
    db.session.add_all([user, document_type])
    db.session.flush()
    return user, document_type


def test_daily_trends_include_zeroes_and_compare_previous_period(app):
    with app.app_context():
        user, document_type = _create_request_data()
        _create_request(
            user.id,
            document_type.document_type_id,
            "TREND-CURRENT-1",
            datetime(2026, 11, 2, 9),
        )
        _create_request(
            user.id,
            document_type.document_type_id,
            "TREND-CURRENT-2",
            datetime(2026, 11, 8, 9),
        )
        _create_request(
            user.id,
            document_type.document_type_id,
            "TREND-PREVIOUS-1",
            datetime(2026, 10, 30, 9),
        )
        db.session.commit()

        result = DocumentRequestTrendService.get_trends(
            "daily", now=datetime(2026, 11, 8, 12)
        )

        assert result["start_date"] == "2026-11-02"
        assert result["end_date"] == "2026-11-08"
        assert len(result["points"]) == 7
        assert result["summary"]["total_requests"] == 2
        assert result["summary"]["comparison"]["previous_total"] == 1
        assert result["summary"]["comparison"]["percentage"] == 100.0
        assert result["summary"]["peak_period"]["period"] == "2026-11-02"


def test_weekly_and_monthly_trends_bucket_requests_correctly(app):
    with app.app_context():
        user, document_type = _create_request_data()
        _create_request(
            user.id,
            document_type.document_type_id,
            "TREND-WEEK-1",
            datetime(2026, 11, 2, 9),
        )
        _create_request(
            user.id,
            document_type.document_type_id,
            "TREND-WEEK-2",
            datetime(2026, 11, 8, 9),
        )
        db.session.commit()

        weekly = DocumentRequestTrendService.get_trends(
            "weekly", now=datetime(2026, 11, 8, 12)
        )
        monthly = DocumentRequestTrendService.get_trends(
            "monthly", now=datetime(2026, 11, 8, 12)
        )

        weekly_point = next(
            point for point in weekly["points"] if point["period"] == "2026-11-02"
        )
        monthly_point = next(
            point for point in monthly["points"] if point["period"] == "2026-11-01"
        )
        assert weekly_point["count"] == 2
        assert monthly_point["count"] == 2


def test_custom_trends_exclude_soft_deleted_requests_when_column_exists(app):
    with app.app_context():
        user, document_type = _create_request_data()
        _create_request(
            user.id,
            document_type.document_type_id,
            "TREND-KEPT",
            datetime(2026, 11, 3, 9),
        )
        _create_request(
            user.id,
            document_type.document_type_id,
            "TREND-DELETED",
            datetime(2026, 11, 3, 12),
        )
        db.session.commit()
        db.session.execute(
            db.text("ALTER TABLE barangay_requests ADD COLUMN deleted_at DATETIME")
        )
        db.session.execute(
            db.text(
                "UPDATE barangay_requests SET deleted_at = :deleted_at "
                "WHERE tracking_number = :tracking_number"
            ),
            {
                "deleted_at": datetime(2026, 11, 4),
                "tracking_number": "TREND-DELETED",
            },
        )
        db.session.commit()

        result = DocumentRequestTrendService.get_trends(
            "custom",
            "2026-11-03",
            "2026-11-03",
            now=datetime(2026, 11, 8),
        )

        assert len(result["points"]) == 1
        assert result["points"][0]["count"] == 1
        assert result["summary"]["total_requests"] == 1


def test_trend_endpoint_requires_admin_and_returns_frontend_contract(client, app):
    assert client.get("/api/admin/analytics/document-request-trends?period=daily").status_code == 401

    with app.app_context():
        admin_user = User(
            username="analytics-admin",
            email="analytics-admin@example.test",
            password_hash="unused",
        )
        db.session.add(admin_user)
        db.session.flush()
        admin_profile = Admin()
        admin_profile.user_id = admin_user.id
        db.session.add(admin_profile)
        db.session.commit()
        token = create_access_token(identity=str(admin_user.id))

    response = client.get(
        "/api/admin/analytics/document-request-trends?period=daily",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    payload = response.get_json()
    assert payload["success"] is True
    assert isinstance(payload["data"]["points"], list)
    assert "summary" in payload["data"]


def test_custom_trend_endpoint_validates_range(client, app):
    with app.app_context():
        admin_user = User(
            username="analytics-admin",
            email="analytics-admin@example.test",
            password_hash="unused",
        )
        db.session.add(admin_user)
        db.session.flush()
        admin_profile = Admin()
        admin_profile.user_id = admin_user.id
        db.session.add(admin_profile)
        db.session.commit()
        token = create_access_token(identity=str(admin_user.id))

    response = client.get(
        "/api/admin/analytics/document-request-trends",
        query_string={
            "period": "custom",
            "start_date": "2025-01-01",
            "end_date": "2026-01-02",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 422
    assert "end_date" in response.get_json()["errors"]
