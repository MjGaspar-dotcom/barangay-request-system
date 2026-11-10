from app.models.barangay_request import BarangayRequest


class RequestValidationService:
    ACTIVE_STATUSES = ("Pending", "Processing")

    @classmethod
    def can_user_submit_request(cls, user, document_type_id):
        errors = []
        existing = BarangayRequest.query.filter_by(
            user_id=user.id, document_type_id=document_type_id
        ).filter(BarangayRequest.status.in_(cls.ACTIVE_STATUSES)).first()

        if existing:
            errors.append("You already have a pending request for this document.")

        return errors

    @staticmethod
    def is_user_verified(user):
        return getattr(user, "verification_status", None) == "verified"