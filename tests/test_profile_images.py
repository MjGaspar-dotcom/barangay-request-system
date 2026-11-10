from io import BytesIO

from flask_jwt_extended import create_access_token
from PIL import Image

from app.extensions import db
from app.models import User


def _create_user(email):
    user = User(email=email, password_hash="unused")
    db.session.add(user)
    db.session.commit()
    return user


def _png_bytes():
    image = BytesIO()
    Image.new("RGB", (2, 2), color=(20, 100, 40)).save(image, format="PNG")
    return image.getvalue()


def test_resident_can_upload_and_fetch_own_profile_picture(app, client, tmp_path):
    with app.app_context():
        user = _create_user("profile-image@example.test")
        token = create_access_token(identity=str(user.id))
        app.config["PUBLIC_STORAGE_ROOT"] = str(tmp_path / "public")

    response = client.patch(
        "/api/profile",
        data={"profile_picture": (BytesIO(_png_bytes()), "avatar.png")},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.get_json()["data"]["profile_picture"]

    image_response = client.get(
        "/api/profile/image/profile_picture",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert image_response.status_code == 200
    assert image_response.mimetype == "image/png"
    assert image_response.data == _png_bytes()


def test_profile_image_endpoint_only_serves_the_authenticated_users_image(
    app, client, tmp_path
):
    with app.app_context():
        owner = _create_user("profile-image-owner@example.test")
        other_user = _create_user("profile-image-other@example.test")
        owner_token = create_access_token(identity=str(owner.id))
        other_token = create_access_token(identity=str(other_user.id))
        app.config["PUBLIC_STORAGE_ROOT"] = str(tmp_path / "public")

    upload_response = client.patch(
        "/api/profile",
        data={"valid_id_front": (BytesIO(_png_bytes()), "front.png")},
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    assert upload_response.status_code == 200

    owner_response = client.get(
        "/api/profile/image/valid_id_front",
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    other_response = client.get(
        "/api/profile/image/valid_id_front",
        headers={"Authorization": f"Bearer {other_token}"},
    )

    assert owner_response.status_code == 200
    assert owner_response.data == _png_bytes()
    assert other_response.status_code == 404


def test_profile_upload_rejects_non_image_files(app, client):
    with app.app_context():
        user = _create_user("invalid-profile-image@example.test")
        token = create_access_token(identity=str(user.id))

    response = client.patch(
        "/api/profile",
        data={"profile_picture": (BytesIO(b"not an image"), "avatar.png")},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 422
