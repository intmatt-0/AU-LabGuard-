#!/usr/bin/env bash
# ==============================================================================
# Arellano University Asset & Inventory Kiosk - Local PC Launcher (macOS / Linux)
# ==============================================================================

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=========================================================="
echo "  Arellano University QR Inventory Kiosk - Local PC Runner"
echo "  Pamantasang Arellano - Property & Laboratory Management"
echo "=========================================================="

# Check Python 3
if ! command -v python3 &> /dev/null; then
    echo "[!] Error: python3 is not installed on this system."
    echo "    Please install Python 3.8+ from https://www.python.org"
    exit 1
fi

PY_VER=$(python3 --version)
echo "[+] Detected: $PY_VER"

# Initialize SQLite database and start server
echo "[+] Starting local Python server on http://localhost:5000..."
python3 -c "import sys; sys.path.insert(0, '$DIR'); from server_python import app; app.init_db()"

# Launch browser after a short delay
(
  sleep 1.5
  if command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:5000"
  elif command -v open &> /dev/null; then
    open "http://localhost:5000"
  fi
) &

python3 server_python/app.py 5000
