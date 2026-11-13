#!/usr/bin/env python3
"""
LabGuard+: A Smart Science Laboratory Safety Station with QR Code Equipment Tracking,
QR-Based User Log-In Monitoring, and LED Safety Status Display
Arellano University - Jose Rizal Campus (Senior High School Department)

Full-Blown Python Flask + SQLite3 Web Application serving 3 separate HTML files:
  1. templates/kiosk.html        -> GET / and GET /kiosk (Student Kiosk UI only)
  2. templates/student_form.html -> GET /student/checkout/<token> (QR-Redirected Student Info Form)
  3. templates/admin.html        -> GET /admin (Admin & Lab Personnel Dashboard)
"""

import base64
import io
import json
import os
import random
import sqlite3
import string
from datetime import datetime, timedelta, timezone
from flask import Flask, jsonify, render_template, request, send_from_directory

try:
    import qrcode
except ImportError:
    qrcode = None

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "labguard.db")
PUBLIC_DIR = os.path.join(BASE_DIR, "public")

app = Flask(__name__, template_folder=os.path.join(BASE_DIR, "templates"))

SAFETY_PRESETS = {
    "SAFE": {
        "headline": "LED STATUS: GREEN — LABORATORY SAFE FOR OPERATION",
        "message": "Standard laboratory operations active. Pick apparatus on the kiosk, scan the Checkout QR code, and complete student log-in.",
    },
    "CAUTION": {
        "headline": "LED STATUS: YELLOW — CAUTION · PPE & SUPERVISION REQUIRED",
        "message": "Active thermal, chemical, or fragile glassware experiment in progress. Laboratory gown, safety goggles, and closed-toe shoes are mandatory.",
    },
    "UNSAFE": {
        "headline": "LED STATUS: RED — UNSAFE · RESTRICTED LABORATORY ACCESS",
        "message": "Breakage, chemical spill, or maintenance alert reported. Equipment checkout is paused until cleared by Laboratory Personnel.",
    },
}

STUDENT_PRESETS = [
    {
        "id": 1,
        "student_name": "One Enrique Sebastian G. Abalos",
        "student_id_lrn": "AUJRC-2026-0101",
        "grade_section": "STEM",
        "school_email": "one.abalos@arellano.edu.ph",
        "default_subject": "General Biology 1 — Microscopy & Cell Structure",
        "default_teacher": "Ms. Lara Marie Agustin Puertollano",
    },
    {
        "id": 2,
        "student_name": "Christine S. Contreras",
        "student_id_lrn": "AUJRC-2026-0102",
        "grade_section": "STEM",
        "school_email": "christine.contreras@arellano.edu.ph",
        "default_subject": "General Chemistry 2 — Acid-Base Titration Lab",
        "default_teacher": "Ms. Lara Marie Agustin Puertollano",
    },
    {
        "id": 3,
        "student_name": "Queen Hannah A. Dones",
        "student_id_lrn": "AUJRC-2026-0103",
        "grade_section": "HUMSS",
        "school_email": "queenhannah.dones@arellano.edu.ph",
        "default_subject": "General Science — Observation & Field Notes",
        "default_teacher": "Ms. Lara Marie Agustin Puertollano",
    },
    {
        "id": 4,
        "student_name": "Collin Lenard M. Marcos",
        "student_id_lrn": "AUJRC-2026-0104",
        "grade_section": "ABM",
        "school_email": "collin.marcos@arellano.edu.ph",
        "default_subject": "Applied Research — Material Inventory Accounting",
        "default_teacher": "Ms. Lara Marie Agustin Puertollano",
    },
    {
        "id": 5,
        "student_name": "Ashlyjicks B. Pangilinan",
        "student_id_lrn": "AUJRC-2026-0105",
        "grade_section": "STEM",
        "school_email": "ashlyjicks.pangilinan@arellano.edu.ph",
        "default_subject": "General Chemistry 1 — Quantitative Solution Prep",
        "default_teacher": "Ms. Lara Marie Agustin Puertollano",
    },
    {
        "id": 6,
        "student_name": "Ms. Lara Marie Puertollano",
        "student_id_lrn": "AUJRC-FAC-0001",
        "grade_section": "FACULTY",
        "school_email": "lara.puertollano@arellano.edu.ph",
        "default_subject": "Science Laboratory Demonstration & Research",
        "default_teacher": "Self / Laboratory In-Charge",
    },
]

