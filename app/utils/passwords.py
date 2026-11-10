# Debug: Password hashing and verification helpers.
import bcrypt
from werkzeug.security import check_password_hash, generate_password_hash


def hash_password(password: str) -> str:
    return generate_password_hash(password)


def verify_password(password_hash: str, password: str) -> bool:
    if not password_hash:
        return False

    if password_hash.startswith("$2y$"):
        bcrypt_hash = "$2b$" + password_hash[4:]
        try:
            return bcrypt.checkpw(password.encode("utf-8"), bcrypt_hash.encode("ascii"))
        except (ValueError, TypeError):
            return False

    try:
        return check_password_hash(password_hash, password)
    except (ValueError, TypeError):
        return False
