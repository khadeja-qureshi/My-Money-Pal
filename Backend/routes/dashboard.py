# routes/dashboard.py
from flask import Blueprint, jsonify
from db import get_connection
from auth_utils import get_user_id_from_token

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/dashboard", methods=["GET"])
def dashboard_summary():
    user_id, error = get_user_id_from_token()
    if error:
        return jsonify({"error": error}), 401

    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Total income
        cursor.execute(
            """
            SELECT COALESCE(SUM(amount), 0)
            FROM Transactions
            WHERE user_id = %s AND type = 'income'
            """,
            (user_id,),
        )
        total_income = cursor.fetchone()[0]

        # Total expenses
        cursor.execute(
            """
            SELECT COALESCE(SUM(amount), 0)
            FROM Transactions
            WHERE user_id = %s AND type = 'expense'
            """,
            (user_id,),
        )
        total_expenses = cursor.fetchone()[0]

        balance = total_income - total_expenses

        cursor.close()
        conn.close()

        return jsonify(
            {
                "total_income": float(total_income),
                "total_expenses": float(total_expenses),
                "balance": float(balance),
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500
