import os
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

def clean_env(name, default=""):
    return (os.getenv(name, default) or "").strip()

def get_connection():
    return mysql.connector.connect(
        host=clean_env("DB_HOST"),
        user=clean_env("DB_USER"),
        password=clean_env("DB_PASSWORD"),
        database=clean_env("DB_NAME"),
        port=int(clean_env("DB_PORT", "3306")),
        ssl_disabled=False,
        connection_timeout=15
    )
