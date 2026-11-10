#!/usr/bin/env bash
# ==============================================================================
# Arellano University - Raspberry Pi Kiosk Auto-Installer
# Tested on Raspberry Pi OS (Bullseye / Bookworm - 32-bit & 64-bit)
# Compatible with Raspberry Pi 3B+, 4B, 5, and Official 7" / 10" Touchscreens
# ==============================================================================

set -e

if [ "$EUID" -ne 0 ]; then
  echo "[!] Please run as root: sudo bash setup_raspberry_pi.sh"
  exit 1
fi

USER_HOME=$(eval echo ~${SUDO_USER})
APP_DIR="/opt/au-inventory-kiosk"

echo "=========================================================="
echo "  Setting up Arellano University Inventory Kiosk on Pi..."
echo "=========================================================="

# 1. Update and install Chromium and unclutter (hides cursor on touchscreens)
echo "[1/5] Installing Kiosk dependencies..."
apt-get update -y
apt-get install -y python3 python3-pip chromium-browser unclutter xdotool x11-xserver-utils

# 2. Copy application to /opt/au-inventory-kiosk
echo "[2/5] Deploying app files to $APP_DIR..."
mkdir -p "$APP_DIR"
cp -r . "$APP_DIR"
chown -R ${SUDO_USER}:${SUDO_USER} "$APP_DIR"

# 3. Create Systemd Service for Python Server
echo "[3/5] Creating background Python service (au-inventory.service)..."
cat <<EOF > /etc/systemd/system/au-inventory.service
[Unit]
Description=Arellano University Asset & Inventory Kiosk Server
After=network.target

[Service]
Type=simple
User=${SUDO_USER}
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/python3 $APP_DIR/server_python/app.py 5000
Restart=always
RestartSec=3
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable au-inventory.service
systemctl restart au-inventory.service

# 4. Create Chromium Kiosk Autostart Script
echo "[4/5] Creating Kiosk autostart profile..."
mkdir -p "$USER_HOME/.config/autostart"

cat <<EOF > "$USER_HOME/kiosk_startup.sh"
#!/usr/bin/env bash
# Prevent screen from sleeping / turning off
xset s off
xset -dpms
xset s noblank

# Hide mouse cursor after 0.5s idle (ideal for touchscreens)
unclutter -idle 0.5 -root &

# Wait for Python web server to respond
until curl -s http://localhost:5000/api/health > /dev/null; do
  sleep 1
done

# Launch Chromium in Fullscreen Kiosk Mode
sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' ~/.config/chromium/Default/Preferences || true
sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/' ~/.config/chromium/Default/Preferences || true

chromium-browser \\
  --noerrdialogs \\
  --disable-infobars \\
  --kiosk \\
  --check-for-update-interval=31536000 \\
  --disable-pinch \\
  --overscroll-history-navigation=0 \\
  --password-store=basic \\
  http://localhost:5000
EOF

chmod +x "$USER_HOME/kiosk_startup.sh"
chown ${SUDO_USER}:${SUDO_USER} "$USER_HOME/kiosk_startup.sh"

cat <<EOF > "$USER_HOME/.config/autostart/kiosk.desktop"
[Desktop Entry]
Type=Application
Name=AU Kiosk
Exec=$USER_HOME/kiosk_startup.sh
X-GNOME-Autostart-enabled=true
EOF

chown -R ${SUDO_USER}:${SUDO_USER} "$USER_HOME/.config/autostart"

# 5. Summary & USB Scanner details
echo "=========================================================="
echo "  ARELLANO UNIVERSITY KIOSK SETUP COMPLETE!"
echo "=========================================================="
echo "  1. Backend server: active on http://localhost:5000"
echo "  2. Touchscreen Kiosk: will autostart on Pi reboot"
echo "  3. Hardware QR/Barcode Scanners: Plug into any USB port."
echo "     (Most USB 2D scanners act as keyboard input automatically!)"
echo "  To reboot now: sudo reboot"
echo "=========================================================="
