# LabGuard+ Minimalist UI Polish & Checkout Usage Guide Plan

Based on your teammate's feedback screenshots, we will streamline the **7" Raspberry Pi Touchscreen LCD (`kiosk.html`)** and **Checkout flow** so it looks sleek, minimal, and free of redundant UI elements.

---

## 1. Remove the Green Status Banner Strip (`#led-banner`)
- **Why**: The prototype cabinet already displays the safety status via the left and right hexagonal LED strips, making the bright green horizontal banner under the header redundant and visually cluttered.
- **Change**: Remove the green banner bar from below the top header in `kiosk.html`. Only show a clean lockout notice if the Admin sets the laboratory to `RED (UNSAFE)`.

---

## 2. Fix Duplicate Basket UI (Single Clean Basket Trigger)
- **Why**: Having both the top-right `Basket` button and the floating bottom-right `Equipment Basket` bar duplicates the basket and covers the bottom-right apparatus card.
- **Change**:
  - Remove the bottom floating bar that overlaps the equipment cards.
  - Keep a single, prominent **`Basket (N) · Checkout →`** button in the top bar that opens the **Collapsible / Maximizable Basket Popup Window** on demand.

---

## 3. Declutter Unnecessary Labels for a Sleek, Minimal Look
- **Header & Simulator Frame**:
  - Remove the technical bezel caption bar (`EMBEDDED 7" RASPBERRY PI TOUCHSCREEN LCD...`) and extra deck text (`12 IN DECK`, `7" RPi LCD · Tap & Select`, `800×480 Touch LCD`).
  - Simplify the top header to just the **AU Badge + `LabGuard+`** and clean **`Borrow`**, **`Return`**, and **`Home`** buttons.
- **Welcome Screen**:
  - Remove redundant micro-labels (`SMART SCIENCE LABORATORY SAFETY STATION`, `OPTION 01 · TAP & SELECT APPARATUS`, `OPTION 02 · TAP RECORD TO CHECK IN`) so the two main **Borrow Equipment** and **Return Equipment** touch cards look clean and modern.
- **Equipment Cards**:
  - Remove internal serial/QR codes (`LG-EQ-001`) and redundant tags from the card face—show only the **Apparatus Image**, **Availability Badge (`6/8`)**, **Apparatus Name**, **Compartment Location (`Comp A1`)**, and the **`+ Add to Basket`** button.

---

## 4. Add "How to Use" Material Guide at Checkout
- **Why**: When checking out borrowed apparatus, students should see a clear, concise guide on how to properly use and handle each item in their basket.
- **Change**:
  - In the **Checkout Basket Popup** and **QR Checkout Modal / Mobile Student Form (`student_form.html`)**, display each borrowed item's **"How to Use & Handle"** instructions (e.g., proper operation steps and handling reminders for the Microscope, Bunsen Burner, Analytical Balance, Volumetric Burette, pH Meter, etc.).
