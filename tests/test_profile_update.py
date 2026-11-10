from datetime import date

from flask_jwt_extended import create_access_token

from app.extensions import db
from app.models import User


def _create_user():
    user = User(
        username="profile-editor",
        first_name="Original",
        middle_name="Middle",
        last_name="Name",
        email="profile-editor@example.test",
        password_hash="unused",
    )
    db.session.add(user)
    db.session.commit()
    return user


def test_resident_can_update_personal_information(app, client):
    with app.app_context():
        user = _create_user()
        token = create_access_token(identity=str(user.id))

    response = client.patch(
        "/api/profile",
        json={
            "first_name": "Updated",
            "middle_name": "New",
            "last_name": "Resident",
            "contact_number": "09171234567",
            "address": "123 Sample Street",
            "birth_date": "1990-04-15",
            "gender": "Female",
            "civil_status": "Single",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.get_json()["data"]
    assert data["first_name"] == "Updated"
    assert data["middle_name"] == "New"
    assert data["last_name"] == "Resident"
    assert data["contact_number"] == "09171234567"
    assert data["address"] == "123 Sample Street"
    assert data["birth_date"] == "1990-04-15"
    assert data["gender"] == "Female"
    assert data["civil_status"] == "Single"


def test_profile_update_rejects_invalid_or_future_birth_date(app, client):
    with app.app_context():
        user = _create_user()
        token = create_access_token(identity=str(user.id))

    invalid_date = client.patch(
        "/api/profile",
        json={"birth_date": "not-a-date"},
        headers={"Authorization": f"Bearer {token}"},
    )
    future_date = client.patch(
        "/api/profile",
        json={"birth_date": date.today().replace(year=date.today().year + 1).isoformat()},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert invalid_date.status_code == 422
    assert future_date.status_code == 422
