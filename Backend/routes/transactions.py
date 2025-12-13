# routes/transactions.py
from flask import Blueprint, request, jsonify
from db import get_connection
from auth_utils import get_user_id_from_token

transactions_bp = Blueprint("transactions", __name__)


# GET /transactions
@transactions_bp.route("/transactions", methods=["GET"])
def list_transactions():
    user_id, error = get_user_id_from_token()
    if error:
        return jsonify({"error": error}), 401

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT 
              t.transaction_id,
              t.amount,
              t.date,
              t.type,
              t.note,
              t.category_id,
              c.name AS category_name
            FROM Transactions t
            LEFT JOIN Categories c ON t.category_id = c.category_id
            WHERE t.user_id = %s
            ORDER BY t.date DESC, t.transaction_id DESC
            """,
            (user_id,),
        )

        rows = cursor.fetchall()
        cursor.close()
        conn.close()

        return jsonify(rows)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# POST /transactions
@transactions_bp.route("/transactions", methods=["POST"])
def add_transaction():
    user_id, error = get_user_id_from_token()
    if error:
        return jsonify({"error": error}), 401

    data = request.get_json() or {}

    amount = data.get("amount")
    type_ = data.get("type")  # 'income' or 'expense'
    category_id = data.get("category_id")
    date = data.get("date")
    note = data.get("note")

    if not amount or not type_ or not date:
        return jsonify({"error": "amount, type and date are required"}), 400

    if type_ not in ("income", "expense"):
        return jsonify({"error": "type must be income or expense"}), 400

    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT INTO Transactions (user_id, category_id, amount, date, type, note)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (user_id, category_id, amount, date, type_, note),
        )
        conn.commit()
        new_id = cursor.lastrowid

        cursor.close()
        conn.close()

        return jsonify({"message": "Transaction added", "transaction_id": new_id}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# DELETE /transactions/<id>
@transactions_bp.route("/transactions/<int:transaction_id>", methods=["DELETE"])
def delete_transaction(transaction_id):
    user_id, error = get_user_id_from_token()
    if error:
        return jsonify({"error": error}), 401

    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(
            "DELETE FROM Transactions WHERE transaction_id = %s AND user_id = %s",
            (transaction_id, user_id),
        )
        conn.commit()
        deleted = cursor.rowcount

        cursor.close()
        conn.close()

        if deleted == 0:
            return jsonify({"error": "Transaction not found"}), 404

        return jsonify({"message": "Transaction deleted"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# PUT /transactions/<id>
@transactions_bp.route("/transactions/<int:transaction_id>", methods=["PUT"])
def update_transaction(transaction_id):
    user_id, error = get_user_id_from_token()
    if error:
        return jsonify({"error": error}), 401

    data = request.get_json() or {}
    amount = data.get("amount")
    type_ = data.get("type")
    category_id = data.get("category_id")
    date = data.get("date")
    note = data.get("note")

    if not amount or not type_ or not date:
        return jsonify({"error": "amount, type and date are required"}), 400

    if type_ not in ("income", "expense"):
        return jsonify({"error": "type must be income or expense"}), 400

    try:
        conn = get_connection()
        cursor = conn.cursor()

        # ensure transaction belongs to this user
        cursor.execute(
            "SELECT transaction_id FROM Transactions WHERE transaction_id = %s AND user_id = %s",
            (transaction_id, user_id),
        )
        if cursor.fetchone() is None:
            cursor.close()
            conn.close()
            return jsonify({"error": "Transaction not found"}), 404

        cursor.execute(
            """
            UPDATE Transactions
            SET category_id = %s,
                amount = %s,
                date = %s,
                type = %s,
                note = %s
            WHERE transaction_id = %s AND user_id = %s
            """,
            (category_id, amount, date, type_, note, transaction_id, user_id),
        )
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({"message": "Transaction updated"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
