#!/usr/bin/env python3
"""
Arellano University Asset & Inventory Kiosk Server
Standalone Python 3 HTTP & SQLite REST Server (Zero pip dependencies required).
Runs out-of-the-box on:
  - Windows PC (python app.py)
  - macOS / Linux PC (python3 app.py)
  - Raspberry Pi 3/4/5 (Raspberry Pi OS Bookworm/Bullseye)
"""

import sys
import os
import json
import sqlite3
import datetime
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

PORT = int(os.environ.get("PORT", 5000))
DB_PATH = os.path.join(os.path.dirname(__file__), "inventory.db")

# -------------------------------------------------------------
# Database Management
# -------------------------------------------------------------

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        serial_number TEXT NOT NULL,
        campus TEXT NOT NULL,
        department TEXT NOT NULL,
        room TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'available',
        condition TEXT NOT NULL DEFAULT 'excellent',
        quantity INTEGER DEFAULT 1,
        total_quantity INTEGER DEFAULT 1,
        qr_payload TEXT NOT NULL,
        borrower_id TEXT,
        borrower_name TEXT,
        borrower_due TEXT,
        date_acquired TEXT,
        notes TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        item_id TEXT NOT NULL,
        item_name TEXT NOT NULL,
        type TEXT NOT NULL,
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        details TEXT NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        id_number TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        user_type TEXT NOT NULL,
        department TEXT NOT NULL,
        pin TEXT NOT NULL
    )
    """)

    # Seed initial sample data if empty
    cursor.execute("SELECT COUNT(*) as count FROM items")
    if cursor.fetchone()["count"] == 0:
        sample_items = [
            (
                "AU-IT-0101",
                "Lenovo ThinkPad L14 Gen 4 Core i7",
                "Computing & Laptops",
                "SN-LNVO-883921",
                "Juan Sumulong Campus (Legarda, Manila)",
                "College of Computer Studies & Information Technology",
                "Lab 402 - Systems Lab",
                "available",
                "excellent",
                1, 1,
                json.dumps({"prefix": "AU-INV", "id": "AU-IT-0101", "name": "Lenovo ThinkPad L14 Gen 4 Core i7"}),
                None, None, None,
                "2024-06-15",
                "Configured for Computer Studies programming and thesis work."
            ),
            (
                "AU-ROB-0315",
                "Raspberry Pi 4 Model B (8GB) Kiosk Controller Kit",
                "Electronics & Robotics",
                "SN-RPI4-904128",
                "Juan Sumulong Campus (Legarda, Manila)",
                "Senior High School STEM & Robotics Lab",
                "Room 305 - Robotics Hub",
                "borrowed",
                "good",
                0, 1,
                json.dumps({"prefix": "AU-INV", "id": "AU-ROB-0315", "name": "Raspberry Pi 4 Model B (8GB)"}),
                "2024-04128-AU", "Juan Dela Cruz", "2026-11-10T17:00:00Z",
                "2024-02-10",
                "Contains official 7-inch DSI touchscreen display and 15W power supply."
            ),
            (
                "AU-NUR-0204",
                "Gaumard Code Blue Pediatric Patient Simulator",
                "Nursing & Health Sciences",
                "SN-GMRD-441029",
                "Juan Sumulong Campus (Legarda, Manila)",
                "College of Nursing & Allied Medical Sciences",
                "Simulation Ward B (Floor 3)",
                "available",
                "excellent",
                1, 1,
                json.dumps({"prefix": "AU-INV", "id": "AU-NUR-0204", "name": "Gaumard Code Blue Pediatric"}),
                None, None, None,
                "2023-09-01",
                "Pediatric nursing resuscitation trainer with cardiac rhythms."
            ),
            (
                "AU-AV-0402",
                "Epson EB-2250U 5000-Lumen WUXGA Projector",
                "Audio-Visual & Multimedia",
                "SN-EPSN-773104",
                "Juan Sumulong Campus (Legarda, Manila)",
                "Audio-Visual & Multimedia Services",
                "AV Dispatch Room 101",
                "available",
                "good",
                1, 1,
                json.dumps({"prefix": "AU-INV", "id": "AU-AV-0402", "name": "Epson EB-2250U Projector"}),
                None, None, None,
                "2023-11-20",
                "Includes padded shoulder carry bag and HDMI cord."
            )
        ]
        cursor.executemany("""
        INSERT INTO items (id, name, category, serial_number, campus, department, room, status, condition, quantity, total_quantity, qr_payload, borrower_id, borrower_name, borrower_due, date_acquired, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, sample_items)

        # Seed initial users
        sample_users = [
            ("user-1", "AU-ADM-2024-01", "Prof. Maria Cristina Santos", "admin", "custodian", "Campus Property & Custodial Office", "1938"),
            ("user-2", "2024-04128-AU", "Juan Dela Cruz", "user", "student", "College of Computer Studies", "1234"),
            ("user-3", "2023-01924-AU", "Aiko Michelle Reyes", "user", "student", "College of Nursing", "2023"),
            ("user-4", "FAC-2019-088", "Engr. Roberto M. Diaz", "user", "faculty", "School of Engineering", "8800"),
        ]
        cursor.executemany("""
        INSERT INTO users (id, id_number, name, role, user_type, department, pin)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, sample_users)

        # Seed initial transaction
        cursor.execute("""
        INSERT INTO transactions (id, item_id, item_name, type, user_id, user_name, timestamp, details)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "TXN-INIT-001",
            "AU-ROB-0315",
            "Raspberry Pi 4 Model B (8GB) Kiosk Controller Kit",
            "borrow",
            "2024-04128-AU",
            "Juan Dela Cruz",
            datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "Checked out for Capstone Project at Kiosk Station 1"
        ))

    conn.commit()
    conn.close()

