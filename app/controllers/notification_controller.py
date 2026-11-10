# Debug: Notification endpoints.
from datetime import datetime, timezone

from flask import request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.extensions import db
from app.models import Notification, User
from app.controllers.base import success, failure


def utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


@jwt_required()
def notifications():
    user = db.session.get(User, int(get_jwt_identity()))
    if not user:
        return failure("User not found", 404)
    try:
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 20))
    except ValueError:
        return failure("Page and per_page must be integers.", 422)

    if page < 1 or per_page < 1 or per_page > 100:
        return failure("Page must be positive and per_page must be between 1 and 100.", 422)

    pagination = (
        Notification.query.filter_by(user_id=user.id)
        .order_by(Notification.created_at.desc())
        .paginate(page=page, per_page=per_page, error_out=False)
    )
    return success(
        {
            "data": [item.to_dict() for item in pagination.items],
            "current_page": pagination.page,
            "last_page": max(1, pagination.pages),
            "per_page": pagination.per_page,
            "total": pagination.total,
        }
    )


@jwt_required()
def unread_count():
    user = db.session.get(User, int(get_jwt_identity()))
    if not user:
        return failure("User not found", 404)
    count = Notification.query.filter_by(user_id=user.id, is_read=False).count()
    return success({"unread_count": count})


@jwt_required()
def read_all_notifications():
    user = db.session.get(User, int(get_jwt_identity()))
    if not user:
        return failure("User not found", 404)
    Notification.query.filter_by(user_id=user.id).update(
        {"is_read": True, "read_at": utc_now()}
    )
    db.session.commit()
    return success(message="Notifications marked as read")


@jwt_required()
def read_notification(notification_id):
    user = db.session.get(User, int(get_jwt_identity()))
    if not user:
        return failure("User not found", 404)
    item = db.session.get(Notification, notification_id)
    if not item or item.user_id != user.id:
        return failure("Notification not found", 404)
    item.is_read = True
    item.read_at = utc_now()
    db.session.commit()
    return success(item.to_dict())
