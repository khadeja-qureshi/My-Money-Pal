from flask import Blueprint, request, jsonify
from db import get_connection

forgot_bp = Blueprint("forgot_password", __name__)

@forgot_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json()
    email = data.get("email")
    security_answer = data.get("security_answer")

    # Validate required fields
    if not email or not security_answer:
        return jsonify({"error": "Email and security answer are required"}), 400

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # Fetch stored answer
        cursor.execute("SELECT security_answer FROM Users WHERE email = %s", (email,))
        user = cursor.fetchone()

        cursor.close()
        conn.close()

        # Email not found
        if not user:
            return jsonify({"error": "Email not found"}), 404

        # Compare answers (case-insensitive)
        if user["security_answer"].lower() != security_answer.lower():
            return jsonify({"error": "Security answer is incorrect"}), 400

        
        return jsonify({
            "message": "Security answer verified. You may reset your password.",
            "email": email
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
