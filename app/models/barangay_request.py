# Debug: Database model for barangay requests.
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy.dialects import mysql
from sqlalchemy.orm import Mapped, relationship

from app.extensions import db

if TYPE_CHECKING:
    from app.models.document_type import DocumentType
    from app.models.user import User


USER_ID_TYPE = db.BigInteger().with_variant(mysql.BIGINT(unsigned=True), "mysql").with_variant(
    db.Integer, "sqlite"
)


class BarangayRequest(db.Model):
    __tablename__ = "barangay_requests"

    id = db.Column("request_id", db.Integer, primary_key=True, autoincrement=True)
    tracking_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False
    )
    document_type_id = db.Column(
        db.Integer,
        db.ForeignKey("document_types.document_type_id", ondelete="RESTRICT"),
        nullable=False,
    )
    status = db.Column(
        db.String(30), default="Pending", nullable=False, index=True
    )  # Pending, Processing, Approved, Ready for Pickup, Completed, Rejected, Cancelled
    purpose = db.Column(db.Text, nullable=False)
    remarks = db.Column(db.Text, nullable=True)
    verified_by = db.Column(
        db.Integer, db.ForeignKey("staff.staff_id", ondelete="SET NULL"), nullable=True
    )
    verified_at = db.Column(db.DateTime, nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)
    ready_for_pickup_at = db.Column(db.DateTime, nullable=True)
    claimed_at = db.Column(db.DateTime, nullable=True)
    processing_started_at = db.Column(db.DateTime, nullable=True)
    processing_by = db.Column(
        USER_ID_TYPE,
        db.ForeignKey("users.user_id", ondelete="SET NULL"),
        nullable=True,
    )
    document_prepared_at = db.Column(db.DateTime, nullable=True)
    document_prepared_by = db.Column(
        USER_ID_TYPE, db.ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True
    )
    document_signed_at = db.Column(db.DateTime, nullable=True)
    document_signed_by = db.Column(
        USER_ID_TYPE, db.ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True
    )
    release_recipient_name = db.Column(db.String(255), nullable=True)
    released_by = db.Column(
        USER_ID_TYPE, db.ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True
    )
    prepared_document_id = db.Column(
        db.BigInteger().with_variant(mysql.BIGINT(unsigned=True), "mysql").with_variant(
            db.Integer, "sqlite"
        ),
        db.ForeignKey(
            "barangay_request_documents.request_document_id",
            ondelete="SET NULL",
            use_alter=True,
        ),
        nullable=True,
    )
    signed_document_id = db.Column(
        db.BigInteger().with_variant(mysql.BIGINT(unsigned=True), "mysql").with_variant(
            db.Integer, "sqlite"
        ),
        db.ForeignKey(
            "barangay_request_documents.request_document_id",
            ondelete="SET NULL",
            use_alter=True,
        ),
        nullable=True,
    )
    requirements_complete = db.Column(
        db.Boolean, default=False, server_default=db.false(), nullable=False
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    verifier = relationship("Staff", foreign_keys=[verified_by], lazy=True)
    processor = relationship("User", foreign_keys=[processing_by], lazy=True)
    document_preparer = relationship(
        "User", foreign_keys=[document_prepared_by], lazy=True
    )
    document_signer = relationship(
        "User", foreign_keys=[document_signed_by], lazy=True
    )
    releaser = relationship("User", foreign_keys=[released_by], lazy=True)
    prepared_document = relationship(
        "BarangayRequestDocument",
        foreign_keys=[prepared_document_id],
        post_update=True,
    )
    signed_document = relationship(
        "BarangayRequestDocument",
        foreign_keys=[signed_document_id],
        post_update=True,
    )
    documents = relationship(
        "BarangayRequestDocument",
        foreign_keys="BarangayRequestDocument.request_id",
        back_populates="request",
        cascade="all, delete-orphan",
        lazy=True,
    )
    user: Mapped["User"] = relationship(
        "User",
        back_populates="barangay_requests",
        foreign_keys=[user_id],
    )
    document_type: Mapped["DocumentType"] = relationship(
        "DocumentType",
        back_populates="barangay_requests",
        foreign_keys=[document_type_id],
    )

    def __init__(
        self,
        *,
        tracking_number: str,
        user_id: int,
        document_type_id: int,
        purpose: str,
        status: str = "Pending",
        remarks: str | None = None,
        verified_by: int | None = None,
    ) -> None:
        self.tracking_number = tracking_number
        self.user_id = user_id
        self.document_type_id = document_type_id
        self.purpose = purpose
        self.status = status
        self.remarks = remarks
        self.verified_by = verified_by

    @property
    def submitted_at(self):
        return self.created_at

    @property
    def processed_by(self):
        return self.processing_by

    @property
    def processed_at(self):
        return self.processing_started_at

    @property
    def completed_at(self):
        return self.claimed_at

    def to_dict(self):
        return {
            "id": self.id,
            "request_id": self.id,
            "tracking_number": self.tracking_number,
            "user_id": self.user_id,
            "document_type_id": self.document_type_id,
            "status": self.status,
            "purpose": self.purpose,
            "remarks": self.remarks,
            "processed_by": self.processed_by,
            "processor": self.processor.to_dict() if self.processor else None,
            "verified_by": self.verified_by,
            "verified_at": self.verified_at.isoformat() if self.verified_at else None,
            "approved_at": self.approved_at.isoformat() if self.approved_at else None,
            "ready_for_pickup_at": (
                self.ready_for_pickup_at.isoformat()
                if self.ready_for_pickup_at
                else None
            ),
            "claimed_at": self.claimed_at.isoformat() if self.claimed_at else None,
            "processing_started_at": (
                self.processing_started_at.isoformat()
                if self.processing_started_at
                else None
            ),
            "processing_by": self.processing_by,
            "document_prepared_at": (
                self.document_prepared_at.isoformat()
                if self.document_prepared_at
                else None
            ),
            "document_prepared_by": self.document_prepared_by,
            "document_signed_at": (
                self.document_signed_at.isoformat()
                if self.document_signed_at
                else None
            ),
            "document_signed_by": self.document_signed_by,
            "release_recipient_name": self.release_recipient_name,
            "released_by": self.released_by,
            "prepared_document_id": self.prepared_document_id,
            "signed_document_id": self.signed_document_id,
            "requirements_complete": self.requirements_complete,
            "verifier": self.verifier.to_dict() if self.verifier else None,
            "submitted_at": (
                self.submitted_at.isoformat() if self.submitted_at else None
            ),
            "processed_at": (
                self.processed_at.isoformat() if self.processed_at else None
            ),
            "completed_at": (
                self.completed_at.isoformat() if self.completed_at else None
            ),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "document_type": (
                self.document_type.to_dict() if self.document_type else None
            ),
            "user": self.user.to_dict() if self.user else None,
        }

    def __repr__(self):
        return f"<BarangayRequest Tracking={self.tracking_number} Status={self.status}>"
