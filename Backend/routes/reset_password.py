# backend/routes/reset_password.py
from flask import Blueprint, request, jsonify
from db import get_connection
import bcrypt

reset_password_bp = Blueprint("reset_password", __name__)

@reset_password_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json() or {}

    
    raw_new_pw = data.get("new_password") or data.get("password") or ""

    email = (data.get("email") or "").strip()
    security_question = (data.get("security_question") or "").strip()
    security_answer = (data.get("security_answer") or "").strip()
    new_password = raw_new_pw.strip()

    #  1) Basic validation 
    if not email or not security_question or not security_answer or not new_password:
        return jsonify({"error": "All fields are required"}), 400

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        #  2) Find user by email (case-insensitive)
        cursor.execute(
            """
            SELECT user_id, security_question, security_answer
            FROM Users
            WHERE LOWER(email) = LOWER(%s)
            """,
            (email,),
        )
        user = cursor.fetchone()

        if not user:
            cursor.close()
            conn.close()
            return jsonify({"error": "No account found with that email"}), 404

        db_question = (user["security_question"] or "").strip()
        db_answer = (user["security_answer"] or "").strip()

        # 3) Check security question & answer 
        
        if db_question != security_question:
            cursor.close()
            conn.close()
            return jsonify({"error": "Security question does not match"}), 400

        # Answer: case-insensitive compare
        if db_answer.lower() != security_answer.lower():
            cursor.close()
            conn.close()
            return jsonify({"error": "Security answer is incorrect"}), 400

        #  4) Hash new password & update 
        hashed_bytes = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt())
        hashed_str = hashed_bytes.decode("utf-8")

        cursor.execute(
            """
            UPDATE Users
            SET password = %s
            WHERE user_id = %s
            """,
            (hashed_str, user["user_id"]),
        )
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({"message": "Password updated successfully"}), 200

    except Exception as e:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass
        print("RESET PASSWORD ERROR:", repr(e))
        return jsonify({"error": "Internal server error"}), 500
