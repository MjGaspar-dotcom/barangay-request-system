# Debug: API route registration and endpoint-to-controller mapping.
from flask import Blueprint

from app.controllers.auth_controller import (
    api_test,
    current_user,
    health,
    login,
    logout,
    ocr_test,
    profile_image,
    register,
    test_qr,
    update_profile,
)
from app.controllers.document_controller import (
    document_type_detail,
    document_types,
)
from app.controllers.request_controller import (
    authorize_request_document,
    barangay_request_detail,
    barangay_requests,
    request_valid_id,
    resubmit_request_requirements,
    track,
    upload_prepared_document,
    verify_request_requirements,
    view_request_document,
)
from app.controllers.notification_controller import (
    notifications,
    read_all_notifications,
    read_notification,
    unread_count,
)
from app.controllers.staff_admin_controller import (
    admin_staff,
    admin_stats,
    admin_user_detail,
    admin_users,
    delete_staff,
    recent_activity,
    staff_list,
    staff_requests,
    verify_user,
)
from app.controllers.audit_controller import audit_log_detail, audit_logs
from app.controllers.analytics_controller import document_request_trends

api_bp = Blueprint("api", __name__)

# General and authentication endpoints.
api_bp.get("/test")(api_test)
api_bp.get("/test-qr")(test_qr)
api_bp.post("/ocr/test")(ocr_test)
api_bp.get("/health")(health)
api_bp.post("/register")(register)
api_bp.post("/login")(login)
api_bp.get("/user")(current_user)
api_bp.post("/logout")(logout)
api_bp.patch("/profile")(update_profile)
api_bp.get("/profile/image/<image_field>")(profile_image)

# Document type endpoints.
api_bp.route("/document-types", methods=["GET", "POST"])(document_types)
api_bp.route(
    "/document-types/<int:document_type_id>",
    methods=["GET", "PUT", "PATCH", "DELETE"],
)(document_type_detail)

# Request and tracking endpoints.
api_bp.get("/track/<tracking_number>")(track)
api_bp.route("/barangay-requests", methods=["GET", "POST"])(barangay_requests)
api_bp.route(
    "/barangay-requests/<int:request_id>",
    methods=["GET", "PUT", "PATCH", "DELETE"],
)(barangay_request_detail)
api_bp.get("/barangay-requests/<int:request_id>/valid-id/<side>")(
    request_valid_id
)
api_bp.post("/barangay-requests/<int:request_id>/requirements/verify")(
    verify_request_requirements
)
api_bp.post("/barangay-requests/<int:request_id>/requirements/resubmit")(
    resubmit_request_requirements
)
api_bp.post("/barangay-requests/<int:request_id>/documents/prepared")(
    upload_prepared_document
)
api_bp.post("/barangay-requests/<int:request_id>/documents/authorize")(
    authorize_request_document
)
api_bp.get(
    "/barangay-requests/<int:request_id>/documents/<int:document_id>/view"
)(view_request_document)

# Notification endpoints.
api_bp.get("/notifications")(notifications)
api_bp.get("/notifications/unread-count")(unread_count)
api_bp.patch("/notifications/read-all")(read_all_notifications)
api_bp.patch("/notifications/<int:notification_id>/read")(read_notification)

# Staff and administrator endpoints.
api_bp.get("/staff")(staff_list)
api_bp.get("/staff/requests")(staff_requests)
api_bp.get("/admin/stats")(admin_stats)
api_bp.get("/admin/analytics/document-request-trends")(document_request_trends)
api_bp.get("/admin/users")(admin_users)
api_bp.route("/admin/users/<int:user_id>", methods=["GET", "DELETE"])(admin_user_detail)
api_bp.patch("/admin/users/<int:user_id>/verification")(verify_user)
api_bp.route("/admin/staff", methods=["GET", "POST"])(admin_staff)
api_bp.delete("/admin/staff/<int:staff_id>")(delete_staff)
api_bp.get("/admin/recent-activity")(recent_activity)

# Audit log endpoints.
api_bp.route("/audit-logs", methods=["GET"])(audit_logs)
api_bp.get("/audit-logs/<int:log_id>")(audit_log_detail)
