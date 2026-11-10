# Debug: Barangay request status transition logic.
from datetime import datetime
from flask_jwt_extended import get_jwt_identity
from app.extensions import db
from app.services.notification_service import NotificationService
from app.services.audit_service import AuditService


class RequestStatusService:
    STATUS_PENDING = "Pending"
    STATUS_APPROVED = "Approved"
    STATUS_PROCESSING = "Processing"
    STATUS_READY_FOR_PICKUP = "Ready for Pickup"
    STATUS_ADDITIONAL_REQUIREMENTS = "Additional Requirements"
    STATUS_REJECTED = "Rejected"
    STATUS_COMPLETED = "Completed"
    ALL_STATUSES = [
        STATUS_PENDING,
        STATUS_APPROVED,
        STATUS_PROCESSING,
        STATUS_READY_FOR_PICKUP,
        STATUS_ADDITIONAL_REQUIREMENTS,
        STATUS_REJECTED,
        STATUS_COMPLETED,
    ]
    ALLOWED_TRANSITIONS = {
        STATUS_PENDING: [
            STATUS_APPROVED,
            STATUS_ADDITIONAL_REQUIREMENTS,
            STATUS_REJECTED,
        ],
        STATUS_ADDITIONAL_REQUIREMENTS: [STATUS_PENDING],
        STATUS_APPROVED: [STATUS_PROCESSING],
        STATUS_PROCESSING: [STATUS_READY_FOR_PICKUP],
        STATUS_READY_FOR_PICKUP: [STATUS_COMPLETED],
        STATUS_REJECTED: [],
        STATUS_COMPLETED: [],
    }

    @classmethod
    def can_transition(cls, source: str, target: str) -> bool:
        return target in cls.ALLOWED_TRANSITIONS.get(source, [])

    @classmethod
    def next_allowed_statuses(cls, source: str):
        return cls.ALLOWED_TRANSITIONS.get(source, [])

    @classmethod
    def assert_transition_allowed(cls, source: str, target: str):
        if target not in cls.ALL_STATUSES:
            raise ValueError(
                f'Unknown status: "{target}". Allowed: {", ".join(cls.ALL_STATUSES)}'
            )
        if source == target:
            raise ValueError(f'Request is already "{source}". No change needed.')
        if not cls.can_transition(source, target):
            allowed = cls.next_allowed_statuses(source)
            hint = (
                "is a final status and cannot be changed."
                if not allowed
                else 'Allowed next statuses from "'
                + source
                + '": '
                + ", ".join(allowed)
                + "."
            )
            raise ValueError(
                f'Invalid status transition from "{source}" to "{target}". "{source}" {hint}'
            )

    @classmethod
    def update_barangay_request_atomically(
        cls, request, new_status, additional_fields=None, remarks=None
    ):
        old_status = request.status
        cls.assert_transition_allowed(old_status, new_status)
        now = datetime.utcnow()
        request.status = new_status
        if remarks is not None:
            request.remarks = remarks
        if new_status == cls.STATUS_APPROVED:
            request.approved_at = now
        elif new_status == cls.STATUS_PROCESSING:
            request.processing_started_at = now
            identity = get_jwt_identity()
            request.processing_by = int(identity) if identity is not None else None
        elif new_status == cls.STATUS_READY_FOR_PICKUP:
            if not request.document_signed_at:
                raise ValueError(
                    "The signed document must be authorized before marking ready for pickup."
                )
            request.ready_for_pickup_at = now
        elif new_status == cls.STATUS_COMPLETED:
            recipient_value = (additional_fields or {}).get("recipient_name", "")
            recipient_name = (
                recipient_value.strip() if isinstance(recipient_value, str) else ""
            )
            if not recipient_name:
                raise ValueError("The recipient name is required to complete release.")
            if not request.ready_for_pickup_at:
                raise ValueError("Only a ready-for-pickup request can be released.")
            request.claimed_at = now
            request.released_by = (
                int(get_jwt_identity())
                if get_jwt_identity() is not None
                else None
            )
        for key, value in (additional_fields or {}).items():
            if key not in {
                "status",
                "remarks",
                "verified_at",
                "approved_at",
                "ready_for_pickup_at",
                "claimed_at",
            } and hasattr(request, key):
                setattr(request, key, value)
        if new_status == cls.STATUS_COMPLETED:
            request.release_recipient_name = recipient_name
        AuditService.log_status_change(request, old_status, new_status)
        NotificationService.request_status_changed(request, old_status, new_status)
        db.session.commit()
        return request

    @classmethod
    def is_final_status(cls, status: str) -> bool:
        return not cls.ALLOWED_TRANSITIONS.get(status)
