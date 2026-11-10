from io import BytesIO

from flask_jwt_extended import create_access_token

from app.extensions import db
from app.models import Admin, BarangayRequest, DocumentType, User


def _create_workflow_request(status="Pending"):
    admin_user = User(
        username="media-workflow-admin",
        email="media-workflow-admin@example.test",
        password_hash="unused",
    )
    resident = User(
        username="media-workflow-resident",
        email="media-workflow-resident@example.test",
        password_hash="unused",
    )
    document_type = DocumentType(document_name=f"Workflow document {status}")
    db.session.add_all([admin_user, resident, document_type])
    db.session.flush()
    db.session.add(Admin(user_id=admin_user.id))
    item = BarangayRequest(
        tracking_number=f"BR-WORKFLOW-MEDIA-{status.replace(' ', '-')}",
        user_id=resident.id,
        document_type_id=document_type.document_type_id,
        purpose="Test complete document workflow",
        status=status,
        remarks="Please attach the missing file."
        if status == "Additional Requirements"
        else None,
    )
    db.session.add(item)
    db.session.commit()
    return admin_user, resident, item


def _headers(user):
    return {
        "Authorization": f"Bearer {create_access_token(identity=str(user.id))}"
    }


def test_admin_can_complete_preparation_authorization_and_release(
    app, client, tmp_path
):
    with app.app_context():
        admin_user, _, item = _create_workflow_request()
        app.config["PUBLIC_STORAGE_ROOT"] = str(tmp_path / "public")
        request_id = item.id
        headers = _headers(admin_user)

    review = client.post(
        f"/api/barangay-requests/{request_id}/requirements/verify",
        json={"requirements_complete": True},
        headers=headers,
    )
    assert review.status_code == 200

    approved = client.put(
        f"/api/barangay-requests/{request_id}",
        json={"status": "Approved", "remarks": "Requirements approved."},
        headers=headers,
    )
    assert approved.status_code == 200

    processing = client.put(
        f"/api/barangay-requests/{request_id}",
        json={"status": "Processing"},
        headers=headers,
    )
    assert processing.status_code == 200
    assert processing.get_json()["data"]["processing_started_at"] is not None

    prepared = client.post(
        f"/api/barangay-requests/{request_id}/documents/prepared",
        data={"document": (BytesIO(b"%PDF-prepared"), "prepared.pdf")},
        headers=headers,
        content_type="multipart/form-data",
    )
    assert prepared.status_code == 200
    assert prepared.get_json()["data"]["document_prepared_at"] is not None
    prepared_document = next(
        document
        for document in prepared.get_json()["data"]["documents"]
        if document["purpose"] == "prepared_document"
    )

    signed = client.post(
        f"/api/barangay-requests/{request_id}/documents/authorize",
        data={"document": (BytesIO(b"%PDF-signed"), "signed.pdf")},
        headers=headers,
        content_type="multipart/form-data",
    )
    assert signed.status_code == 200
    assert signed.get_json()["data"]["document_signed_at"] is not None

    preview = client.get(
        f"/api/barangay-requests/{request_id}/documents/"
        f"{prepared_document['request_document_id']}/view",
        headers=headers,
    )
    assert preview.status_code == 200
    assert preview.data == b"%PDF-prepared"

    ready = client.put(
        f"/api/barangay-requests/{request_id}",
        json={"status": "Ready for Pickup"},
        headers=headers,
    )
    assert ready.status_code == 200
    assert ready.get_json()["data"]["ready_for_pickup_at"] is not None

    completed = client.put(
        f"/api/barangay-requests/{request_id}",
        json={"status": "Completed", "recipient_name": "Test Resident"},
        headers=headers,
    )
    assert completed.status_code == 200
    final_data = completed.get_json()["data"]
    assert final_data["release_recipient_name"] == "Test Resident"
    assert final_data["claimed_at"] is not None
    assert final_data["history"]


def test_resident_resubmission_returns_request_to_pending_for_review(
    app, client, tmp_path
):
    with app.app_context():
        _, resident, item = _create_workflow_request("Additional Requirements")
        app.config["PUBLIC_STORAGE_ROOT"] = str(tmp_path / "public")
        request_id = item.id
        headers = _headers(resident)

    response = client.post(
        f"/api/barangay-requests/{request_id}/requirements/resubmit",
        data={
            "notes": "Here is the requested supporting document.",
            "documents[0]": (BytesIO(b"%PDF-supporting"), "supporting.pdf"),
        },
        headers=headers,
        content_type="multipart/form-data",
    )

    assert response.status_code == 200
    data = response.get_json()["data"]
    assert data["status"] == "Pending"
    assert data["verified_at"] is None
    assert data["requirements_complete"] is False
    assert any(
        document["purpose"] == "additional_requirement"
        for document in data["documents"]
    )
    assert any(event["action"] == "requirements_resubmitted" for event in data["history"])
