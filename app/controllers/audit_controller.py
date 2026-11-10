# Debug: Audit log endpoints.
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
from app.controllers.base import success, failure
from app.middleware.roles import role_required


@role_required("admin")
def audit_logs(user):
    return success(
        [
            item.to_dict()
            for item in AuditLog.query.order_by(AuditLog.created_at.desc()).all()
        ]
    )


@role_required("admin")
def audit_log_detail(user, log_id):
    item = db.session.get(AuditLog, log_id)
    if not item:
        return failure("Audit log not found", 404)
    return success(item.to_dict())
