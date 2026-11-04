# Debug: Authentication, registration, profile, OCR, and health endpoints.
from datetime import datetime, date
import re
from flask import jsonify, request
from flask_jwt_extended import (
    create_access_token,
    get_jwt,
    get_jwt_identity,
    jwt_required,
)

from app.extensions import db
from app.models import (
    User,
    DocumentType,
    BarangayRequest,
    Notification,
    AuditLog,
    Staff,
)
from app.services.tracking_number_service import TrackingNumberService
from app.services.request_status_service import RequestStatusService
from app.utils.passwords import hash_password, verify_password
from app.controllers.base import success, failure, role_required


def api_test():
    return success({"message": "API is working"})


def test_qr():
    from flask import Response
    from app.services.qr_code_service import QrCodeService

    return Response(
        QrCodeService.generate("BRGY-2026-TEST01"), mimetype="image/svg+xml"
    )


def ocr_test():
    image = request.files.get("image")
    if image is None:
        return failure(
            "Validation failed", 422, {"image": ["The image field is required."]}
        )
    if image.mimetype not in ("image/jpeg", "image/png") or not image.filename:
        return failure(
            "Validation failed", 422, {"image": ["The file must be an image."]}
        )
    try:
        import pytesseract
        from PIL import Image

        raw_text = pytesseract.image_to_string(Image.open(image.stream))
        return success({"text": raw_text.strip()}, "OCR completed")
    except ImportError:
        return failure("OCR service is unavailable on this server.", 503)


def health():
    return success({"service": "barangay-request-system"})


def register():
    data = request.get_json(silent=True) or {}
    # Preserve support for the original Python API while validating Laravel's resident registration shape.
    required = ("email", "password")
    if data.get("username"):
        required += (
            "username",
            "first_name",
            "last_name",
            "birth_date",
            "gender",
            "civil_status",
            "address",
            "contact_number",
        )
    elif "name" not in data:
        required += (
            "username",
            "first_name",
            "last_name",
            "birth_date",
            "gender",
            "civil_status",
            "address",
            "contact_number",
        )
    missing = [
        field
        for field in required
        if field not in data or data[field] is None or str(data[field]).strip() == ""
    ]
    if missing:
        return failure(
            "Validation failed",
            422,
            {field: ["This field is required."] for field in missing},
        )
    password_confirmation = data.get("password_confirmation")
    if password_confirmation is not None and password_confirmation != data["password"]:
        return failure(
            "Validation failed",
            422,
            {"password": ["Password confirmation does not match."]},
        )
    if len(data["password"]) < 8:
        return failure(
            "Validation failed",
            422,
            {"password": ["The password must be at least 8 characters."]},
        )
    if data.get("username") and not re.fullmatch(r"[A-Za-z0-9_-]+", data["username"]):
        return failure(
            "Validation failed",
            422,
            {
                "username": [
                    "The username may only contain letters, numbers, dashes and underscores."
                ]
            },
        )
    username = data.get("username") or (
        data.get("name") or data["email"].split("@", 1)[0]
    )
    email = data["email"].strip().lower()
    if (
        User.query.filter_by(email=email).first()
        or User.query.filter_by(username=username).first()
    ):
        errors = {}
        if User.query.filter_by(email=email).first():
            errors["email"] = ["The email has already been taken."]
        if User.query.filter_by(username=username).first():
            errors["username"] = ["The username has already been taken."]
        return failure("Validation failed", 422, errors)
    full_name = data.get("name", "")
    name_parts = full_name.strip().split()
    first_name = data.get("first_name") or (
        name_parts[0] if name_parts else full_name or "Resident"
    )
    last_name = data.get("last_name") or (
        name_parts[-1] if len(name_parts) > 1 else "User"
    )
    try:
        birth_date_value = (
            date.fromisoformat(data["birth_date"]) if data.get("birth_date") else None
        )
        if birth_date_value and birth_date_value > date.today():
            return failure(
                "Validation failed",
                422,
                {"birth_date": ["Birth date cannot be in the future."]},
            )
    except ValueError:
        return failure(
            "Validation failed", 422, {"birth_date": ["The birth date is invalid."]}
        )
    user = User(
        username=username,
        name=full_name
        or " ".join(filter(None, [first_name, data.get("middle_name"), last_name])),
        first_name=first_name,
        middle_name=data.get("middle_name"),
        last_name=last_name,
        birth_date=birth_date_value if data.get("birth_date") else None,
        gender=data.get("gender"),
        civil_status=data.get("civil_status"),
        email=email,
        password_hash=hash_password(data["password"]),
        phone=data.get("phone") or data.get("contact_number"),
        contact_number=data.get("contact_number") or data.get("phone"),
        address=data.get("address"),
        verification_status="pending",
        role="resident",
    )
    db.session.add(user)
    db.session.commit()
    return success(
        user.to_dict(),
        (
            "User registered successfully."
            if data.get("username")
            else "Registration successful"
        ),
        201,
    )


def login():
    data = request.get_json(silent=True) or {}
    identifier = (data.get("username") or data.get("email") or "").strip().lower()
    user = User.query.filter_by(username=identifier).first()
    if not user and data.get("email"):
        user = User.query.filter_by(email=identifier).first()
    if not user or not verify_password(user.password_hash, data.get("password", "")):
        return failure(
            (
                "Invalid username or password."
                if data.get("username")
                else "Invalid credentials"
            ),
            401,
        )
    if not user.is_active:
        return failure("Account is inactive", 403)
    role = (
        "admin" if user.role == "admin" else "staff" if user.role == "staff" else "user"
    )
    token = create_access_token(identity=str(user.id), additional_claims={"role": role})
    return jsonify(
        {
            "success": True,
            "status": "success",
            "message": "Login successful.",
            "token": token,
            "role": role,
            "data": user.to_dict(),
            "user": user.to_dict(),
        }
    )


@jwt_required()
def current_user():
    user = db.session.get(User, int(get_jwt_identity()))
    if not user:
        return failure("User not found", 404)
    role = (
        "admin" if user.role == "admin" else "staff" if user.role == "staff" else "user"
    )
    return jsonify(
        {"success": True, "status": "success", "role": role, "data": user.to_dict()}
    )


@jwt_required()
def logout():
    return success(message="Logged out successfully")


@jwt_required()
def update_profile():
    user = db.session.get(User, int(get_jwt_identity()))
    data = request.get_json(silent=True) or {}
    for field in ("name", "phone", "address"):
        if field in data:
            setattr(user, field, data[field])
    db.session.commit()
    return success(user.to_dict(), "Profile updated")
