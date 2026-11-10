# Arellano University - QR Asset & Inventory Kiosk

### Official Property & Laboratory Equipment Management System
Designed for **Arellano University (Pamantasang Arellano)** campuses:
- Juan Sumulong Campus (Legarda, Manila)
- Andres Bonifacio Campus (Pasig City)
- Jose Abad Santos Campus (Pasay City)
- Plaridel Campus (Mandaluyong City)
- Elisa Esguerra Campus (Malabon City)

---

## 1. Running on Your Computer (Local PC / Mac)

Before setting up the Raspberry Pi, you can run the entire system on your personal computer:

### On Windows:
1. Ensure Python 3.8+ is installed (`python --version`).
2. Double-click `run_local.bat` or run in Command Prompt / PowerShell:
   ```cmd
   python server_python\app.py 5000
   ```
3. Open your browser to:
   ```
   http://localhost:5000
   ```

### On macOS / Linux:
1. Open Terminal in this project directory:
   ```bash
   chmod +x run_local.sh
   ./run_local.sh
   ```
2. The server starts on port `5000` and automatically opens your browser!

> **Note on Dependencies:** `server_python/app.py` is written using **pure Python 3 standard library** (`http.server` + `sqlite3` + `json`). You do NOT need to install any external pip packages! It runs completely offline with zero installation issues.

---

## 2. Deploying to Raspberry Pi Kiosk

### Hardware Checklist:
1. **Raspberry Pi**: Pi 4 Model B (2GB/4GB/8GB) or Pi 5 running **Raspberry Pi OS with Desktop**.
2. **Display**: Official Raspberry Pi 7" DSI Touchscreen or any HDMI touch monitor (1024x600 or 1920x1080).
3. **Scanner**: Any standard USB 2D QR Barcode Scanner gun (e.g. Zebra DS2208, Eyoyo, Netum, Honeywell) or the Raspberry Pi Camera Module.
4. **Power**: Official 15W/27W USB-C Power Supply.

### 1-Step Installation:
1. Copy or clone this folder to your Raspberry Pi.
2. Run the auto-installer script:
   ```bash
   sudo bash setup_raspberry_pi.sh
   ```
3. Reboot your Raspberry Pi:
   ```bash
   sudo reboot
   ```

### What `setup_raspberry_pi.sh` Does Automatically:
- Installs `chromium-browser`, `unclutter` (auto-hides the mouse pointer on touchscreens), and `xdotool`.
- Sets up `au-inventory.service` via `systemd` so the Python server starts automatically on boot.
- Creates an autostart profile that opens Chromium in fullscreen **--kiosk** mode pointing to `http://localhost:5000`.
- Disables screen sleep and energy saver so the kiosk stays awake during university laboratory hours.

---

## 3. Features Overview

- **Every Item Bound with QR**: Unique payload encoding Asset ID, Serial Number, Department, and cryptographic validation hash.
- **Role Permissions**:
  - **Admin (Lab Custodian / Property Officer)**: Full asset creation, editing, retirement, physical audit verification, and bulk QR label printing.
  - **User (Students / Faculty)**: Self-service check-out, return, and availability lookup.
- **Hardware USB Scanner Listener**: Works out-of-the-box with standard USB barcode scanners (which emulate rapid keyboard strokes followed by Enter).
- **Webcam / Touchscreen Scanner**: Live camera viewfinder using `jsQR` with audio beep feedback.
- **Printable University Sticker Sheets**: Formatted with Arellano University royal blue headers, gold accents, property warning, and high-contrast scannables.
- **Audit Logs**: Immutable activity record with CSV export.
