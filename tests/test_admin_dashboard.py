from datetime import datetime

from flask_jwt_extended import create_access_token

from app.extensions import db
from app.models import (
    Admin,
    AuditLog,
    BarangayRequest,
    DocumentType,
    Staff,
    User,
)


def _admin_headers():
    admin = User(
        username="dashboard-admin",
        email="dashboard-admin@example.test",
        password_hash="unused",
    )
    db.session.add(admin)
    db.session.flush()
    profile = Admin()
    profile.user_id = admin.id
    db.session.add(profile)
    db.session.commit()
    token = create_access_token(identity=str(admin.id))
    return {"Authorization": f"Bearer {token}"}


def test_admin_dashboard_stats_match_frontend_contract_and_exclude_deleted(app, client):
    with app.app_context():
        headers = _admin_headers()
        resident = User(email="dashboard-resident@example.test", password_hash="unused")
        staff_user = User(email="dashboard-staff@example.test", password_hash="unused")
        active_type = DocumentType(document_name="Active document")
        inactive_type = DocumentType(
            document_name="Inactive document", is_active=False
        )
        db.session.add_all([resident, staff_user, active_type, inactive_type])
        db.session.flush()
        db.session.add(Staff(user_id=staff_user.id))
        db.session.add_all(
            [
                BarangayRequest(
                    tracking_number="DASHBOARD-KEPT",
                    user_id=resident.id,
                    document_type_id=active_type.document_type_id,
                    purpose="Keep this request",
                    status="Pending",
                ),
                BarangayRequest(
                    tracking_number="DASHBOARD-DELETED",
                    user_id=resident.id,
                    document_type_id=active_type.document_type_id,
                    purpose="Exclude this request",
                    status="Completed",
                ),
            ]
        )
        db.session.add(AuditLog(action="created", details="Created a request"))
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
                "deleted_at": datetime(2026, 11, 9),
                "tracking_number": "DASHBOARD-DELETED",
            },
        )
        db.session.commit()

        response = client.get("/api/admin/stats", headers=headers)

        assert response.status_code == 200
        stats = response.get_json()["data"]
        assert stats["total_registered_requests"] == 1
        assert stats["total_residents"] == 1
        assert stats["total_staff"] == 1
        assert stats["active_document_types"] == 1
        assert stats["total_audit_logs"] == 1
        assert stats["pending_requests"] == 1
        assert stats["completed_requests"] == 0
        assert stats["requests"] == 2
        assert stats["pending"] == 1


def test_recent_activity_returns_paginated_contract_and_filters_action(app, client):
    with app.app_context():
        headers = _admin_headers()
        db.session.add_all(
            [
                AuditLog(action="created", details="First"),
                AuditLog(action="deleted", details="Second"),
                AuditLog(action="created", details="Third"),
            ]
        )
        db.session.commit()

        response = client.get(
            "/api/admin/recent-activity",
            query_string={"page": 1, "per_page": 1, "action": "created"},
            headers=headers,
        )

        assert response.status_code == 200
        payload = response.get_json()["data"]
        assert payload["total"] == 2
        assert payload["current_page"] == 1
        assert payload["last_page"] == 2
        assert len(payload["data"]) == 1
        assert payload["data"][0]["description"] in {"First", "Third"}


def test_recent_activity_rejects_invalid_pagination(app, client):
    with app.app_context():
        headers = _admin_headers()

    response = client.get(
        "/api/admin/recent-activity?per_page=101",
        headers=headers,
    )

    assert response.status_code == 422
