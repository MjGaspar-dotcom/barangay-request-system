# Debug: Document type endpoints.
from flask import request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from app.extensions import db
from app.models import (
    User,
    DocumentType,
)
from app.controllers.base import success, failure


@jwt_required(optional=True)
def document_types():
    if request.method == "GET":
        items = (
            DocumentType.query.filter_by(is_active=True)
            .order_by(DocumentType.document_name)
            .all()
        )
        return success([item.to_dict() for item in items])

    user = get_jwt_identity()
    if not user:
        return failure("Unauthenticated", 401)
    current = db.session.get(User, int(user))
    if not current or (current.role != "admin" and get_jwt().get("role") != "admin"):
        return failure("Forbidden", 403)

    data = request.get_json(silent=True) or {}
    name = str(data.get("document_name", "")).strip()
    processing_days = data.get("processing_days", 1)
    errors = {}
    if not name:
        errors["document_name"] = ["The document name is required."]
    elif len(name) > 255:
        errors["document_name"] = [
            "The document name may not be greater than 255 characters."
        ]
    elif DocumentType.query.filter_by(document_name=name).first():
        errors["document_name"] = ["The document name has already been taken."]
    try:
        processing_days = int(processing_days)
        if processing_days < 1:
            errors["processing_days"] = ["The processing days must be at least 1."]
    except (TypeError, ValueError):
        errors["processing_days"] = ["The processing days must be an integer."]
    if errors:
        return failure("Validation failed", 422, errors)

    item = DocumentType(
        document_name=name,
        description=data.get("description"),
        processing_days=processing_days,
        is_active=bool(data.get("is_active", True)),
    )
    db.session.add(item)
    db.session.commit()
    return success(item.to_dict(), "Document type created successfully.", 201)


@jwt_required(optional=True)
def document_type_detail(document_type_id):
    item = db.session.get(DocumentType, document_type_id)
    if not item:
        return failure("Document type not found", 404)

    if request.method == "GET":
        return success(item.to_dict())

    identity = get_jwt_identity()
    if not identity:
        return failure("Unauthenticated", 401)
    current = db.session.get(User, int(identity))
    if not current or (current.role != "admin" and get_jwt().get("role") != "admin"):
        return failure("Forbidden", 403)

    if request.method == "DELETE":
        db.session.delete(item)
        db.session.commit()
        return success(message="Document type deleted successfully.")

    data = request.get_json(silent=True) or {}
    name = str(data.get("document_name", item.document_name)).strip()
    processing_days = data.get("processing_days", item.processing_days)
    errors = {}
    if not name:
        errors["document_name"] = ["The document name is required."]
    elif len(name) > 255:
        errors["document_name"] = [
            "The document name may not be greater than 255 characters."
        ]
    elif (
        (existing := DocumentType.query.filter_by(document_name=name).first())
        and existing.document_type_id != item.document_type_id
    ):
        errors["document_name"] = ["The document name has already been taken."]
    try:
        processing_days = int(processing_days)
        if processing_days < 1:
            errors["processing_days"] = ["The processing days must be at least 1."]
    except (TypeError, ValueError):
        errors["processing_days"] = ["The processing days must be an integer."]
    if errors:
        return failure("Validation failed", 422, errors)

    item.document_name = name
    item.description = data.get("description", item.description)
    item.processing_days = processing_days
    if "is_active" in data:
        item.is_active = bool(data["is_active"])
    db.session.commit()
    return success(item.to_dict(), "Document type updated successfully.")
