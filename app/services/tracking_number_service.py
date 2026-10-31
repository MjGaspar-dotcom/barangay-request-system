import secrets
from datetime import datetime


class TrackingNumberService:
    @staticmethod
    def generate() -> str:
        return f"BR-{datetime.utcnow().strftime('%Y%m%d')}-{secrets.token_hex(3).upper()}"
