# routes/signup.py
from flask import Blueprint, request, jsonify
from db import get_connection
import bcrypt

signup_bp = Blueprint("signup", __name__)

@signup_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json() or {}

    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    security_question = data.get("security_question")
    security_answer = data.get("security_answer")

    if not all([username, email, password, security_question, security_answer]):
        return jsonify({"error": "All fields are required"}), 400

    try:
        conn = get_connection()
        cursor = conn.cursor()

        hashed_pw = bcrypt.hashpw(password.encode("utf-8"),
                                  bcrypt.gensalt()).decode("utf-8")

        cursor.execute(
            """
            INSERT INTO Users (username, email, password, security_question, security_answer)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (username, email, hashed_pw, security_question, security_answer),
        )
        conn.commit()

        return jsonify({"message": "User created"}), 201

    except Exception as e:
      
        return jsonify({"error": str(e)}), 400

    finally:
        try:
            cursor.close()
            conn.close()
        except:
            pass
