from flask import Blueprint, request, jsonify
from db import get_connection
from auth_utils import get_user_id_from_token
from datetime import datetime

expense_bp = Blueprint("expense", __name__)


@expense_bp.route("/expense", methods=["POST"])
def add_expense():
    user_id, error = get_user_id_from_token()
    if error:
        return jsonify({"error": error}), 401

    data = request.get_json()

    amount = data.get("amount")
    date = data.get("date")
    category_id = data.get("category_id")
    note = data.get("note", None)

    # 1. Validate mandatory fields
    if not amount or not date:
        return jsonify({"error": "Amount and date are required"}), 400

    # Validate amount
    try:
        amount = float(amount)
        if amount <= 0:
            return jsonify({"error": "Amount must be greater than 0"}), 400
    except:
        return jsonify({"error": "Amount must be a valid number"}), 400

    # Validate date format
    try:
        datetime.strptime(date, "%Y-%m-%d")
    except:
        return jsonify({"error": "Date must be in YYYY-MM-DD format"}), 400

    # Insert expense
    try:
        conn = get_connection()
        cursor = conn.cursor()

        query = """
            INSERT INTO Transactions (user_id, category_id, amount, date, type, note)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (user_id, category_id, amount, date, "expense", note))
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({"message": "Expense added successfully"}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500
