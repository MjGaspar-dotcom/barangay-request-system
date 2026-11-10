from flask_jwt_extended import create_access_token

from app.extensions import db
from app.models import BarangayRequest, DocumentType, Staff, User


def test_staff_request_list_includes_request_id_for_detail_links(app, client):
    with app.app_context():
        staff_user = User(
            username="queue-staff",
            email="queue-staff@example.test",
            password_hash="unused",
        )
        resident = User(
            username="queue-resident",
            email="queue-resident@example.test",
            password_hash="unused",
        )
        document_type = DocumentType(document_name="Queue test document")
        db.session.add_all([staff_user, resident, document_type])
        db.session.flush()
        db.session.add(Staff(user_id=staff_user.id))
        request = BarangayRequest(
            tracking_number="QUEUE-REQUEST-001",
            user_id=resident.id,
            document_type_id=document_type.document_type_id,
            purpose="Test the detail link ID",
        )
        db.session.add(request)
        db.session.commit()
        request_id = request.id
        token = create_access_token(identity=str(staff_user.id))

    response = client.get(
        "/api/staff/requests",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    item = response.get_json()["data"][0]
    assert item["request_id"] == request_id
    assert item["id"] == request_id
