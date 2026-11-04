from datetime import datetime
from app.extensions import db


class GuestRequest(db.Model):
    __tablename__ = "guest_requests"

    guest_request_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    tracking_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    full_name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    address = db.Column(db.Text, nullable=False)
    document_type_id = db.Column(db.Integer, db.ForeignKey("document_types.id", ondelete="RESTRICT"), nullable=False)
    status = db.Column(db.String(30), default="Pending", nullable=False, index=True)
    purpose = db.Column(db.Text, nullable=False)
    remarks = db.Column(db.Text, nullable=True)
    processed_by = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    processed_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    processor = db.relationship("User", foreign_keys=[processed_by], lazy=True)

    def to_dict(self):
        return {
            "guest_request_id": self.guest_request_id,
            "id": self.guest_request_id,
            "tracking_number": self.tracking_number,
            "full_name": self.full_name,
            "email": self.email,
            "phone": self.phone,
            "address": self.address,
            "document_type_id": self.document_type_id,
            "status": self.status,
            "purpose": self.purpose,
            "remarks": self.remarks,
            "processed_by": self.processed_by,
            "submitted_at": self.submitted_at.isoformat() if self.submitted_at else None,
            "processed_at": self.processed_at.isoformat() if self.processed_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "document_type": self.document_type.to_dict() if self.document_type else None,
        }

    def __repr__(self):
        return f"<GuestRequest Tracking={self.tracking_number} Guest={self.full_name}>"
