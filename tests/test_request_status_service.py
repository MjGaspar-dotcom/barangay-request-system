from datetime import datetime

from flask_jwt_extended import create_access_token

from app.extensions import db
from app.models import Admin, BarangayRequest, DocumentType, User


def test_admin_can_complete_request_and_record_recipient(app, client):
    with app.app_context():
        admin_user = User(
            username="workflow-admin",
            email="workflow-admin@example.test",
            password_hash="unused",
        )
        resident = User(
            username="workflow-resident",
            email="workflow-resident@example.test",
            password_hash="unused",
        )
        document_type = DocumentType(document_name="Workflow test document")
        db.session.add_all([admin_user, resident, document_type])
        db.session.flush()
        db.session.add(Admin(user_id=admin_user.id))
        request = BarangayRequest(
            tracking_number="BR-WORKFLOW-0001",
            user_id=resident.id,
            document_type_id=document_type.document_type_id,
            purpose="Test completed workflow",
            status="Ready for Pickup",
        )
        request.ready_for_pickup_at = datetime.utcnow()
        request.document_signed_at = datetime.utcnow()
        db.session.add(request)
        db.session.commit()

        headers = {
            "Authorization": f"Bearer {create_access_token(identity=str(admin_user.id))}"
        }
        request_id = request.id

    response = client.put(
        f"/api/barangay-requests/{request_id}",
        json={"status": "Completed", "recipient_name": "Test Resident"},
        headers=headers,
    )

    assert response.status_code == 200
    data = response.get_json()["data"]
    assert data["status"] == "Completed"
    assert data["claimed_at"] is not None
    assert data["completed_at"] == data["claimed_at"]
    assert data["release_recipient_name"] == "Test Resident"
