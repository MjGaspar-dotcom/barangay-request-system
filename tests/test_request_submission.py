from flask_jwt_extended import create_access_token

from app.extensions import db
from app.models import DocumentType, Notification, Staff, User


def test_verified_resident_can_submit_request_when_staff_are_notified(app, client):
    with app.app_context():
        resident = User(
            username="request-resident",
            email="request-resident@example.test",
            password_hash="unused",
            verification_status="verified",
        )
        staff_user = User(
            username="request-staff",
            email="request-staff@example.test",
            password_hash="unused",
            role="staff",
        )
        document_type = DocumentType(document_name="Request submission test")
        db.session.add_all([resident, staff_user, document_type])
        db.session.flush()
        db.session.add(Staff(user_id=staff_user.id))
        db.session.commit()
        token = create_access_token(identity=str(resident.id))
        document_type_id = document_type.document_type_id
        staff_user_id = staff_user.id

    response = client.post(
        "/api/barangay-requests",
        json={
            "document_type_id": document_type_id,
            "purpose": "Employment requirement",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 201
    request_data = response.get_json()["data"]["request"]
    assert request_data["purpose"] == "Employment requirement"

    with app.app_context():
        notification = Notification.query.filter_by(user_id=staff_user_id).one()
        assert notification.type == "new_request_for_staff"
        assert notification.request_id == request_data["request_id"]
