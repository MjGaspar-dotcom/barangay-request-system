# Debug: Authentication and authorization endpoint tests.
def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200


def test_register_and_login(client):
    response = client.post(
        "/api/register",
        json={
            "name": "Test Resident",
            "email": "resident@example.com",
            "password": "password123",
        },
    )
    assert response.status_code == 201

    response = client.post(
        "/api/login",
        json={
            "email": "resident@example.com",
            "password": "password123",
        },
    )
    assert response.status_code == 200
    assert response.get_json()["token"]

    token = response.get_json()["token"]
    me = client.get("/api/user", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200


def test_admin_document_type_crud(client, app):
    from app.extensions import db
    from app.models import User, DocumentType
    from flask_jwt_extended import create_access_token

    with app.app_context():
        admin = User(
            name="Admin",
            email="admin@example.com",
            password_hash="unused",
            role="admin",
            username="admin",
            verification_status="verified",
        )
        db.session.add(admin)
        db.session.commit()
        token = create_access_token(
            identity=str(admin.id), additional_claims={"role": "admin"}
        )

    headers = {"Authorization": f"Bearer {token}"}
    response = client.post(
        "/api/document-types",
        json={
            "document_name": "Certificate of Residency",
            "description": "Proof of residency",
            "processing_days": 3,
            "is_active": True,
        },
        headers=headers,
    )
    assert response.status_code == 201
    document_type_id = response.get_json()["data"]["document_type_id"]

    response = client.put(
        f"/api/document-types/{document_type_id}",
        json={
            "document_name": "Barangay Residency Certificate",
            "processing_days": 2,
            "is_active": True,
        },
        headers=headers,
    )
    assert response.status_code == 200

    response = client.delete(f"/api/document-types/{document_type_id}", headers=headers)
    assert response.status_code == 200
