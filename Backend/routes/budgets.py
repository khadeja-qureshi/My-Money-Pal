# routes/budgets.py
from flask import Blueprint, request, jsonify
from db import get_connection
from auth_utils import get_user_id_from_token

budgets_bp = Blueprint("budgets", __name__)


# GET /budgets  
@budgets_bp.route("/budgets", methods=["GET"])
def list_budgets():
    user_id, error = get_user_id_from_token()
    if error:
        return jsonify({"error": error}), 401

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
              b.budget_id,
              b.category_id,
              b.amount_limit,
              b.month,
              b.year,
              c.name AS category_name,
              COALESCE(SUM(t.amount), 0) AS spent_total
            FROM Budgets b
            LEFT JOIN Categories c
              ON b.category_id = c.category_id
            LEFT JOIN Transactions t
              ON t.user_id = b.user_id
             AND (t.category_id = b.category_id OR b.category_id IS NULL)
             AND MONTH(t.date) = b.month
             AND YEAR(t.date) = b.year
             AND t.type = 'expense'
            WHERE b.user_id = %s
            GROUP BY
              b.budget_id,
              b.category_id,
              b.amount_limit,
              b.month,
              b.year,
              c.name
            ORDER BY b.year DESC, b.month DESC, b.budget_id DESC
            """,
            (user_id,),
        )

        rows = cursor.fetchall()
        cursor.close()
        conn.close()

        return jsonify(rows), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# POST /budgets
@budgets_bp.route("/budgets", methods=["POST"])
def create_budget():
    user_id, error = get_user_id_from_token()
    if error:
        return jsonify({"error": error}), 401

    data = request.get_json() or {}
    category_id = data.get("category_id")
    amount_limit = data.get("amount_limit")
    month = data.get("month")
    year = data.get("year")

    if amount_limit is None or month is None or year is None:
        return jsonify({"error": "amount_limit, month and year are required"}), 400

    try:
        amount_limit = float(amount_limit)
        if amount_limit <= 0:
            return jsonify({"error": "amount_limit must be > 0"}), 400
    except Exception:
        return jsonify({"error": "amount_limit must be a valid number"}), 400

    try:
        month = int(month)
        year = int(year)
        if not (1 <= month <= 12):
            return jsonify({"error": "month must be between 1 and 12"}), 400
        if year < 2000:
            return jsonify({"error": "year must be >= 2000"}), 400
    except Exception:
        return jsonify({"error": "month and year must be integers"}), 400

    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT INTO Budgets (user_id, category_id, amount_limit, month, year)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (user_id, category_id, amount_limit, month, year),
        )

        conn.commit()
        new_id = cursor.lastrowid

        cursor.close()
        conn.close()

        return jsonify({"message": "Budget created", "budget_id": new_id}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# PUT /budgets
@budgets_bp.route("/budgets/<int:budget_id>", methods=["PUT"])
def update_budget(budget_id):
    """
    Update an existing budget's category and/or limit.
    Month/year stay the same. Only the owner (user_id) can update.
    """
    user_id, error = get_user_id_from_token()
    if error:
        return jsonify({"error": error}), 401

    data = request.get_json() or {}
    category_id = data.get("category_id")
    amount_limit = data.get("amount_limit")

    if amount_limit is None:
        return jsonify({"error": "amount_limit is required"}), 400

    try:
        amount_limit = float(amount_limit)
        if amount_limit <= 0:
            return jsonify({"error": "amount_limit must be > 0"}), 400
    except Exception:
        return jsonify({"error": "amount_limit must be a valid number"}), 400

    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            UPDATE Budgets
               SET category_id = %s,
                   amount_limit = %s
             WHERE budget_id = %s
               AND user_id = %s
            """,
            (category_id, amount_limit, budget_id, user_id),
        )

        if cursor.rowcount == 0:
            cursor.close()
            conn.close()
            return jsonify({"error": "Budget not found"}), 404

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Budget updated"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# DELETE /budgets
@budgets_bp.route("/budgets/<int:budget_id>", methods=["DELETE"])
def delete_budget(budget_id):
    user_id, error = get_user_id_from_token()
    if error:
        return jsonify({"error": error}), 401

    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            DELETE FROM Budgets
            WHERE budget_id = %s AND user_id = %s
            """,
            (budget_id, user_id),
        )

        affected = cursor.rowcount
        conn.commit()
        cursor.close()
        conn.close()

        if affected == 0:
            return jsonify({"error": "Budget not found"}), 404

        return jsonify({"message": "Budget deleted"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