# -------------------------------------------------------------
# HTTP Request Handler
# -------------------------------------------------------------

class AUInventoryHandler(SimpleHTTPRequestHandler):

    def send_json_response(self, data, status_code=200):
        body = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        if path == "/api/health":
            self.send_json_response({
                "status": "healthy",
                "system": "Arellano University QR Inventory Kiosk",
                "runtime": "Python 3 Standard Library",
                "time": datetime.datetime.now().isoformat()
            })
            return

        if path == "/api/stats":
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

            self.send_json_response({
                "totalItems": total,
                "available": available,
                "borrowed": borrowed,
                "maintenance": maintenance
            })
            return

        if path == "/api/items":
            conn = get_db()
            cursor = conn.cursor()
            search = query.get("search", [""])[0]
            status = query.get("status", [""])[0]

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
            self.send_json_response({"items": rows, "count": len(rows)})
            return

        if path.startswith("/api/items/"):
            item_id = path.split("/api/items/")[1].strip()
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM items WHERE id = ? OR serial_number = ?", (item_id, item_id))
            row = cursor.fetchone()
            conn.close()
            if row:
                self.send_json_response(dict(row))
            else:
                self.send_json_response({"error": f"Item '{item_id}' not found"}, 404)
            return

        if path == "/api/transactions":
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM transactions ORDER BY timestamp DESC LIMIT 50")
            rows = [dict(row) for row in cursor.fetchall()]
            conn.close()
            self.send_json_response({"transactions": rows})
            return

        # If static build or index exists in dist or current directory, serve it
        dist_path = os.path.join(os.path.dirname(__file__), "..", "dist")
        if os.path.exists(dist_path) and os.path.exists(os.path.join(dist_path, "index.html")):
            self.directory = dist_path
            return super().do_GET()

        # Fallback friendly HTML Welcome page for standalone kiosk/PC testing
        html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Arellano University QR Inventory Kiosk (Python Server)</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #072152; color: #fff; margin: 0; padding: 40px; display: flex; justify-content: center; }}
    .card {{ background: #ffffff; color: #0f172a; max-width: 680px; width: 100%; border-radius: 16px; padding: 36px; box-shadow: 0 20px 40px rgba(0,0,0,0.3); }}
    .header {{ border-bottom: 2px solid #003893; padding-bottom: 16px; margin-bottom: 20px; }}
    h1 {{ color: #003893; margin: 0 0 6px 0; font-size: 24px; }}
    .badge {{ background: #f4b400; color: #072152; font-weight: bold; padding: 4px 10px; border-radius: 6px; font-size: 12px; display: inline-block; }}
    .endpoint {{ background: #f1f5f9; padding: 10px 14px; border-radius: 8px; font-family: monospace; font-size: 13px; margin: 8px 0; display: flex; justify-content: space-between; }}
    .btn {{ background: #003893; color: white; border: none; padding: 10px 18px; border-radius: 8px; cursor: pointer; text-decoration: none; font-weight: 600; display: inline-block; margin-top: 16px; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <span class="badge">ARELLANO UNIVERSITY - CHIEFS INVENTORY</span>
      <h1>AU Asset & Inventory Python Server Active</h1>
      <p style="color: #64748b; margin: 4px 0 0 0;">Hostable on Raspberry Pi Kiosk & Local PC</p>
    </div>
    <p>The native Python 3 REST server and SQLite database are active and listening on port <strong>{PORT}</strong>.</p>
    <h3>Available API Endpoints:</h3>
    <div class="endpoint"><span>GET /api/health</span> <strong>Status Check</strong></div>
    <div class="endpoint"><span>GET /api/stats</span> <strong>Inventory Metrics</strong></div>
    <div class="endpoint"><span>GET /api/items</span> <strong>All QR-Bound Items</strong></div>
    <div class="endpoint"><span>GET /api/transactions</span> <strong>Activity & Audit Log</strong></div>
    <div class="endpoint"><span>POST /api/scan</span> <strong>QR Payload Processor</strong></div>
    <div class="endpoint"><span>POST /api/borrow</span> <strong>Equipment Checkout</strong></div>
    <div class="endpoint"><span>POST /api/return</span> <strong>Equipment Return</strong></div>
    <div style="margin-top: 24px;">
      <a class="btn" href="/api/items">Browse Items JSON</a>
      <a class="btn" style="background: #f4b400; color: #072152; margin-left: 10px;" href="/api/stats">View Stats JSON</a>
    </div>
  </div>
</body>
</html>"""
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(html.encode("utf-8"))))
        self.end_headers()
        self.wfile.write(html.encode("utf-8"))

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get("Content-Length", 0))
        raw_body = self.rfile.read(length).decode("utf-8") if length > 0 else "{}"
        
        try:
            body = json.loads(raw_body)
        except Exception:
            body = {}

        if path == "/api/scan":
            payload_str = body.get("payload", "").strip()
            item_id = payload_str
            # Check JSON
            if payload_str.startswith("{"):
                try:
                    parsed_json = json.loads(payload_str)
                    item_id = parsed_json.get("id", item_id)
                except Exception:
                    pass

            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM items WHERE id = ? OR serial_number = ?", (item_id, item_id))
            row = cursor.fetchone()
            conn.close()

            if row:
                self.send_json_response({"success": True, "item": dict(row)})
            else:
                self.send_json_response({"success": False, "message": f"No item bound to code: {item_id}"}, 404)
            return

        if path == "/api/borrow":
            item_id = body.get("itemId")
            user_id = body.get("userId", "2024-04128-AU")
            user_name = body.get("userName", "Student User")
            due_hours = body.get("hours", 4)

            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM items WHERE id = ?", (item_id,))
            item = cursor.fetchone()

            if not item:
                conn.close()
                self.send_json_response({"error": "Item not found"}, 404)
                return

            if item["status"] != "available":
                conn.close()
                self.send_json_response({"error": f"Item is currently {item['status']}"}, 400)
                return

            now = datetime.datetime.now(datetime.timezone.utc)
            due_at = (now + datetime.timedelta(hours=due_hours)).isoformat()
            
            cursor.execute("""
            UPDATE items SET status = 'borrowed', borrower_id = ?, borrower_name = ?, borrower_due = ?, quantity = 0
            WHERE id = ?
            """, (user_id, user_name, due_at, item_id))

            txn_id = f"TXN-{int(now.timestamp())}"
            cursor.execute("""
            INSERT INTO transactions (id, item_id, item_name, type, user_id, user_name, timestamp, details)
            VALUES (?, ?, ?, 'borrow', ?, ?, ?, ?)
            """, (txn_id, item_id, item["name"], user_id, user_name, now.isoformat(), f"Borrowed via Kiosk Station. Due in {due_hours} hours."))

            conn.commit()
            conn.close()

            self.send_json_response({
                "success": True,
                "message": f"Item {item_id} successfully checked out to {user_name}.",
                "dueAt": due_at
            })
            return

        if path == "/api/return":
            item_id = body.get("itemId")
            condition = body.get("condition", "good")
            notes = body.get("notes", "Returned via Kiosk Station")

            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM items WHERE id = ?", (item_id,))
            item = cursor.fetchone()

            if not item:
                conn.close()
                self.send_json_response({"error": "Item not found"}, 404)
                return

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
            """, (txn_id, item_id, item["name"], item["borrower_id"] or "Unknown", item["borrower_name"] or "Student/Faculty", now.isoformat(), f"Returned in {condition} condition. {notes}"))

            conn.commit()
            conn.close()

            self.send_json_response({
                "success": True,
                "message": f"Item {item_id} returned successfully.",
                "newStatus": new_status
            })
            return

        self.send_json_response({"error": "Unknown POST route"}, 404)

def run(port=PORT):
    init_db()
    server_address = ("0.0.0.0", port)
    httpd = HTTPServer(server_address, AUInventoryHandler)
    print("=" * 60)
    print("  ARELLANO UNIVERSITY - ASSET & INVENTORY KIOSK SERVER")
    print(f"  Listening on: http://0.0.0.0:{port}")
    print(f"  SQLite Database: {DB_PATH}")
    print("  Ready for Raspberry Pi Kiosk & Local PC operation")
    print("=" * 60)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer shutting down gracefully.")
        httpd.server_close()

if __name__ == "__main__":
    port_arg = int(sys.argv[1]) if len(sys.argv) > 1 else PORT
    run(port_arg)
