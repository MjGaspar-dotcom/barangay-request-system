from flask_jwt_extended import create_access_token

from app.extensions import db
from app.models import Notification, User


def _create_user_and_token(email):
    user = User(email=email, password_hash="unused")
    db.session.add(user)
    db.session.commit()
    return user, create_access_token(identity=str(user.id))


def test_notification_center_endpoints_match_frontend_contract(app, client):
    with app.app_context():
        user, token = _create_user_and_token("notification-user@example.test")
        db.session.add_all(
            [
                Notification(
                    user_id=user.id,
                    title="Unread update",
                    message="A request was updated.",
                ),
                Notification(
                    user_id=user.id,
                    title="Read update",
                    message="Another request was updated.",
                    is_read=True,
                ),
            ]
        )
        db.session.commit()
        headers = {"Authorization": f"Bearer {token}"}

    notifications_response = client.get(
        "/api/notifications?per_page=5", headers=headers
    )
    unread_response = client.get("/api/notifications/unread-count", headers=headers)

    assert notifications_response.status_code == 200
    page = notifications_response.get_json()["data"]
    assert page["total"] == 2
    assert len(page["data"]) == 2
    assert all("notification_id" in item for item in page["data"])
    assert unread_response.status_code == 200
    assert unread_response.get_json()["data"]["unread_count"] == 1


def test_notification_mark_read_uses_notification_id_and_owner(app, client):
    with app.app_context():
        user, token = _create_user_and_token("notification-owner@example.test")
        notification = Notification(
            user_id=user.id,
            title="Request update",
            message="Your request was updated.",
        )
        db.session.add(notification)
        db.session.commit()
        notification_id = notification.id

    response = client.patch(
        f"/api/notifications/{notification_id}/read",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.get_json()["data"]["notification_id"] == notification_id
    assert response.get_json()["data"]["is_read"] is True


def test_notifications_reject_invalid_pagination(app, client):
    with app.app_context():
        _, token = _create_user_and_token("notification-page@example.test")

    response = client.get(
        "/api/notifications?per_page=101",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 422
