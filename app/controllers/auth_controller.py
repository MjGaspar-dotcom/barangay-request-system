# Debug: Authentication, registration, profile, OCR, and health endpoints.
from datetime import datetime, date
import mimetypes
import re
from pathlib import Path
from uuid import uuid4

from PIL import Image, UnidentifiedImageError
from flask import current_app, jsonify, request, send_file
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
from app.controllers.base import success, failure
from app.middleware.roles import role_required


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
        from app.services.ocr_parsing_service import OcrParsingService

        raw_text = pytesseract.image_to_string(Image.open(image.stream))
        parsed = OcrParsingService.parse(raw_text.strip())
        return success(parsed, "OCR completed")
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
    if not user:
        return failure("User not found", 404)
    data = (
        request.form.to_dict()
        if request.mimetype == "multipart/form-data"
        else request.get_json(silent=True) or {}
    )
    if not isinstance(data, dict):
        return failure("Profile data must be an object.", 422)

    for field in ("first_name", "middle_name", "last_name", "gender", "civil_status", "address"):
        if field not in data:
            continue
        value = data[field]
        if value is not None and not isinstance(value, str):
            return failure(f"{field.replace('_', ' ').capitalize()} must be text.", 422)
        if field in {"first_name", "last_name"} and not (value or "").strip():
            return failure(f"{field.replace('_', ' ').capitalize()} is required.", 422)
        setattr(user, field, value.strip() or None if value is not None else None)

    if "name" in data and not any(
        field in data for field in ("first_name", "middle_name", "last_name")
    ):
        parts = data["name"].strip().split() if isinstance(data["name"], str) else []
        if parts:
            user.first_name = parts[0]
            user.last_name = " ".join(parts[1:]) or parts[0]

    if "contact_number" in data or "phone" in data:
        contact_number = data.get("contact_number", data.get("phone"))
        if contact_number is not None and not isinstance(contact_number, str):
            return failure("Contact number must be text.", 422)
        user.contact_number = contact_number.strip() or None if contact_number else None

    if "birth_date" in data:
        birth_date_value = data["birth_date"]
        if birth_date_value in (None, ""):
            user.birth_date = None
        elif not isinstance(birth_date_value, str):
            return failure("Birth date must use YYYY-MM-DD format.", 422)
        else:
            try:
                parsed_birth_date = date.fromisoformat(birth_date_value)
            except ValueError:
                return failure("Birth date must use YYYY-MM-DD format.", 422)
            if parsed_birth_date > date.today():
                return failure("Birth date cannot be in the future.", 422)
            user.birth_date = parsed_birth_date

    image_formats = {
        ".jpg": "JPEG",
        ".jpeg": "JPEG",
        ".png": "PNG",
        ".webp": "WEBP",
    }
    image_fields = {
        "profile_picture": "profile-pictures",
        "valid_id_front": "resident-valid-ids",
        "valid_id_back": "resident-valid-ids",
    }
    storage_root = Path(current_app.config["PUBLIC_STORAGE_ROOT"]).resolve()
    pending_images = []
    for field, directory in image_fields.items():
        image = request.files.get(field)
        if image is None:
            continue
        extension = Path(image.filename or "").suffix.lower()
        expected_format = image_formats.get(extension)
        if expected_format is None:
            return failure("Images must be JPG, PNG, or WEBP files.", 422)
        image.stream.seek(0, 2)
        image_size = image.stream.tell()
        image.stream.seek(0)
        if image_size == 0 or image_size > 10 * 1024 * 1024:
            return failure("Each image must be between 1 byte and 10 MB.", 422)
        try:
            with Image.open(image.stream) as decoded:
                if decoded.format != expected_format:
                    return failure("The uploaded file is not a valid image.", 422)
                if decoded.width * decoded.height > 25_000_000:
                    return failure("The image dimensions are too large.", 422)
                decoded.verify()
        except (
            Image.DecompressionBombError,
            UnidentifiedImageError,
            OSError,
            ValueError,
        ):
            return failure("The uploaded file is not a valid image.", 422)
        image.stream.seek(0)

        pending_images.append((field, directory, extension, image))

    for field, directory, extension, image in pending_images:
        relative_path = Path(directory) / str(user.id) / f"{uuid4().hex}{extension}"
        destination = storage_root / relative_path
        destination.parent.mkdir(parents=True, exist_ok=True)
        image.save(destination)
        setattr(user, field, relative_path.as_posix())

    db.session.commit()
    return success(user.to_dict(), "Profile updated")


@jwt_required()
def profile_image(image_field):
    if image_field not in {"profile_picture", "valid_id_front", "valid_id_back"}:
        return failure("Profile image not found.", 404)
    user = db.session.get(User, int(get_jwt_identity()))
    if not user:
        return failure("User not found", 404)
    relative_path = getattr(user, image_field)
    if not relative_path:
        return failure("Profile image not found.", 404)

    storage_root = Path(current_app.config["PUBLIC_STORAGE_ROOT"]).resolve()
    image_path = (storage_root / relative_path).resolve()
    try:
        image_path.relative_to(storage_root)
    except ValueError:
        return failure("Profile image not found.", 404)
    if not image_path.is_file():
        return failure("Profile image not found.", 404)

    content_type = (
        mimetypes.guess_type(image_path.name)[0] or "application/octet-stream"
    )
    response = send_file(image_path, mimetype=content_type, conditional=True)
    response.cache_control.no_store = True
    return response
