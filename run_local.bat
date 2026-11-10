@echo off
REM ==============================================================================
REM Arellano University Asset & Inventory Kiosk - Windows PC Launcher
REM ==============================================================================

echo ==========================================================
echo   Arellano University QR Inventory Kiosk - Windows PC
echo   Pamantasang Arellano - Property & Laboratory Management
echo ==========================================================

where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [!] Python is not found in your PATH.
    echo     Please install Python 3.8+ from https://www.python.org
    echo     Make sure to check "Add Python to PATH" during installation.
    pause
    exit /b 1
)

echo [+] Starting Python REST server on http://localhost:5000...
start "" http://localhost:5000
python server_python\app.py 5000

pause
