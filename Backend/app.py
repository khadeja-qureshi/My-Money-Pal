# app.py
import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from apscheduler.schedulers.background import BackgroundScheduler

from db import get_connection


load_dotenv()


from routes.signup import signup_bp
from routes.login import login_bp
from routes.forgot_password import forgot_bp
from routes.logout import logout_bp
from routes.income import income_bp
from routes.expense import expense_bp
from routes.dashboard import dashboard_bp
from routes.charts import charts_bp
from routes.Category import category_bp
from routes.transactions import transactions_bp
from routes.goals import goals_bp
from routes.budgets import budgets_bp
from routes.profile import profile_bp
from routes.reset_password import reset_password_bp

from routes.goal_reminders import check_and_send_goal_reminders
from routes.budget_alerts import budget_alerts_bp, check_and_send_budget_alerts
from routes.notifications import notifications_bp



app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret")
CORS(app)


app.register_blueprint(signup_bp)
app.register_blueprint(login_bp)
app.register_blueprint(forgot_bp)
app.register_blueprint(logout_bp)
app.register_blueprint(income_bp)
app.register_blueprint(expense_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(charts_bp)
app.register_blueprint(category_bp)
app.register_blueprint(transactions_bp)
app.register_blueprint(goals_bp)
app.register_blueprint(budgets_bp)
app.register_blueprint(profile_bp)
app.register_blueprint(reset_password_bp)
app.register_blueprint(budget_alerts_bp)
app.register_blueprint(notifications_bp)


@app.route("/")
def home():
    return jsonify({"message": "Flask is running!"})



# Automated email scheduler

_scheduler = None

def start_schedulers():
    """
    Starts APScheduler jobs.
    - Goal reminders: every 1 minute (for testing)
    - Budget alerts: daily at 19:00 (Asia/Karachi)
    """
    global _scheduler
    if _scheduler and _scheduler.running:
        return  

    _scheduler = BackgroundScheduler(timezone="Asia/Karachi")

    #  Savings goals -> 7:00 PM
    _scheduler.add_job(
        check_and_send_goal_reminders,
        trigger="cron",
        hour = 19,
        minute=0,
        id="goal_reminder_job",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
    )

    #  Budget alerts → 7:00 PM
    _scheduler.add_job(
        check_and_send_budget_alerts,
        trigger="cron",
        hour=19,
        minute=0,
        id="budget_alert_job",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
    )

    _scheduler.start()
    print("✔ Automatic Email Schedulers Started")




@app.route("/debug/send-goal-reminders", methods=["POST"])
def debug_send_goal_reminders_api():
    sent = check_and_send_goal_reminders()
    return jsonify({"sent": sent}), 200


@app.route("/debug/send-budget-alerts", methods=["POST"])
def debug_send_budget_alerts_api():
    sent = check_and_send_budget_alerts()
    return jsonify({"sent": sent}), 200


@app.route("/test-db")
def test_db():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM Users")
        count = cursor.fetchone()[0]
        cursor.close()
        conn.close()
        return jsonify({"users_count": count})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true":
        start_schedulers()

    app.run(debug=True)
