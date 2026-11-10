# Seed document types from the Laravel DocumentTypeSeeder.
from app.extensions import db
from app.models.document_type import DocumentType


DOCUMENT_TYPES = (
    "Barangay Clearance",
    "Certificate of Residency",
    "Certificate of Indigency",
)


def seed_document_types():
    for document_name in DOCUMENT_TYPES:
        if DocumentType.query.filter_by(document_name=document_name).first() is None:
            db.session.add(DocumentType(document_name=document_name))