from flask_jwt_extended import create_access_token

from app.extensions import db
from app.models import Admin, BarangayRequest, DocumentType, Staff, User


def _create_request_fixture():
    admin_user = User(
        username="review-admin",
        email="review-admin@example.test",
        password_hash="unused",
    )
    staff_user = User(
        username="review-staff",
        email="review-staff@example.test",
        password_hash="unused",
    )
    resident = User(
        username="review-resident",
        email="review-resident@example.test",
        password_hash="unused",
    )
    document_type = DocumentType(document_name="Requirements review test")
    db.session.add_all([admin_user, staff_user, resident, document_type])
    db.session.flush()
    db.session.add_all(
        [Admin(user_id=admin_user.id), Staff(user_id=staff_user.id)]
    )
    request = BarangayRequest(
        tracking_number="BR-REQUIREMENTS-0001",
        user_id=resident.id,
        document_type_id=document_type.document_type_id,
        purpose="Test requirements review",
    )
    db.session.add(request)
    db.session.commit()
    return admin_user, staff_user, request


def test_staff_can_record_complete_requirements_without_changing_pending_status(
    app, client
):
    with app.app_context():
        _, staff_user, request = _create_request_fixture()
        headers = {
            "Authorization": f"Bearer {create_access_token(identity=str(staff_user.id))}"
        }
        request_id = request.id

    response = client.post(
        f"/api/barangay-requests/{request_id}/requirements/verify",
        json={"requirements_complete": True},
        headers=headers,
    )

    assert response.status_code == 200
    data = response.get_json()["data"]
    assert data["status"] == "Pending"
    assert data["requirements_complete"] is True
    assert data["verified_at"] is not None
    assert data["verified_by"] is not None


def test_admin_can_record_incomplete_requirements_and_request_additional_items(
    app, client
):
    with app.app_context():
        admin_user, _, request = _create_request_fixture()
        headers = {
            "Authorization": f"Bearer {create_access_token(identity=str(admin_user.id))}"
        }
        request_id = request.id

    review_response = client.post(
        f"/api/barangay-requests/{request_id}/requirements/verify",
        json={"requirements_complete": False},
        headers=headers,
    )
    assert review_response.status_code == 200
    assert review_response.get_json()["data"]["status"] == "Pending"

    decision_response = client.put(
        f"/api/barangay-requests/{request_id}",
        json={
            "status": "Additional Requirements",
            "remarks": "Please submit the missing document.",
        },
        headers=headers,
    )

    assert decision_response.status_code == 200
    assert decision_response.get_json()["data"]["status"] == "Additional Requirements"


def test_requirement_review_requires_staff_or_admin_and_boolean_value(app, client):
    with app.app_context():
        admin_user, _, request = _create_request_fixture()
        resident = User(
            username="review-only-resident",
            email="review-only-resident@example.test",
            password_hash="unused",
        )
        db.session.add(resident)
        db.session.commit()
        resident_headers = {
            "Authorization": f"Bearer {create_access_token(identity=str(resident.id))}"
        }
        admin_headers = {
            "Authorization": f"Bearer {create_access_token(identity=str(admin_user.id))}"
        }
        request_id = request.id

    forbidden_response = client.post(
        f"/api/barangay-requests/{request_id}/requirements/verify",
        json={"requirements_complete": "true"},
        headers=resident_headers,
    )
    invalid_value_response = client.post(
        f"/api/barangay-requests/{request_id}/requirements/verify",
        json={"requirements_complete": "true"},
        headers=admin_headers,
    )

    assert forbidden_response.status_code == 403
    assert invalid_value_response.status_code == 422
