# routes/profile.py
from flask import Blueprint, request, jsonify
from db import get_connection
from auth_utils import get_user_id_from_token

profile_bp = Blueprint("profile", __name__)


# GET /profile
@profile_bp.route("/profile", methods=["GET"])
def get_profile():
    user_id, error = get_user_id_from_token()
    if error:
        return jsonify({"error": error}), 401

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT username, email
            FROM Users
            WHERE user_id = %s
            """,
            (user_id,),
        )
        user = cursor.fetchone()

        cursor.close()
        conn.close()

        if not user:
            return jsonify({"error": "User not found"}), 404

        return jsonify({"username": user["username"], "email": user["email"]}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# PUT /profile
@profile_bp.route("/profile", methods=["PUT"])
def update_profile():
    user_id, error = get_user_id_from_token()
    if error:
        return jsonify({"error": error}), 401

    data = request.get_json() or {}
    username = data.get("username")
    email = data.get("email")

    if not username or not email:
        return jsonify({"error": "username and email are required"}), 400

    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            UPDATE Users
            SET username = %s, email = %s
            WHERE user_id = %s
            """,
            (username, email, user_id),
        )
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({"message": "Profile updated"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
