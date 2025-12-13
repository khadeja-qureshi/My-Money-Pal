# auth_utils.py
from flask import request, current_app
import jwt


def get_user_id_from_token():
    """
    Common helper to extract user_id from Authorization: Bearer <token>.

    Returns:
        (user_id, error_message)
        - user_id: int or None
        - error_message: None if OK, otherwise a string
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return None, "Missing Authorization header"

    parts = auth_header.split()
    if len(parts) != 2 or parts[0] != "Bearer":
        return None, "Invalid Authorization header format"

    token = parts[1]
    try:
        secret = current_app.config["SECRET_KEY"]
        decoded = jwt.decode(token, secret, algorithms=["HS256"])
        return decoded["user_id"], None
    except Exception:
        return None, "Invalid or expired token"
