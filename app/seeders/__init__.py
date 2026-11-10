# Run the core seeders in dependency order.
from app.extensions import db
from app.seeders.analytics_test_data_seeder import seed_analytics_test_data
from app.seeders.admin_seeder import seed_admin
from app.seeders.audit_log_seeder import seed_audit_logs
from app.seeders.bulk_request_seeder import seed_bulk_requests
from app.seeders.bulk_user_seeder import seed_bulk_users
from app.seeders.document_type_seeder import seed_document_types
from app.seeders.notification_seeder import seed_notifications
from app.seeders.staff_seeder import seed_staff
from app.seeders.user_seeder import seed_resident


def seed_database():
    admin_user = seed_admin()
    db.session.flush()
    seed_staff(admin_user)
    seed_resident()
    seed_document_types()
    db.session.commit()


def seed_core_and_dashboard_data():
    seed_database()
    seed_audit_logs()
    seed_notifications()
    db.session.commit()


def seed_bulk_data():
    seed_bulk_users()
    db.session.flush()
    seed_bulk_requests()
    db.session.commit()