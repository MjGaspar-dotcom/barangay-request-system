# Debug: Custom API exception classes.
class APIException(Exception):
    """Base API Exception"""

    def __init__(self, message="API Error", status_code=400, errors=None):
        super().__init__()
        self.message = message
        self.status_code = status_code
        self.errors = errors


class ResourceNotFoundException(APIException):
    def __init__(self, message="Resource not found", errors=None):
        super().__init__(message=message, status_code=404, errors=errors)


class UnauthorizedException(APIException):
    def __init__(self, message="Unauthorized access", errors=None):
        super().__init__(message=message, status_code=401, errors=errors)


class ForbiddenException(APIException):
    def __init__(self, message="Forbidden resource", errors=None):
        super().__init__(message=message, status_code=403, errors=errors)


class ValidationException(APIException):
    def __init__(self, message="Validation error", errors=None):
        super().__init__(message=message, status_code=422, errors=errors)
