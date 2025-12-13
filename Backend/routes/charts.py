# routes/charts.py
from flask import Blueprint, jsonify, request, current_app
from db import get_connection
import jwt

charts_bp = Blueprint("charts_bp", __name__)

def get_user_id_from_token():
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return None, "Missing Authorization header"

    try:
        token = auth_header.split(" ")[1]  
        secret = current_app.config["SECRET_KEY"]
        decoded = jwt.decode(token, secret, algorithms=["HS256"])
        return decoded["user_id"], None
    except Exception:
        return None, "Invalid or expired token"



@charts_bp.route("/charts/category-spending", methods=["GET"])
@charts_bp.route("/api/category-spending", methods=["GET"])
def category_spending():
    """
    Returns: [{ "category": "Education", "total_spent": 18000.00 }, ...]
    Uses only EXPENSE transactions for the logged-in user.
    """
    user_id, error = get_user_id_from_token()
    if error:
        return jsonify({"error": error}), 401

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        sql = """
            SELECT
                c.name AS category,
                COALESCE(
                    SUM(
                        CASE
                            WHEN t.type = 'expense' THEN t.amount
                            ELSE 0
                        END
                    ), 0
                ) AS total_spent
            FROM Categories c
            LEFT JOIN Transactions t
              ON t.category_id = c.category_id
             AND t.user_id = %s
            WHERE c.user_id = %s OR c.user_id IS NULL
            GROUP BY c.name
            ORDER BY total_spent DESC;
        """
        cursor.execute(sql, (user_id, user_id))
        rows = cursor.fetchall()
        return jsonify(rows), 200
    finally:
        cursor.close()
        conn.close()
