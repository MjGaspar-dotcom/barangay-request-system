from app.extensions import db
from app.models.barangay_request import BarangayRequest
from app.models.barangay_request_document import BarangayRequestDocument
from app.models.document_type import DocumentType
from app.models.user import User


def test_request_documents_support_workflow_references(app):
    user = User(
        username="resident",
        email="resident@example.test",
        password_hash="test-hash",
    )
    document_type = DocumentType(document_name="Test certificate")
    db.session.add_all([user, document_type])
    db.session.flush()

    request = BarangayRequest(
        tracking_number="BR-TEST-0001",
        user_id=user.id,
        document_type_id=document_type.document_type_id,
        purpose="Test workflow document",
    )
    request.processing_by = user.id
    db.session.add(request)
    db.session.flush()

    document = BarangayRequestDocument(
        request_id=request.id,
        uploaded_by=user.id,
        purpose="prepared_document",
        original_name="certificate.pdf",
        storage_path="requests/certificate.pdf",
        mime_type="application/pdf",
    )
    request.documents.append(document)
    request.prepared_document = document
    db.session.flush()

    assert document.request is request
    assert request.prepared_document is document
    assert request.processor is user
    assert request.to_dict()["processed_by"] == user.id
