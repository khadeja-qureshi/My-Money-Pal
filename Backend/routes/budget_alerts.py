# routes/budget_alerts.py
from flask import Blueprint, jsonify
from db import get_connection
from email_util import send_email

budget_alerts_bp = Blueprint("budget_alerts_bp", __name__)

NEAR_LIMIT_THRESHOLD = 0.8  # 80%


def check_and_send_budget_alerts():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            b.budget_id,
            b.user_id,
            b.category_id,
            b.amount_limit,
            b.month,
            b.year,
            u.email,
            u.username,
            COALESCE((
                SELECT SUM(t.amount)
                FROM Transactions t
                WHERE t.user_id = b.user_id
                  AND t.category_id = b.category_id
                  AND t.type = 'expense'
                  AND MONTH(t.date) = b.month
                  AND YEAR(t.date) = b.year
            ), 0) AS spent_amount
        FROM Budgets b
        JOIN Users u ON u.user_id = b.user_id
    """)

    budgets = cursor.fetchall()
    sent = 0

    for row in budgets:
        limit_amount = float(row["amount_limit"] or 0)
        spent = float(row["spent_amount"] or 0)

        if limit_amount <= 0 or spent <= 0:
            continue

        ratio = spent / limit_amount
        if ratio < NEAR_LIMIT_THRESHOLD:
            continue

        
        sig = f"[BUDGET_ALERT][budget_id={row['budget_id']}]"
        dup_cur = conn.cursor(dictionary=True)
        dup_cur.execute(
            """
            SELECT notification_id
            FROM Notifications
            WHERE user_id = %s
              AND type = 'budget_alert'
              AND message = %s
              AND DATE(date) = CURDATE()
            LIMIT 1
            """,
            (row["user_id"], sig),
        )
        already = dup_cur.fetchone()
        dup_cur.close()

        if already:
            continue

        subject = f"⚠️ Budget Alert ({row['username']}): {ratio*100:.0f}% used"
        body = (
            f"Hi {row['username']},\n\n"
            f"You have spent PKR {spent:.2f} out of PKR {limit_amount:.2f} "
            f"for this month's budget.\n\n"
            f"Usage: {ratio*100:.1f}%\n\n"
            f"Please review your expenses.\n\n"
            f"— My Money Pal"
        )

        send_email(row["email"], subject, body)
        sent += 1

       
        log_cur = conn.cursor()
        log_cur.execute(
            """
            INSERT INTO Notifications (user_id, goal_id, message, type)
            VALUES (%s, NULL, %s, 'budget_alert')
            """,
            (row["user_id"], sig),
        )
        log_cur.close()

    conn.commit()
    cursor.close()
    conn.close()
    return sent


@budget_alerts_bp.route("/debug/send-budget-alerts", methods=["POST"])
def debug_send_budget_alerts():
    sent = check_and_send_budget_alerts()
    return jsonify({"sent": sent}), 200
