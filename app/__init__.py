import os
from flask import Flask, jsonify
from config import config_by_name
from app.extensions import db, migrate, jwt, cors
from app.utils.responses import error_response
from app.utils.exceptions import APIException


def create_app(config_name=None):
    """
    Application Factory Pattern for Flask App.
    """
    if config_name is None:
        config_name = os.getenv("FLASK_ENV", "development")

    flask_app = Flask(__name__)
    flask_app.config.from_object(config_by_name.get(config_name, config_by_name["default"]))

    # Initialize Extensions
    db.init_app(flask_app)
    migrate.init_app(flask_app, db)
    jwt.init_app(flask_app)
    cors.init_app(flask_app, resources={r"/api/*": {"origins": "*"}})

    # Import models for Flask-Migrate / SQLAlchemy metadata
    from . import models

    # Register API routes
    from .routes.api import api_bp
    flask_app.register_blueprint(api_bp, url_prefix="/api")

    # Register Error Handlers
    register_error_handlers(flask_app)

    # Health check route
    @flask_app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "success",
            "message": "Barangay Request System v2 API is running",
            "environment": config_name
        }), 200

    return flask_app


def register_error_handlers(flask_app):
    """
    Global Error Handlers.
    """

    @flask_app.errorhandler(APIException)
    def handle_api_exception(error):
        return error_response(
            message=error.message,
            errors=error.errors,
            status_code=error.status_code
        )

    @flask_app.errorhandler(404)
    def handle_404(error):
        return error_response(
            message="Endpoint not found",
            status_code=404
        )

    @flask_app.errorhandler(500)
    def handle_500(error):
        return error_response(
            message="Internal server error",
            status_code=500
        )

    @jwt.unauthorized_loader
    def unauthorized_callback(callback):
        return error_response(
            message="Missing or invalid Authorization Token",
            status_code=401
        )

    @jwt.invalid_token_loader
    def invalid_token_callback(callback):
        return error_response(
            message="Invalid JWT signature or token format",
            status_code=401
        )

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return error_response(
            message="JWT Token has expired. Please login again.",
            status_code=401
        )
