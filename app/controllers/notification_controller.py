# Debug: Notification endpoints.
from datetime import datetime, date
import re
from flask import jsonify, request
from flask_jwt_extended import (
    create_access_token,
    get_jwt,
    get_jwt_identity,
    jwt_required,
)

from app.extensions import db
from app.models import (
    User,
    DocumentType,
    BarangayRequest,
    Notification,
    AuditLog,
    Staff,
)
from app.services.tracking_number_service import TrackingNumberService
from app.services.request_status_service import RequestStatusService
from app.utils.passwords import hash_password, verify_password
from app.controllers.base import success, failure, role_required


@jwt_required()
def notifications():
    user = db.session.get(User, int(get_jwt_identity()))
    items = (
        Notification.query.filter_by(user_id=user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )
    return success([item.to_dict() for item in items])


@jwt_required()
def unread_count():
    user = db.session.get(User, int(get_jwt_identity()))
    count = Notification.query.filter_by(user_id=user.id, is_read=False).count()
    return success({"count": count})


@jwt_required()
def read_all_notifications():
    user = db.session.get(User, int(get_jwt_identity()))
    Notification.query.filter_by(user_id=user.id).update(
        {"is_read": True, "read_at": datetime.utcnow()}
    )
    db.session.commit()
    return success(message="Notifications marked as read")


@jwt_required()
def read_notification(notification_id):
    user = db.session.get(User, int(get_jwt_identity()))
    item = db.session.get(Notification, notification_id)
    if not item or item.user_id != user.id:
        return failure("Notification not found", 404)
    item.is_read = True
    item.read_at = datetime.utcnow()
    db.session.commit()
    return success(item.to_dict())
