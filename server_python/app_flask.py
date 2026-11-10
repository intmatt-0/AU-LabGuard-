#!/usr/bin/env python3
"""
Arellano University Asset & Inventory - Flask REST API & Kiosk Server
Optional Flask implementation for developers who prefer Flask.
To run:
    pip install -r requirements.txt
    python app_flask.py
"""

import os
import sqlite3
import datetime
import json
from flask import Flask, request, jsonify, render_template_string, send_from_directory

app = Flask(__name__)
DB_PATH = os.path.join(os.path.dirname(__file__), "inventory.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "system": "Arellano University Asset & Inventory Kiosk",
        "framework": "Flask 3.x",
        "time": datetime.datetime.now(datetime.timezone.utc).isoformat()
    })

@app.route("/api/stats", methods=["GET"])
def stats():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as total FROM items")
    total = cursor.fetchone()["total"]
    cursor.execute("SELECT COUNT(*) as available FROM items WHERE status='available'")
    available = cursor.fetchone()["available"]
    cursor.execute("SELECT COUNT(*) as borrowed FROM items WHERE status='borrowed'")
    borrowed = cursor.fetchone()["borrowed"]
    cursor.execute("SELECT COUNT(*) as maintenance FROM items WHERE status='maintenance'")
    maintenance = cursor.fetchone()["maintenance"]
    conn.close()

    return jsonify({
        "totalItems": total,
        "available": available,
        "borrowed": borrowed,
        "maintenance": maintenance
    })

@app.route("/api/items", methods=["GET"])
def get_items():
    search = request.args.get("search", "")
    status = request.args.get("status", "")
    conn = get_db()
    cursor = conn.cursor()

    sql = "SELECT * FROM items WHERE 1=1"
    params = []
    if search:
        sql += " AND (name LIKE ? OR id LIKE ? OR serial_number LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])
    if status:
        sql += " AND status = ?"
        params.append(status)

    cursor.execute(sql, params)
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify({"items": rows, "count": len(rows)})

@app.route("/api/items/<item_id>", methods=["GET"])
def get_item(item_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM items WHERE id = ? OR serial_number = ?", (item_id, item_id))
    row = cursor.fetchone()
    conn.close()
    if row:
        return jsonify(dict(row))
    return jsonify({"error": f"Item '{item_id}' not found"}), 404

@app.route("/api/scan", methods=["POST"])
def scan_qr():
    data = request.get_json(silent=True) or {}
    payload = data.get("payload", "").strip()
    item_id = payload

    if payload.startswith("{"):
        try:
            parsed = json.loads(payload)
            item_id = parsed.get("id", item_id)
        except Exception:
            pass

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM items WHERE id = ? OR serial_number = ?", (item_id, item_id))
    row = cursor.fetchone()
    conn.close()

    if row:
        return jsonify({"success": True, "item": dict(row)})
    return jsonify({"success": False, "message": f"Asset tag '{item_id}' not recognized."}), 404

@app.route("/api/borrow", methods=["POST"])
def borrow_item():
    data = request.get_json(silent=True) or {}
    item_id = data.get("itemId")
    user_id = data.get("userId", "2024-04128-AU")
    user_name = data.get("userName", "Student User")
    hours = int(data.get("hours", 4))

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM items WHERE id = ?", (item_id,))
    item = cursor.fetchone()

    if not item:
        conn.close()
        return jsonify({"error": "Item not found"}), 404
    if item["status"] != "available":
        conn.close()
        return jsonify({"error": f"Item is currently {item['status']}"}), 400

    now = datetime.datetime.now(datetime.timezone.utc)
    due_at = (now + datetime.timedelta(hours=hours)).isoformat()

    cursor.execute("""
    UPDATE items SET status = 'borrowed', borrower_id = ?, borrower_name = ?, borrower_due = ?, quantity = 0
    WHERE id = ?
    """, (user_id, user_name, due_at, item_id))

    txn_id = f"TXN-{int(now.timestamp())}"
    cursor.execute("""
    INSERT INTO transactions (id, item_id, item_name, type, user_id, user_name, timestamp, details)
    VALUES (?, ?, ?, 'borrow', ?, ?, ?, ?)
    """, (txn_id, item_id, item["name"], user_id, user_name, now.isoformat(), f"Borrowed via Kiosk. Due in {hours} hours."))

    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": f"Item checked out to {user_name}", "dueAt": due_at})

@app.route("/api/return", methods=["POST"])
def return_item():
    data = request.get_json(silent=True) or {}
    item_id = data.get("itemId")
    condition = data.get("condition", "good")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM items WHERE id = ?", (item_id,))
    item = cursor.fetchone()

    if not item:
        conn.close()
        return jsonify({"error": "Item not found"}), 404

    now = datetime.datetime.now(datetime.timezone.utc)
    new_status = "maintenance" if condition == "needs_repair" else "available"

    cursor.execute("""
    UPDATE items SET status = ?, condition = ?, borrower_id = NULL, borrower_name = NULL, borrower_due = NULL, quantity = 1
    WHERE id = ?
    """, (new_status, condition, item_id))

    txn_id = f"TXN-{int(now.timestamp())}"
    cursor.execute("""
    INSERT INTO transactions (id, item_id, item_name, type, user_id, user_name, timestamp, details)
    VALUES (?, ?, ?, 'return', ?, ?, ?, ?)
    """, (txn_id, item_id, item["name"], item["borrower_id"] or "Unknown", item["borrower_name"] or "Student/Faculty", now.isoformat(), f"Returned in {condition} condition."))

    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": f"Item {item_id} returned successfully", "newStatus": new_status})

@app.route("/api/transactions", methods=["GET"])
def transactions():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM transactions ORDER BY timestamp DESC LIMIT 50")
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify({"transactions": rows})

if __name__ == "__main__":
    from app import init_db
    init_db()
    port = int(os.environ.get("PORT", 5000))
    print(f"Starting Arellano University Flask Server on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=False)