INITIAL_EQUIPMENT_SEED = [
    (
        1,
        "LG-EQ-001",
        "Beaker",
        "Glassware & Measuring",
        "/images/equipment/LG-EQ-001.svg",
        "Heat-resistant borosilicate glass beaker for mixing, heating, and approximate liquid volume measurement.",
        "1st - 1st Section",
        12,
        10,
        "pc",
        "Good",
        "SAFE",
        json.dumps([
            "Inspect glassware for chips or hairline cracks before pouring liquids",
            "Use wire gauze on a tripod stand when heating over a flame",
            "Rinse and dry thoroughly prior to returning to 1st - 1st Section",
        ]),
    ),
    (
        2,
        "LG-EQ-002",
        "Graduated Cylinder",
        "Glassware & Measuring",
        "/images/equipment/LG-EQ-002.svg",
        "Calibrated cylindrical glassware with hexagonal stability base for precise liquid volume measurement.",
        "2nd - 1st Section",
        10,
        9,
        "pc",
        "Good",
        "SAFE",
        json.dumps([
            "Place on a level laboratory bench and read the bottom of the meniscus at eye level",
            "Never heat graduated cylinders directly over a burner",
            "Rinse with distilled water before returning to 2nd - 1st Section",
        ]),
    ),
    (
        3,
        "LG-EQ-003",
        "Florence Flask",
        "Glassware & Measuring",
        "/images/equipment/LG-EQ-003.svg",
        "Round-bodied borosilicate boiling flask with slender neck designed for uniform heating and swirling of liquids.",
        "3rd - 1st Section",
        8,
        8,
        "pc",
        "Good",
        "CAUTION",
        json.dumps([
            "Wear buttoned laboratory gown and chemical splash goggles",
            "Support on wire gauze over a tripod stand or clamp neck securely",
            "Allow hot flask to cool completely before handling or returning to 3rd - 1st Section",
        ]),
    ),
    (
        4,
        "LG-EQ-004",
        "Glass Funnel",
        "Glassware & Measuring",
        "/images/equipment/LG-EQ-004.svg",
        "Conical borosilicate glass funnel with narrow stem for clean liquid transfer and gravity filtration.",
        "4th - 1st Section",
        10,
        10,
        "pc",
        "Good",
        "SAFE",
        json.dumps([
            "Seat folded filter paper snugly inside the cone when filtering mixtures",
            "Support funnel stem cleanly inside receiving flask to prevent tipping",
            "Wash and dry after reagent transfer before returning to 4th - 1st Section",
        ]),
    ),
    (
        5,
        "LG-EQ-005",
        "Erlenmeyer Flask",
        "Glassware & Measuring",
        "/images/equipment/LG-EQ-005.svg",
        "Conical flat-bottomed laboratory flask ideal for titration, swirling solutions, and preventing reagent splash.",
        "1st - 2nd Section",
        12,
        10,
        "pc",
        "Good",
        "SAFE",
        json.dumps([
            "Inspect rim and base for cracks prior to use",
            "Swirl gently by holding the narrow neck to mix reagents without spilling",
            "Rinse and place dry flask back in 1st - 2nd Section",
        ]),
    ),
    (
        6,
        "LG-EQ-006",
        "Test Tube, Holder & Rack Set",
        "Glassware & Measuring",
        "/images/equipment/LG-EQ-006.svg",
        "Complete small-scale reaction kit including glass test tubes, spring-wire test tube holder clamp, and multi-slot rack.",
        "2nd - 2nd Section",
        8,
        8,
        "set",
        "Good",
        "SAFE",
        json.dumps([
            "Always keep test tubes upright in the rack when unattended",
            "Use the test tube holder when warming samples and point opening away from peers",
            "Clean all tubes and return complete set to 2nd - 2nd Section",
        ]),
    ),
    (
        7,
        "LG-EQ-007",
        "Tripod Stand",
        "Heating & Thermal",
        "/images/equipment/LG-EQ-007.svg",
        "Heavy-duty cast-iron three-legged laboratory support stand used to hold beakers and flasks during heating.",
        "3rd - 2nd Section",
        8,
        7,
        "unit",
        "Good",
        "CAUTION",
        json.dumps([
            "Place on a level, heat-resistant workbench away from flammable items",
            "Center wire gauze securely on top ring before placing glassware",
            "Allow iron frame to cool completely before returning to 3rd - 2nd Section",
        ]),
    ),
    (
        8,
        "LG-EQ-008",
        "Bell Jar",
        "Glassware & Measuring",
        "/images/equipment/LG-EQ-008.svg",
        "Thick-walled domed glass bell jar with top knob handle for vacuum, pressure, and sealed atmospheric demonstrations.",
        "4th - 2nd Section",
        4,
        4,
        "unit",
        "Good",
        "SAFE",
        json.dumps([
            "Lift firmly with both hands using the top knob and lower rim",
            "Ensure smooth rim seal on the base plate before air evacuation",
            "Handle carefully and store upright inside 4th - 2nd Section",
        ]),
    ),
    (
        9,
        "LG-EQ-009",
        "Laboratory Gown",
        "Safety & PPE",
        "/images/equipment/LG-EQ-009.svg",
        "Protective white long-sleeve laboratory coat designed to shield clothing and skin from chemical splashes.",
        "1st - 3rd Section",
        15,
        13,
        "pc",
        "Good",
        "SAFE",
        json.dumps([
            "Button the laboratory gown completely from collar to hem before working",
            "Check sleeves and pockets are clear of loose flammable items",
            "Fold neatly and hang back inside 1st - 3rd Section after session",
        ]),
    ),
    (
        10,
        "LG-EQ-010",
        "Stirring Rod & PPE Kit (Glasses, Facemask, Gloves)",
        "Safety & PPE",
        "/images/equipment/LG-EQ-010.svg",
        "Combined reagent-handling and personal protection kit containing borosilicate stirring rod, PPE safety glasses, facemask, and gloves.",
        "2nd - 3rd Section",
        15,
        14,
        "kit",
        "Good",
        "SAFE",
        json.dumps([
            "Put on PPE glasses, facemask, and gloves before handling any chemicals",
            "Use glass stirring rod gently—do not strike beaker walls or bottom",
            "Sanitize PPE glasses and stirring rod before returning to 2nd - 3rd Section",
        ]),
    ),
    (
        11,
        "LG-EQ-011",
        "Compound Light Microscope",
        "Optical & Microscopy",
        "/images/equipment/LG-EQ-011.svg",
        "Binocular biological compound microscope with 4x, 10x, 40x, and 100x objectives and LED stage illumination.",
        "3rd - 3rd Section",
        8,
        6,
        "unit",
        "Good",
        "SAFE",
        json.dumps([
            "Carry microscope with two hands (one on arm, one under base)",
            "Clean objective lenses with optical lens paper only",
            "Lower stage to bottom, select 4x objective, and return to 3rd - 3rd Section",
        ]),
    ),
]


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(force_reset=False):
    conn = get_db()
    cur = conn.cursor()

    if force_reset:
        cur.execute("DROP TABLE IF EXISTS equipment")
        cur.execute("DROP TABLE IF EXISTS student_transactions")
        cur.execute("DROP TABLE IF EXISTS checkout_sessions")
        cur.execute("DROP TABLE IF EXISTS safety_status")

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS equipment (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            qr_code TEXT NOT NULL,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            image_url TEXT NOT NULL,
            description TEXT NOT NULL,
            storage_compartment TEXT NOT NULL,
            total_qty INTEGER NOT NULL,
            available_qty INTEGER NOT NULL,
            unit TEXT NOT NULL,
            condition TEXT NOT NULL,
            safety_level TEXT NOT NULL,
            prerequisites_json TEXT NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS checkout_sessions (
            session_token TEXT PRIMARY KEY,
            basket_json TEXT NOT NULL,
            qr_data_url TEXT NOT NULL,
            mobile_url TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            completed_transaction_json TEXT
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS student_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            transaction_code TEXT NOT NULL,
            student_name TEXT NOT NULL,
            student_id_lrn TEXT NOT NULL,
            grade_section TEXT NOT NULL,
            school_email TEXT NOT NULL,
            subject_activity TEXT NOT NULL,
            teacher_name TEXT NOT NULL,
            items_json TEXT NOT NULL,
            total_items_count INTEGER NOT NULL,
            safety_checked_json TEXT NOT NULL,
            time_in TEXT NOT NULL,
            expected_return TEXT NOT NULL,
            time_out TEXT,
            return_condition TEXT,
            return_notes TEXT,
            status TEXT NOT NULL
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS safety_status (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            level TEXT NOT NULL,
            headline TEXT NOT NULL,
            message TEXT NOT NULL,
            updated_by TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )

    now_iso = datetime.now(timezone.utc).isoformat()

    cur.execute("SELECT COUNT(*) FROM equipment")
    if cur.fetchone()[0] == 0:
        for row in INITIAL_EQUIPMENT_SEED:
            cur.execute(
                """
                INSERT INTO equipment (
                    id, qr_code, name, category, image_url, description,
                    storage_compartment, total_qty, available_qty, unit,
                    condition, safety_level, prerequisites_json, is_active, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
                """,
                (*row, now_iso),
            )

    cur.execute("SELECT COUNT(*) FROM safety_status")
    if cur.fetchone()[0] == 0:
        cur.execute(
            """
            INSERT INTO safety_status (id, level, headline, message, updated_by, updated_at)
            VALUES (1, 'SAFE', ?, ?, 'Ms. Lara Marie Agustin Puertollano (Research Adviser)', ?)
            """,
            (
                SAFETY_PRESETS["SAFE"]["headline"],
                SAFETY_PRESETS["SAFE"]["message"],
                now_iso,
            ),
        )

    cur.execute("SELECT COUNT(*) FROM student_transactions")
    if cur.fetchone()[0] == 0:
        t1_in = (datetime.now(timezone.utc) - timedelta(hours=1, minutes=15)).isoformat()
        t1_exp = (datetime.now(timezone.utc) + timedelta(hours=1, minutes=45)).isoformat()
        cur.execute(
            """
            INSERT INTO student_transactions (
                id, transaction_code, student_name, student_id_lrn, grade_section,
                school_email, subject_activity, teacher_name, items_json,
                total_items_count, safety_checked_json, time_in, expected_return,
                time_out, return_condition, return_notes, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, '', 'Borrowed / In Lab')
            """,
            (
                101,
                "LG-JRC-101",
                "One Enrique Sebastian G. Abalos",
                "AUJRC-2026-0101",
                "STEM",
                "one.abalos@arellano.edu.ph",
                "General Biology 1 — Microscopy & Cell Structure",
                "Ms. Lara Marie Agustin Puertollano",
                json.dumps([
                    {
                        "equipment_id": 11,
                        "qr_code": "LG-EQ-011",
                        "name": "Compound Light Microscope",
                        "category": "Optical & Microscopy",
                        "image_url": "/images/equipment/LG-EQ-011.svg",
                        "storage_compartment": "3rd - 3rd Section",
                        "quantity": 2,
                        "unit": "unit",
                        "safety_level": "SAFE",
                        "prerequisites": ["Carry microscope with two hands"],
                    }
                ]),
                2,
                json.dumps(["Wearing buttoned laboratory gown & closed-toe shoes"]),
                t1_in,
                t1_exp,
            ),
        )

    conn.commit()
    conn.close()


def make_qr_data_url(url_text: str) -> str:
    if qrcode is not None:
        qr = qrcode.QRCode(version=1, box_size=8, border=2)
        qr.add_data(url_text)
        qr.make(fit=True)
        img = qr.make_image(fill_color="#003087", back_color="#FFFFFF")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        b64 = base64.b64encode(buf.getvalue()).decode("ascii")
        return f"data:image/png;base64,{b64}"
    return ""


# ==============================================================================
# 3 SEPARATE HTML TEMPLATE ROUTES (/kiosk, /student/checkout/<token>, /admin)
# ==============================================================================
@app.route("/")
@app.route("/kiosk")
def kiosk_page():
    """Serves File 1: Student-only Inventory & Basket Kiosk UI (templates/kiosk.html)."""
    return render_template("kiosk.html")


@app.route("/student/checkout/<token>")
def student_form_page(token: str):
    """Serves File 2: QR-Redirected Student Information Form (templates/student_form.html)."""
    return render_template("student_form.html", session_token=token)


@app.route("/admin")
def admin_dashboard_page():
    """Serves File 3: Admin & Lab Personnel Dashboard (templates/admin.html)."""
    return render_template("admin.html")


@app.route("/images/equipment/<path:filename>")
def serve_equipment_image(filename: str):
    return send_from_directory(os.path.join(PUBLIC_DIR, "images", "equipment"), filename)


# ==============================================================================
# REST API ENDPOINTS (SQLite3)
# ==============================================================================
def serialize_equipment(row) -> dict:
    return {
        "id": row["id"],
        "qr_code": row["qr_code"],
        "name": row["name"],
        "category": row["category"],
        "image_url": row["image_url"],
        "description": row["description"],
        "storage_compartment": row["storage_compartment"],
        "total_qty": row["total_qty"],
        "available_qty": row["available_qty"],
        "unit": row["unit"],
        "condition": row["condition"],
        "safety_level": row["safety_level"],
        "prerequisites": json.loads(row["prerequisites_json"] or "[]"),
        "is_active": bool(row["is_active"]),
        "created_at": row["created_at"],
    }


def serialize_transaction(row) -> dict:
    return {
        "id": row["id"],
        "transaction_code": row["transaction_code"],
        "student_name": row["student_name"],
        "student_id_lrn": row["student_id_lrn"],
        "grade_section": row["grade_section"],
        "school_email": row["school_email"],
        "subject_activity": row["subject_activity"],
        "teacher_name": row["teacher_name"],
        "items": json.loads(row["items_json"] or "[]"),
        "total_items_count": row["total_items_count"],
        "safety_prerequisites_checked": json.loads(row["safety_checked_json"] or "[]"),
        "time_in": row["time_in"],
        "expected_return": row["expected_return"],
        "time_out": row["time_out"],
        "return_condition": row["return_condition"],
        "return_notes": row["return_notes"] or "",
        "status": row["status"],
    }


@app.route("/api/state", methods=["GET"])
def api_state():
    conn = get_db()
    eq_rows = conn.execute("SELECT * FROM equipment WHERE is_active = 1 ORDER BY id ASC").fetchall()
    tx_rows = conn.execute("SELECT * FROM student_transactions ORDER BY id DESC").fetchall()
    safety_row = conn.execute("SELECT * FROM safety_status WHERE id = 1").fetchone()
    conn.close()

    return jsonify({
        "equipment": [serialize_equipment(r) for r in eq_rows],
        "transactions": [serialize_transaction(r) for r in tx_rows],
        "safety_status": dict(safety_row) if safety_row else SAFETY_PRESETS["SAFE"],
        "student_presets": STUDENT_PRESETS,
    })


@app.route("/api/kiosk/checkout-session", methods=["POST"])
def api_create_checkout_session():
    data = request.get_json(silent=True) or {}
    raw_items = data.get("basket_items") or []
    if not raw_items:
        return jsonify({"error": "Please pick at least one equipment item into your basket."}), 400

    conn = get_db()
    safety_row = conn.execute("SELECT * FROM safety_status WHERE id = 1").fetchone()
    if safety_row and safety_row["level"] == "UNSAFE":
        conn.close()
        return jsonify({"error": "Laboratory LED Safety Status is RED (UNSAFE). Equipment checkout is paused."}), 403

    validated = []
    for item in raw_items:
        eq = conn.execute(
            "SELECT * FROM equipment WHERE id = ? AND is_active = 1",
            (int(item.get("equipment_id", 0)),),
        ).fetchone()
        if not eq:
            conn.close()
            return jsonify({"error": "Equipment item not found."}), 404
        qty = max(1, int(item.get("quantity", 1)))
        if qty > eq["available_qty"]:
            conn.close()
            return jsonify({"error": f"Insufficient stock for {eq['name']}."}), 400
        validated.append({
            "equipment_id": eq["id"],
            "qr_code": eq["qr_code"],
            "name": eq["name"],
            "category": eq["category"],
            "image_url": eq["image_url"],
            "storage_compartment": eq["storage_compartment"],
            "quantity": qty,
            "unit": eq["unit"],
            "safety_level": eq["safety_level"],
            "prerequisites": json.loads(eq["prerequisites_json"] or "[]"),
        })

    token = "CHK-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=8))
    now = datetime.now(timezone.utc)
    expires = now + timedelta(minutes=15)

    host_url = request.host_url.rstrip("/")
    mobile_url = f"{host_url}/student/checkout/{token}"
    qr_data_url = make_qr_data_url(mobile_url)

    session_obj = {
        "session_token": token,
        "basket_items": validated,
        "qr_data_url": qr_data_url,
        "mobile_url": mobile_url,
        "status": "pending_student_info",
        "created_at": now.isoformat(),
        "expires_at": expires.isoformat(),
    }

    conn.execute(
        """
        INSERT INTO checkout_sessions (
            session_token, basket_json, qr_data_url, mobile_url, status, created_at, expires_at
        ) VALUES (?, ?, ?, ?, 'pending_student_info', ?, ?)
        """,
        (
            token,
            json.dumps(validated),
            qr_data_url,
            mobile_url,
            now.isoformat(),
            expires.isoformat(),
        ),
    )
    conn.commit()
    conn.close()
    return jsonify({"session": session_obj}), 201


@app.route("/api/kiosk/checkout-session/<token>", methods=["GET"])
def api_get_checkout_session(token: str):
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM checkout_sessions WHERE session_token = ?", (token,)
    ).fetchone()
    safety_row = conn.execute("SELECT * FROM safety_status WHERE id = 1").fetchone()
    conn.close()

    if not row:
        return jsonify({"error": "Checkout QR session not found or expired."}), 404

    completed_tx = (
        json.loads(row["completed_transaction_json"])
        if row["completed_transaction_json"]
        else None
    )
    return jsonify({
        "session": {
            "session_token": row["session_token"],
            "basket_items": json.loads(row["basket_json"] or "[]"),
            "qr_data_url": row["qr_data_url"],
            "mobile_url": row["mobile_url"],
            "status": row["status"],
            "created_at": row["created_at"],
            "expires_at": row["expires_at"],
            "completed_transaction": completed_tx,
        },
        "safety_status": dict(safety_row) if safety_row else SAFETY_PRESETS["SAFE"],
        "student_presets": STUDENT_PRESETS,
    })


@app.route("/api/kiosk/checkout-session/<token>/complete", methods=["POST"])
def api_complete_checkout_session(token: str):
    data = request.get_json(silent=True) or {}
    conn = get_db()
    sess_row = conn.execute(
        "SELECT * FROM checkout_sessions WHERE session_token = ?", (token,)
    ).fetchone()

    if sess_row and sess_row["status"] == "completed" and sess_row["completed_transaction_json"]:
        conn.close()
        return jsonify({
            "success": True,
            "transaction": json.loads(sess_row["completed_transaction_json"]),
        })

    basket_items = (
        json.loads(sess_row["basket_json"])
        if sess_row
        else (data.get("basket_items") or [])
    )
    if not basket_items:
        conn.close()
        return jsonify({"error": "No equipment items found in checkout session."}), 400

    student_name = str(data.get("student_name") or "").strip()
    student_id_lrn = str(data.get("student_id_lrn") or "").strip()
    grade_section = str(data.get("grade_section") or "").strip()
    school_email = str(data.get("school_email") or "").strip().lower()
    subject_activity = str(data.get("subject_activity") or "").strip()
    teacher_name = str(data.get("teacher_name") or "").strip()
    expected_hours = float(data.get("expected_return_hours") or 2)
    safety_checked = data.get("safety_prerequisites_checked") or [
        "Wearing buttoned laboratory gown & PPE",
        "Inspected apparatus condition prior to use",
    ]

    if not (student_name and student_id_lrn and grade_section and subject_activity and teacher_name):
        conn.close()
        return jsonify({"error": "Please complete all required student information fields."}), 400

    total_units = 0
    has_caution = False
    for item in basket_items:
        eq = conn.execute(
            "SELECT * FROM equipment WHERE id = ?", (int(item["equipment_id"]),)
        ).fetchone()
        qty = int(item["quantity"])
        if not eq or eq["available_qty"] < qty:
            conn.close()
            return jsonify({"error": f"Insufficient stock for {item['name']}."}), 400
        conn.execute(
            "UPDATE equipment SET available_qty = available_qty - ? WHERE id = ?",
            (qty, eq["id"]),
        )
        total_units += qty
        if eq["safety_level"] == "CAUTION":
            has_caution = True

    max_id_row = conn.execute("SELECT MAX(id) FROM student_transactions").fetchone()
    next_id = max(100, (max_id_row[0] or 100)) + 1
    tx_code = f"LG-JRC-{next_id}"
    now_iso = datetime.now(timezone.utc).isoformat()
    exp_iso = (datetime.now(timezone.utc) + timedelta(hours=max(0.5, expected_hours))).isoformat()

    conn.execute(
        """
        INSERT INTO student_transactions (
            id, transaction_code, student_name, student_id_lrn, grade_section,
            school_email, subject_activity, teacher_name, items_json,
            total_items_count, safety_checked_json, time_in, expected_return,
            time_out, return_condition, return_notes, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, '', 'Borrowed / In Lab')
        """,
        (
            next_id,
            tx_code,
            student_name,
            student_id_lrn,
            grade_section,
            school_email or f"{student_id_lrn.lower()}@arellano.edu.ph",
            subject_activity,
            teacher_name,
            json.dumps(basket_items),
            total_units,
            json.dumps(safety_checked),
            now_iso,
            exp_iso,
        ),
    )

    if has_caution:
        conn.execute(
            """
            UPDATE safety_status
            SET level = 'CAUTION', headline = ?, message = ?, updated_by = 'LabGuard+ Auto Safety Monitor', updated_at = ?
            WHERE id = 1 AND level = 'SAFE'
            """,
            (
                SAFETY_PRESETS["CAUTION"]["headline"],
                f"Active checkout ({tx_code} · {student_name}) includes thermal or glassware apparatus. PPE required.",
                now_iso,
            ),
        )

    tx_row = conn.execute("SELECT * FROM student_transactions WHERE id = ?", (next_id,)).fetchone()
    tx_dict = serialize_transaction(tx_row)

    if sess_row:
        conn.execute(
            "UPDATE checkout_sessions SET status = 'completed', completed_transaction_json = ? WHERE session_token = ?",
            (json.dumps(tx_dict), token),
        )

    conn.commit()
    conn.close()
    return jsonify({"success": True, "transaction": tx_dict}), 201


@app.route("/api/kiosk/return", methods=["POST"])
def api_return_equipment():
    data = request.get_json(silent=True) or {}
    tx_id = int(data.get("transaction_id") or 0)
    condition = data.get("return_condition") or "Good"
    notes = str(data.get("return_notes") or "").strip() or f"Returned in {condition} condition."

    conn = get_db()
    row = conn.execute("SELECT * FROM student_transactions WHERE id = ?", (tx_id,)).fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Transaction record not found."}), 404

    now_iso = datetime.now(timezone.utc).isoformat()
    items = json.loads(row["items_json"] or "[]")
    if condition != "Missing":
        for item in items:
            conn.execute(
                "UPDATE equipment SET available_qty = MIN(total_qty, available_qty + ?) WHERE id = ?",
                (int(item["quantity"]), int(item["equipment_id"])),
            )
            if condition == "Damaged":
                conn.execute(
                    "UPDATE equipment SET condition = 'Damaged' WHERE id = ?",
                    (int(item["equipment_id"]),),
                )

    conn.execute(
        """
        UPDATE student_transactions
        SET time_out = ?, return_condition = ?, return_notes = ?, status = 'Returned / Logged Out'
        WHERE id = ?
        """,
        (now_iso, condition, notes, tx_id),
    )

    if condition in ("Damaged", "Missing"):
        items_summary = ", ".join(f"{it.get('quantity', 1)}x {it.get('name', 'Item')}" for it in items)
        compartments = ", ".join(sorted({it.get("storage_compartment", "") for it in items if it.get("storage_compartment")}))
        msg = (
            f"Damaged apparatus returned ({row['transaction_code']}: {items_summary}). Inspect {compartments or 'compartment'} before next use."
            if condition == "Damaged"
            else f"Missing apparatus reported on return ({row['transaction_code']}: {items_summary}). Lab Coordinator verification required for {compartments or 'compartment'}."
        )
        conn.execute(
            """
            UPDATE safety_status
            SET level = CASE WHEN level = 'UNSAFE' THEN 'UNSAFE' ELSE 'CAUTION' END,
                headline = CASE WHEN level = 'UNSAFE' THEN headline ELSE ? END,
                message = ?,
                updated_by = ?,
                updated_at = ?
            WHERE id = 1
            """,
            (
                SAFETY_PRESETS["CAUTION"]["headline"],
                msg,
                f"LabGuard+ Return Monitor ({condition})",
                now_iso,
            ),
        )

    conn.commit()
    updated = conn.execute("SELECT * FROM student_transactions WHERE id = ?", (tx_id,)).fetchone()
    safety_row = conn.execute("SELECT * FROM safety_status WHERE id = 1").fetchone()
    conn.close()
    return jsonify({
        "success": True,
        "transaction": serialize_transaction(updated),
        "safety_status": dict(safety_row) if safety_row else SAFETY_PRESETS["SAFE"],
    })


@app.route("/api/admin/equipment", methods=["POST"])
def api_add_equipment():
    data = request.get_json(silent=True) or {}
    name = str(data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "Equipment name is required."}), 400

    conn = get_db()
    max_id = conn.execute("SELECT MAX(id) FROM equipment").fetchone()[0] or 0
    next_id = max_id + 1
    qr_code = str(data.get("qr_code") or "").strip().upper() or f"LG-EQ-{next_id:03d}"
    image_url = str(data.get("image_url") or "").strip() or "/images/equipment/LG-EQ-001.svg"
    category = data.get("category") or "Glassware & Measuring"
    compartment = str(data.get("storage_compartment") or "4th - 3rd Section").strip()
    total_qty = max(1, int(data.get("total_qty") or 1))
    unit = str(data.get("unit") or "unit").strip()
    safety_level = "CAUTION" if data.get("safety_level") == "CAUTION" else "SAFE"
    prereqs = data.get("prerequisites") or ["Wear buttoned laboratory gown and follow AU-JRC safety rules"]

    conn.execute(
        """
        INSERT INTO equipment (
            id, qr_code, name, category, image_url, description,
            storage_compartment, total_qty, available_qty, unit,
            condition, safety_level, prerequisites_json, is_active, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Good', ?, ?, 1, ?)
        """,
        (
            next_id,
            qr_code,
            name,
            category,
            image_url,
            f"{name} registered in AU-JRC Science Laboratory.",
            compartment,
            total_qty,
            total_qty,
            unit,
            safety_level,
            json.dumps(prereqs),
            datetime.now(timezone.utc).isoformat(),
        ),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM equipment WHERE id = ?", (next_id,)).fetchone()
    conn.close()
    return jsonify({"equipment": serialize_equipment(row)}), 201


@app.route("/api/admin/equipment/<int:item_id>", methods=["PATCH", "DELETE"])
def api_modify_equipment(item_id: int):
    conn = get_db()
    if request.method == "DELETE":
        conn.execute("DELETE FROM equipment WHERE id = ?", (item_id,))
        conn.commit()
        conn.close()
        return jsonify({"success": True})

    data = request.get_json(silent=True) or {}
    row = conn.execute("SELECT * FROM equipment WHERE id = ?", (item_id,)).fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Equipment not found."}), 404

    if "total_qty" in data:
        next_total = max(1, int(data["total_qty"]))
        borrowed = max(0, row["total_qty"] - row["available_qty"])
        next_avail = max(0, next_total - borrowed)
        conn.execute(
            "UPDATE equipment SET total_qty = ?, available_qty = ? WHERE id = ?",
            (next_total, next_avail, item_id),
        )
    conn.commit()
    updated = conn.execute("SELECT * FROM equipment WHERE id = ?", (item_id,)).fetchone()
    conn.close()
    return jsonify({"equipment": serialize_equipment(updated)})


@app.route("/api/admin/safety-status", methods=["POST"])
def api_update_safety_status():
    data = request.get_json(silent=True) or {}
    level = data.get("level") if data.get("level") in ("SAFE", "CAUTION", "UNSAFE") else "SAFE"
    preset = SAFETY_PRESETS[level]
    message = str(data.get("message") or "").strip() or preset["message"]
    updated_by = str(data.get("updated_by") or "").strip() or "AU-JRC Laboratory Personnel"
    now_iso = datetime.now(timezone.utc).isoformat()

    conn = get_db()
    conn.execute(
        """
        UPDATE safety_status
        SET level = ?, headline = ?, message = ?, updated_by = ?, updated_at = ?
        WHERE id = 1
        """,
        (level, preset["headline"], message, updated_by, now_iso),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM safety_status WHERE id = 1").fetchone()
    conn.close()
    return jsonify({"safety_status": dict(row)})


@app.route("/api/reset", methods=["POST"])
def api_reset():
    init_db(force_reset=True)
    return jsonify({"success": True})


if __name__ == "__main__":
    init_db()
    port = int(os.environ.get("FLASK_PORT", 5000))
    print(f"LabGuard+ Python Flask Server running on http://0.0.0.0:{port}")
    print(f"  -> Student Kiosk UI:    http://localhost:{port}/kiosk")
    print(f"  -> Admin Dashboard UI:  http://localhost:{port}/admin")
    app.run(host="0.0.0.0", port=port, debug=False)
