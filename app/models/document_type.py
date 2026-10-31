from datetime import datetime
from app.extensions import db


class DocumentType(db.Model):
    __tablename__ = "document_types"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), unique=True, nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    fee = db.Column(db.Numeric(10, 2), default=0.00, nullable=False)
    requirements = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    barangay_requests = db.relationship("BarangayRequest", backref="document_type", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "fee": float(self.fee) if self.fee is not None else 0.0,
            "requirements": self.requirements,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<DocumentType {self.name}>"
