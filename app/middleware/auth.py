from flask_jwt_extended import get_jwt_identity

from app.extensions import db
from app.models import User


def current_user():
    return db.session.get(User, int(get_jwt_identity()))
