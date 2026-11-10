import os
import re
from typing import Any


DEFAULT_ALLOWED_ORIGINS = "http://localhost:65110,http://127.0.0.1:65110"
LOCAL_ORIGIN_PATTERN = r"^https?://(?:localhost|127\.0\.0\.1)(?::\d+)?$"
ALLOWED_METHODS = ["GET", "HEAD", "POST", "OPTIONS", "PUT", "PATCH", "DELETE"]


def get_cors_resources() -> dict[str | re.Pattern[str], dict[str, Any]]:
    allowed_origins = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ALLOWED_ORIGINS", DEFAULT_ALLOWED_ORIGINS
        ).split(",")
        if origin.strip()
    ]
    allowed_origins.append(LOCAL_ORIGIN_PATTERN)

    return {
        r"^/api/.*$": {
            "origins": allowed_origins,
            "methods": ALLOWED_METHODS,
            "allow_headers": "*",
            "expose_headers": [],
            "max_age": 0,
            "supports_credentials": False,
        }
    }
