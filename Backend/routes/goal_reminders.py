# routes/goal_reminders.py
from datetime import date
from db import get_connection
from email_util import send_email


def check_and_send_goal_reminders() -> int:
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT 
            g.goal_id,
            g.user_id,
            g.goal_name,
            g.target_amount,
            g.current_saved,
            g.deadline,
            u.email,
            u.username
        FROM SavingsGoals g
        JOIN Users u ON u.user_id = g.user_id
        WHERE g.deadline IS NOT NULL
          AND g.deadline >= CURDATE()
          AND g.deadline <= DATE_ADD(CURDATE(), INTERVAL 3 DAY)
        """
    )

    rows = cursor.fetchall()
    sent_count = 0
    today = date.today()

    for row in rows:
        target = float(row["target_amount"] or 0)
        saved = float(row["current_saved"] or 0)
        remaining = target - saved

        if remaining <= 0:
            continue

        days_left = (row["deadline"] - today).days
        if days_left < 0:
            continue

        
        sig = f"[GOAL_REMINDER][goal_id={row['goal_id']}]"
        dup_cur = conn.cursor(dictionary=True)
        dup_cur.execute(
            """
            SELECT notification_id
            FROM Notifications
            WHERE user_id = %s
              AND goal_id = %s
              AND type = 'savings_milestone'
              AND message = %s
              AND DATE(date) = CURDATE()
            LIMIT 1
            """,
            (row["user_id"], row["goal_id"], sig),
        )
        already = dup_cur.fetchone()
        dup_cur.close()

        if already:
            continue

        subject = f"⏰ Savings Goal Reminder: {row['goal_name']} (due soon)"
        body = (
            f"Hi {row['username']},\n\n"
            f"Your savings goal '{row['goal_name']}' is due on {row['deadline']}.\n"
            f"Target: PKR {target:.2f}\n"
            f"Saved: PKR {saved:.2f}\n"
            f"Remaining: PKR {remaining:.2f}\n"
            f"Days left: {days_left}\n\n"
            f"Keep going! 💪\n"
            f"— My Money Pal"
        )

        send_email(row["email"], subject, body)
        sent_count += 1

        log_cur = conn.cursor()
        log_cur.execute(
            """
            INSERT INTO Notifications (user_id, goal_id, message, type)
            VALUES (%s, %s, %s, 'savings_milestone')
            """,
            (row["user_id"], row["goal_id"], sig),
        )
        log_cur.close()

    conn.commit()
    cursor.close()
    conn.close()
    return sent_count
