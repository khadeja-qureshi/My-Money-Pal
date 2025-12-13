from flask import Blueprint, request, jsonify, current_app
import jwt

logout_bp = Blueprint("logout", __name__)

@logout_bp.route("/logout", methods=["POST"])
def logout():
    auth_header = request.headers.get("Authorization")

    if not auth_header:
        return jsonify({"error": "Authorization token missing"}), 401

    parts = auth_header.split()
    if len(parts) != 2 or parts[0] != "Bearer":
        return jsonify({"error": "Invalid Authorization header format"}), 401

    token = parts[1]

    try:
        secret = current_app.config["SECRET_KEY"]
        jwt.decode(token, secret, algorithms=["HS256"])
        return jsonify({"message": "Logged out successfully"}), 200
    except Exception:
        return jsonify({"error": "Invalid or expired token"}), 401
