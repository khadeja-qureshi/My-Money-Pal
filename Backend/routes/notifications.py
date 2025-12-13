# routes/notifications.py
from flask import Blueprint, jsonify
from db import get_connection
from auth_utils import get_user_id_from_token

notifications_bp = Blueprint("notifications", __name__)


@notifications_bp.route("/notifications", methods=["GET"])
def list_notifications():
    """
    Returns all notifications for the current user, newest first.
    """
    user_id, error = get_user_id_from_token()
    if error:
        return jsonify({"error": error}), 401

    conn = get_connection()
    cur = conn.cursor(dictionary=True)

    cur.execute(
        """
        SELECT 
            notification_id,
            user_id,
            goal_id,
            message,
            type,
            created_at
        FROM Notifications
        WHERE user_id = %s
        ORDER BY created_at DESC
        """,
        (user_id,),
    )
    rows = cur.fetchall()

    cur.close()
    conn.close()

    return jsonify(rows), 200
