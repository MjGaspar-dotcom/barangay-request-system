from datetime import datetime, timezone

from sqlalchemy.dialects import mysql
from sqlalchemy.orm import relationship

from app.extensions import db


def _utc_now_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class BarangayRequestDocument(db.Model):
    __tablename__ = "barangay_request_documents"
    __table_args__ = (
        db.Index(
            "barangay_request_documents_request_id_purpose_index",
            "request_id",
            "purpose",
        ),
    )

    id = db.Column(
        "request_document_id",
        db.BigInteger()
        .with_variant(mysql.BIGINT(unsigned=True), "mysql")
        .with_variant(db.Integer, "sqlite"),
        primary_key=True,
    )
    request_id = db.Column(
        db.BigInteger()
        .with_variant(mysql.BIGINT(unsigned=True), "mysql")
        .with_variant(db.Integer, "sqlite"),
        db.ForeignKey("barangay_requests.request_id", ondelete="CASCADE"),
        nullable=False,
    )
    uploaded_by = db.Column(
        db.BigInteger()
        .with_variant(mysql.BIGINT(unsigned=True), "mysql")
        .with_variant(db.Integer, "sqlite"),
        db.ForeignKey("users.user_id", ondelete="SET NULL"),
        nullable=True,
    )
    purpose = db.Column(
        db.Enum(
            "additional_requirement",
            "prepared_document",
            "signed_document",
            name="barangay_request_document_purpose",
            create_constraint=True,
        ),
        nullable=False,
    )
    original_name = db.Column(db.String(255), nullable=False)
    storage_path = db.Column(db.String(255), nullable=False)
    mime_type = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=_utc_now_naive, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=_utc_now_naive, onupdate=_utc_now_naive, nullable=False
    )

    request = relationship(
        "BarangayRequest",
        foreign_keys=[request_id],
        back_populates="documents",
    )
    uploader = relationship("User", foreign_keys=[uploaded_by])

    def __init__(
        self,
        *,
        request_id: int,
        purpose: str,
        original_name: str,
        storage_path: str,
        mime_type: str,
        uploaded_by: int | None = None,
    ) -> None:
        self.request_id = request_id
        self.uploaded_by = uploaded_by
        self.purpose = purpose
        self.original_name = original_name
        self.storage_path = storage_path
        self.mime_type = mime_type

    def to_dict(self) -> dict[str, object]:
        return {
            "request_document_id": self.id,
            "request_id": self.request_id,
            "uploaded_by": self.uploaded_by,
            "purpose": self.purpose,
            "original_name": self.original_name,
            "storage_path": self.storage_path,
            "mime_type": self.mime_type,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
