from app.extensions import db
from app.models.notification import Notification
from app.models.staff import Staff


class NotificationService:
    @staticmethod
    def request_status_changed(request, old_status, new_status):
        document_name = request.document_type.name if request.document_type else "document"
        notification = Notification(
            user_id=request.user_id,
            title=f"Request {new_status}",
            message=f"Your {document_name} request ({request.tracking_number}) status changed from {old_status} to {new_status}.",
        )
        db.session.add(notification)
        return notification

    @staticmethod
    def new_request_for_staff(request):
        document_name = request.document_type.name if request.document_type else "document"
        for staff in Staff.query.all():
            db.session.add(Notification(
                user_id=staff.user_id,
                title="New Request Submitted",
                message=f"A new {document_name} request ({request.tracking_number}) has been submitted.",
            ))
