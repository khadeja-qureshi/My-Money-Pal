# routes/goals.py
from flask import Blueprint, request, jsonify
from db import get_connection
from auth_utils import get_user_id_from_token

goals_bp = Blueprint("goals", __name__)


# LIST GOALS
@goals_bp.route("/goals", methods=["GET"])
def list_goals():
    user_id, error = get_user_id_from_token()
    if error:
        return jsonify({"error": error}), 401

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT 
                goal_id,
                goal_name,
                target_amount,
                current_saved,
                deadline,
                category_id,
                notify_enabled,
                progress,
                CASE
                    WHEN current_saved >= target_amount THEN 'Completed'
                    WHEN current_saved > 0 THEN 'In Progress'
                    ELSE 'Pending'
                END AS status
            FROM SavingsGoals
            WHERE user_id = %s
            ORDER BY created_at DESC
            """,
            (user_id,),
        )

        rows = cursor.fetchall()
        cursor.close()
        conn.close()

        return jsonify(rows), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# CREATE GOAL
@goals_bp.route("/goals", methods=["POST"])
def create_goal():
    user_id, error = get_user_id_from_token()
    if error:
        return jsonify({"error": error}), 401

    data = request.get_json() or {}
    goal_name = data.get("goal_name")
    target_amount = data.get("target_amount")
    category_id = data.get("category_id")
    deadline = data.get("deadline")            # required
    notify_enabled = bool(data.get("notify_enabled", False))

    if not goal_name or target_amount is None or not deadline:
        return jsonify({"error": "goal_name, target_amount and deadline are required"}), 400

    try:
        target_amount = float(target_amount)
        if target_amount <= 0:
            return jsonify({"error": "target_amount must be > 0"}), 400
    except Exception:
        return jsonify({"error": "target_amount must be a valid number"}), 400

    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            """
            INSERT INTO SavingsGoals
              (user_id, category_id, goal_name, target_amount,
               current_saved, deadline, progress, notify_enabled)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                user_id,
                category_id,
                goal_name,
                target_amount,
                0.0,
                deadline,
                0.0,                  # progress
                1 if notify_enabled else 0,
            ),
        )

        conn.commit()
        new_id = cur.lastrowid

        cur.close()
        conn.close()

        return jsonify({"message": "Goal created", "goal_id": new_id}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# CONTRIBUTE TO GOAL
@goals_bp.route("/goals/<int:goal_id>/contribute", methods=["POST"])
def contribute_to_goal(goal_id):
    user_id, error = get_user_id_from_token()
    if error:
        return jsonify({"error": error}), 401

    data = request.get_json() or {}
    amount = data.get("amount")

    if amount is None:
        return jsonify({"error": "amount is required"}), 400

    try:
        amount = float(amount)
        if amount <= 0:
            return jsonify({"error": "amount must be > 0"}), 400
    except Exception:
        return jsonify({"error": "amount must be a valid number"}), 400

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT current_saved, target_amount
            FROM SavingsGoals
            WHERE goal_id = %s AND user_id = %s
            """,
            (goal_id, user_id),
        )
        goal = cursor.fetchone()

        if not goal:
            cursor.close()
            conn.close()
            return jsonify({"error": "Goal not found"}), 404

        current_saved = float(goal["current_saved"])
        target_amount = float(goal["target_amount"])

        if current_saved >= target_amount:
            cursor.close()
            conn.close()
            return jsonify({"error": "This goal is already fully funded."}), 400

        remaining = target_amount - current_saved
        if amount > remaining:
            cursor.close()
            conn.close()
            return jsonify(
                {
                    "error": (
                        f"Amount exceeds remaining goal by {amount - remaining:.2f}. "
                        f"Max allowed: {remaining:.2f}"
                    )
                }
            ), 400

        new_saved = current_saved + amount
        progress = round((new_saved / target_amount) * 100, 2)
        status = "Completed" if progress >= 100 else "In Progress"

        cursor.execute(
            """
            UPDATE SavingsGoals
            SET current_saved = %s,
                progress = %s,
                status = %s
            WHERE goal_id = %s AND user_id = %s
            """,
            (new_saved, progress, status, goal_id, user_id),
        )

        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({"message": "Contribution added", "status": status}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# UPDATE GOAL
@goals_bp.route("/goals/<int:goal_id>", methods=["PUT"])
def update_goal(goal_id):
    user_id, error = get_user_id_from_token()
    if error:
        return jsonify({"error": error}), 401

    data = request.get_json() or {}

    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            UPDATE SavingsGoals
            SET goal_name = %s,
                target_amount = %s,
                deadline = %s,
                category_id = %s,
                notify_enabled = %s
            WHERE goal_id = %s AND user_id = %s
            """,
            (
                data.get("goal_name"),
                data.get("target_amount"),
                data.get("deadline"),
                data.get("category_id"),
                1 if data.get("notify_enabled") else 0,
                goal_id,
                user_id,
            ),
        )

        conn.commit()
        updated = cursor.rowcount

        cursor.close()
        conn.close()

        if updated == 0:
            return jsonify({"error": "Goal not found"}), 404

        return jsonify({"message": "Goal updated"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# DELETE GOAL
@goals_bp.route("/goals/<int:goal_id>", methods=["DELETE"])
def delete_goal(goal_id):
    user_id, error = get_user_id_from_token()
    if error:
        return jsonify({"error": error}), 401

    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            DELETE FROM SavingsGoals
            WHERE goal_id = %s AND user_id = %s
            """,
            (goal_id, user_id),
        )

        conn.commit()
        deleted = cursor.rowcount

        cursor.close()
        conn.close()

        if deleted == 0:
            return jsonify({"error": "Goal not found"}), 404

        return jsonify({"message": "Goal deleted"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
