from functools import wraps

from flask_jwt_extended import jwt_required

from app.controllers.base import failure
from app.middleware.auth import current_user


def role_required(*roles):
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            user = current_user()
            if not user or user.role not in roles:
                return failure("Forbidden", 403)
            return fn(user, *args, **kwargs)

        return wrapper

    return decorator
