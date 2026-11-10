from flask_jwt_extended import create_access_token

from app.extensions import db
from app.models import BarangayRequest, DocumentType, Staff, User


def _create_request_fixture():
    staff_user = User(
        username="id-reviewer",
        email="id-reviewer@example.test",
        password_hash="unused",
    )
    resident = User(
        username="id-owner",
        email="id-owner@example.test",
        password_hash="unused",
        valid_id_front="resident-valid-ids/front.png",
    )
    other_resident = User(
        username="id-other",
        email="id-other@example.test",
        password_hash="unused",
    )
    document_type = DocumentType(document_name="ID image test document")
    db.session.add_all([staff_user, resident, other_resident, document_type])
    db.session.flush()
    db.session.add(Staff(user_id=staff_user.id))
    request = BarangayRequest(
        tracking_number="ID-MEDIA-REQUEST",
        user_id=resident.id,
        document_type_id=document_type.document_type_id,
        purpose="Review uploaded ID",
    )
    db.session.add(request)
    db.session.commit()
    return staff_user, resident, other_resident, request


def test_staff_can_fetch_id_image_from_configured_storage(app, client, tmp_path):
    with app.app_context():
        staff_user, _, _, request = _create_request_fixture()
        token = create_access_token(identity=str(staff_user.id))
        request_id = request.id
        storage_root = tmp_path / "public"
        image_path = storage_root / "resident-valid-ids" / "front.png"
        image_path.parent.mkdir(parents=True)
        image_path.write_bytes(b"test-image-bytes")
        app.config["PUBLIC_STORAGE_ROOT"] = str(storage_root)

    response = client.get(
        f"/api/barangay-requests/{request_id}/valid-id/front",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.mimetype == "image/png"
    assert response.data == b"test-image-bytes"


def test_resident_can_fetch_own_id_but_not_another_residents_id(app, client):
    with app.app_context():
        _, resident, other_resident, request = _create_request_fixture()
        own_token = create_access_token(identity=str(resident.id))
        other_token = create_access_token(identity=str(other_resident.id))
        request_id = request.id

    own_response = client.get(
        f"/api/barangay-requests/{request_id}/valid-id/front",
        headers={"Authorization": f"Bearer {own_token}"},
    )
    other_response = client.get(
        f"/api/barangay-requests/{request_id}/valid-id/front",
        headers={"Authorization": f"Bearer {other_token}"},
    )

    assert own_response.status_code == 404
    assert other_response.status_code == 403


def test_valid_id_endpoint_rejects_missing_auth_and_path_traversal(app, client):
    with app.app_context():
        staff_user, _, _, request = _create_request_fixture()
        token = create_access_token(identity=str(staff_user.id))
        request_id = request.id

    missing_auth = client.get(
        f"/api/barangay-requests/{request_id}/valid-id/front"
    )
    traversal = client.get(
        f"/api/barangay-requests/{request_id}/valid-id/../../config.py",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert missing_auth.status_code == 401
    assert traversal.status_code in {404, 308}
