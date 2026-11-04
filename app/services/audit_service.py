# Debug: Audit logging business logic.
from flask import request
from flask_jwt_extended import get_jwt_identity
from app.extensions import db
from app.models.audit_log import AuditLog
from app.models.user import User


class AuditService:
    @staticmethod
    def log(action, model, description, old_values=None, new_values=None):
        user_id = None
        try:
            identity = get_jwt_identity()
            user_id = int(identity) if identity is not None else None
        except RuntimeError:
            pass
        entry = AuditLog(
            user_id=user_id,
            action=action,
            target_type=model.__tablename__,
            target_id=model.id,
            table_name=model.__tablename__,
            record_id=model.id,
            details=description,
            old_values=old_values or None,
            new_values=new_values or None,
            ip_address=request.remote_addr,
        )
        db.session.add(entry)
        return entry

    @staticmethod
    def log_status_change(model, old_status, new_status):
        return AuditService.log(
            "status_changed",
            model,
            f"{model.__tablename__} #{model.id} status from {old_status} to {new_status}",
            {"status": old_status},
            {"status": new_status},
        )
