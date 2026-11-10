from app.extensions import db
from app.models.barangay_request import BarangayRequest
from app.models.document_type import DocumentType
from app.models.staff import Staff
from app.models.user import User
from app.models.admin import Admin
from app.seeders.staff_seeder import seed_staff
from app.seeders.analytics_test_data_seeder import seed_analytics_test_data
from app.utils.passwords import hash_password


def test_staff_seeder_links_staff_to_admin_profile(app):
    admin_user = User(
        username="admin",
        email="admin-seed@example.test",
        password_hash=hash_password("admin-password"),
    )
    db.session.add(admin_user)
    db.session.flush()
    admin = Admin()
    admin.user_id = admin_user.id
    db.session.add(admin)
    db.session.flush()

    staff_user = seed_staff(admin_user)
    db.session.commit()

    staff = Staff.query.filter_by(user_id=staff_user.id).one()
    assert staff.assigned_by == admin.id
    assert staff.assigned_by_admin.id == admin.id


def test_analytics_test_data_seeder_is_idempotent(app):
    resident = User(
        username="resident",
        email="resident@example.test",
        password_hash=hash_password("test-password"),
    )
    document_type = DocumentType(document_name="Test certificate")
    db.session.add_all([resident, document_type])
    db.session.flush()

    assert seed_analytics_test_data() == (100, 0)
    assert seed_analytics_test_data() == (0, 100)

    requests = BarangayRequest.query.order_by(BarangayRequest.tracking_number).all()
    assert len(requests) == 100
    assert requests[0].tracking_number == "BR-SYNTH-ANALYTICS-001"
    assert requests[-1].tracking_number == "BR-SYNTH-ANALYTICS-100"
    assert all(request.user_id == resident.id for request in requests)
    assert all(request.document_type_id == document_type.document_type_id for request in requests)
