"""
LabGuard Smart Locker System — Raspberry Pi 3 GPIO Relay Controller
Arellano University Malabon (Elisa Esguerra Campus)

Matches Section 9.1 & 9.3 of the LabGuard System Specification:
  - Lockers 1..10 mapped to BCM GPIO pins 17, 27, 22, 5, 6, 13, 19, 26, 12, 16
  - Status LED (Green - Ready): GPIO 24
  - Status LED (Red - Fault):   GPIO 25
  - Buzzer:                     GPIO 23
"""

import asyncio
import logging

logger = logging.getLogger("labguard.gpio")

try:
    from gpiozero import OutputDevice
    HAS_GPIO = True
except ImportError:
    HAS_GPIO = False
    OutputDevice = None

LOCKER_PINS = {
    1: 17,
    2: 27,
    3: 22,
    4: 5,
    5: 6,
    6: 13,
    7: 19,
    8: 26,
    9: 12,
    10: 16,
}

GREEN_LED_PIN = 24
RED_LED_PIN = 25
BUZZER_PIN = 23


async def unlock_locker(locker_number: int, duration_seconds: int = 10) -> dict:
    """
    Activate relay for locker_number, hold for duration_seconds, then auto-relock.
    Uses gpiozero on Raspberry Pi 3, or logs simulated GPIO transitions on local PC.
    """
    pin = LOCKER_PINS.get(locker_number, 17)

    if HAS_GPIO and OutputDevice is not None:
        relay = OutputDevice(pin, active_high=False)  # active_low for standard opto-isolated relay boards
        buzzer = OutputDevice(BUZZER_PIN, active_high=True)
        relay.on()
        buzzer.on()
        await asyncio.sleep(0.35)
        buzzer.off()
        await asyncio.sleep(max(0.1, duration_seconds - 0.35))
        relay.off()
    else:
        logger.info(
            f"[SIMULATED GPIO] BCM Pin {pin} HIGH -> Locker #{locker_number} UNLOCKED for {duration_seconds}s"
        )
        await asyncio.sleep(0.1)

    return {
        "locker": locker_number,
        "gpio_pin": pin,
        "duration_seconds": duration_seconds,
        "hardware_mode": "raspberry_pi_gpiozero" if HAS_GPIO else "pc_simulation",
    }
