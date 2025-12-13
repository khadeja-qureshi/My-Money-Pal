# routes/login.py
from flask import Blueprint, request, jsonify, current_app
from db import get_connection
import bcrypt
import jwt
from datetime import datetime, timedelta

login_bp = Blueprint("login", __name__)

@login_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # 1) Look up user by email
        cursor.execute(
            """
            SELECT user_id, username, email, password
            FROM Users
            WHERE email = %s
            """,
            (email,),
        )
        user = cursor.fetchone()
        cursor.close()
        conn.close()

        # 2) If user not found -> invalid credentials
        if not user:
            return jsonify({"error": "Invalid credentials"}), 401

        stored_hash = user["password"] or ""

        # 3) Check  hash
        try:
            ok = bcrypt.checkpw(
                password.encode("utf-8"),
                stored_hash.encode("utf-8"),
            )
        except Exception:
            return jsonify({"error": "Invalid credentials"}), 401

        if not ok:
            return jsonify({"error": "Invalid credentials"}), 401

        # 4) Generate JWT token
        secret = current_app.config["SECRET_KEY"]
        exp = datetime.utcnow() + timedelta(hours=3)

        token = jwt.encode(
            {"user_id": user["user_id"], "exp": exp},
            secret,
            algorithm="HS256",
        )

        
        return jsonify(
            {
                "message": "Login successful",
                "token": token,
                "user_id": user["user_id"],
                "username": user["username"],
            }
        ), 200

    except Exception as e:
        print("LOGIN ERROR:", repr(e))
        return jsonify({"error": "Server error during login"}), 500
