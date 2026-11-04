# Debug: Database model for request document types.
from datetime import datetime
from app.extensions import db


class DocumentType(db.Model):
    __tablename__ = "document_types"

    document_type_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    document_name = db.Column(db.String(255), unique=True, nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    processing_days = db.Column(db.Integer, default=1, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    barangay_requests = db.relationship(
        "BarangayRequest", backref="document_type", lazy=True
    )

    @property
    def fee(self):
        return 0

    @fee.setter
    def fee(self, value):
        pass

    @property
    def requirements(self):
        return None

    @requirements.setter
    def requirements(self, value):
        pass

    def to_dict(self):
        return {
            "id": self.document_type_id,
            "document_type_id": self.document_type_id,
            "name": self.document_name,
            "document_name": self.document_name,
            "description": self.description,
            "processing_days": self.processing_days,
            "fee": float(self.fee) if self.fee is not None else 0.0,
            "requirements": self.requirements,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<DocumentType {self.document_name}>"
