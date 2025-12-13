# routes/Category.py
from flask import Blueprint, request, jsonify
from db import get_connection
from auth_utils import get_user_id_from_token

category_bp = Blueprint("category", __name__)

# Default categories
DEFAULT_CATEGORIES = [
    ("Salary", "income"),
    ("Rent", "expense"),
    ("Groceries", "expense"),
    ("Education", "expense"),
    ("Travel", "expense"),
    ("Shopping", "expense"),
    ("Investments", "income"),
]


def ensure_default_categories(conn, user_id: int):
    """
    If the user has no categories yet, insert the standard defaults.
    Called whenever /categories is fetched.
    """
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM Categories WHERE user_id = %s", (user_id,))
    count = cur.fetchone()[0]

    if count == 0:
        cur.executemany(
            """
            INSERT INTO Categories (user_id, name, type)
            VALUES (%s, %s, %s)
            """,
            [(user_id, name, type_) for (name, type_) in DEFAULT_CATEGORIES],
        )
        conn.commit()

    cur.close()



# GET /categories

@category_bp.route("/categories", methods=["GET"])
def list_categories():
    user_id, error = get_user_id_from_token()
    if error:
        return jsonify({"error": error}), 401

    try:
        conn = get_connection()
        ensure_default_categories(conn, user_id)

        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT category_id, name, type
            FROM Categories
            WHERE user_id = %s
            ORDER BY name
            """,
            (user_id,),
        )
        rows = cursor.fetchall()
        cursor.close()
        conn.close()

        return jsonify(rows), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500



# POST /categories  

@category_bp.route("/categories", methods=["POST"])
@category_bp.route("/category", methods=["POST"])
def add_category():
    user_id, error = get_user_id_from_token()
    if error:
        return jsonify({"error": error}), 401

    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    type_ = (data.get("type") or "expense").strip().lower()

    if not name or type_ not in ("income", "expense"):
        return jsonify({"error": "name and valid type are required"}), 400

    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Prevent duplicates (case-insensitive)
        cursor.execute(
            """
            SELECT category_id
            FROM Categories
            WHERE user_id = %s
              AND LOWER(name) = LOWER(%s)
              AND type = %s
            """,
            (user_id, name, type_),
        )
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"error": "Category with this name and type already exists"}), 400

        cursor.execute(
            """
            INSERT INTO Categories (user_id, name, type)
            VALUES (%s, %s, %s)
            """,
            (user_id, name, type_),
        )
        conn.commit()
        new_id = cursor.lastrowid

        cursor.close()
        conn.close()

        return jsonify(
            {
                "message": "Category created",
                "category_id": new_id,
                "name": name,
                "type": type_,
            }
        ), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500



# PUT /category/<id>

@category_bp.route("/category/<int:category_id>", methods=["PUT"])
def update_category(category_id):
    user_id, error = get_user_id_from_token()
    if error:
        return jsonify({"error": error}), 401

    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    type_ = (data.get("type") or "").strip().lower()

    if not name or type_ not in ("income", "expense"):
        return jsonify({"error": "name and valid type are required"}), 400

    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT category_id FROM Categories WHERE category_id = %s AND user_id = %s",
            (category_id, user_id),
        )
        if cursor.fetchone() is None:
            cursor.close()
            conn.close()
            return jsonify({"error": "Category not found"}), 404

        cursor.execute(
            """
            UPDATE Categories
            SET name = %s, type = %s
            WHERE category_id = %s AND user_id = %s
            """,
            (name, type_, category_id, user_id),
        )
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({"message": "Category updated"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# DELETE /category/<id>
@category_bp.route("/category/<int:category_id>", methods=["DELETE"])
def delete_category(category_id):
    user_id, error = get_user_id_from_token()
    if error:
        return jsonify({"error": error}), 401

    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(
            "DELETE FROM Categories WHERE category_id = %s AND user_id = %s",
            (category_id, user_id),
        )
        conn.commit()
        deleted = cursor.rowcount

        cursor.close()
        conn.close()

        if deleted == 0:
            return jsonify({"error": "Category not found"}), 404

        return jsonify({"message": "Category deleted"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
