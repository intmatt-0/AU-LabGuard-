# LabGuard+ Web Application — Complete Engineering Specification & Developer Blueprint

**Institution:** Arellano University – Jose Rizal Campus (SHS & General Science Laboratory)  
**System Name:** **LabGuard+** — Smart Science Laboratory Safety Station & QR Equipment Kiosk  
**Architecture Focus:** Standalone HTML5 / Tailwind CSS / Vanilla JS Interfaces + Express.js & WebSocket (`ws`) Server  

---

## 1. Executive Summary & What the App Does

**LabGuard+** is a multi-surface laboratory equipment borrowing, accountability logging, and safety-monitoring web application designed for school science laboratories. Instead of forcing students to type personal details on a small shared touchscreen kiosk, LabGuard+ decouples the workflow across **three specialized, real-time synchronized web interfaces**:

1. **Touchscreen Kiosk (`templates/kiosk.html`)**: Mounted on a **7-inch Raspberry Pi LCD (`800 × 480`)** or desktop monitor at the laboratory counter. Students tap to begin, choose **Borrow** or **Return**, browse apparatus by category or search via an **on-screen virtual QWERTY keyboard**, build an equipment basket, and generate a **Checkout QR Code**. For returns, active records display **GCash-style privacy-masked student names and IDs** with a **press-and-hold Eye toggle** to reveal identity.
2. **Mobile Student Form (`templates/student_form.html`)**: Opened on the student's smartphone when they scan the kiosk's Checkout QR Code (or via direct link). Displays their scanned apparatus basket with **How-to-Use** safety instructions, offers **one-tap Returning Borrower auto-fill** + **LRN lookup**, lets users choose their **Strand/Faculty** (`STEM`, `HUMSS`, `ABM`, `FACULTY`) and **custom return date & time** (supporting same-day, overnight, or multi-day capstone loans), logs the transaction, and shows an animated **Digital Pass Receipt**.
3. **PC Admin Console (`templates/admin.html`)**: Used by Laboratory Personnel / Science Teachers on a desktop workstation. Provides credential-gated access to **KPI metrics**, **searchable Student Borrow Logs**, **Quick Check-In**, **Kiosk Inventory CRUD** (including custom PC image uploads and built-in SVG apparatus icons), **Station LED Safety Status controls** (`GREEN · SAFE`, `YELLOW · CAUTION`, `RED · UNSAFE`), and **formatted Excel-ready CSV report exports**.

All three interfaces stay synchronized in real time via **REST APIs** and **WebSockets** (`/ws/kiosk` and `/ws/checkout/:token`).

---

## 2. Tech Stack

| Layer | Technology / Library | Version / Role |
| :--- | :--- | :--- |
| **Runtime** | Node.js + TypeScript (`tsx`) | Runs `server.ts` directly in dev (`npm run dev`) and Node in production (`PORT=3000`). |
| **Web Server & Routing** | Express (`express` `^4.21.2`) | Serves the 3 standalone HTML templates, static SVG equipment icons, and JSON REST APIs. |
| **Real-Time Sync** | WebSockets (`ws` `^8.22.2`) | HTTP `upgrade` handler routing `/ws/kiosk`, `/ws/hardware`, and `/ws/checkout/:token`. |
| **QR Code Generation** | `qrcode` (`^1.5.4`) | Generates Base64 PNG Data URLs (`#003087` dark modules on white) bound to `/student/checkout/:token`. |
| **UI Styling (Templates)** | Tailwind CSS Play CDN (`https://cdn.tailwindcss.com`) | Utility-first styling in standalone HTML files with zero client build dependency. |
| **Typography** | Google Fonts | `Plus Jakarta Sans` (Headings), `DM Sans` (Body/UI), `JetBrains Mono` (Codes, Quantities, Timers). |
| **Client State & Persistence** | Vanilla ES6+ JavaScript + `sessionStorage` + Express In-Memory Store | Authoritative server memory seeded from `src/data/seedData.ts` + static SVGs auto-written to `public/images/equipment/`. |
| **Asset Dev Middleware** | Vite (`vite` `^8.3.0`) | Mounted as middleware in non-production mode (`server.ts`) to serve static assets such as `/images/au_seal.jpg`. |

### Project File Layout (HTML + Express Architecture)

```text
/
├── server.ts                        # Express HTTP server, REST APIs, WebSocket server, SVG generator
├── src/
│   ├── types.ts                     # Shared TypeScript interfaces & enums
│   └── data/
│       ├── seedData.ts              # 11 seeded equipment items, 6 student presets, 4 sample logs, safety presets
│       └── equipmentImages.ts       # Vector SVG markup dictionary (LG-EQ-001 .. LG-EQ-011)
├── public/
│   └── images/
│       ├── au_seal.jpg              # Official Arellano University seal logo
│       └── equipment/               # Auto-generated LG-EQ-001.svg .. LG-EQ-011.svg
└── templates/
    ├── kiosk.html                   # Surface 1: 7" LCD Touchscreen Kiosk UI
    ├── student_form.html            # Surface 2: Mobile QR Checkout Form & Receipt
    └── admin.html                   # Surface 3: PC Desktop Admin Console
```

---

## 3. System Architecture & End-to-End Data Flow

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              EXPRESS + WEBSOCKET SERVER (server.ts)                    │
│  Port 3000 · Authoritative In-Memory State (equipmentList, transactionLogs,            │
│  safetyStatus, checkoutSessions Map) · SVG Generator (/images/equipment/:filename)     │
└───────┬──────────────────────────┬─────────────────────────────┬───────────────────────┘
        │ GET /, /kiosk            │ GET /student/checkout/:tok  │ GET /admin
        │ WS  /ws/kiosk            │ POST .../complete           │ WS  /ws/kiosk
        ▼                          ▼                             ▼
┌───────────────────┐     ┌─────────────────────┐      ┌─────────────────────────────────┐
│   KIOSK SCREEN    │     │  MOBILE PHONE VIEW  │      │     PC ADMIN WORKSTATION        │
│  (kiosk.html)     │     │ (student_form.html) │      │        (admin.html)             │
│                   │     │                     │      │                                 │
│ 1. Attract Screen │     │ 1. Basket + Usage   │      │ 1. Login Gate (@arellano.edu.ph)│
│ 2. Welcome Cards  │     │ 2. Preset Auto-Fill │      │ 2. 4 KPI Cards (incl. LED)      │
│ 3. Borrow Grid +  │     │ 3. Strand / Faculty │      │ 3. Student Logs + CSV Export    │
│    Touch Keyboard │     │ 4. Custom Due Date  │      │ 4. Equipment Add/Stock/Delete   │
│ 4. QR Modal ──────┼─QR─▶│ 5. Submit Log-In    │      │ 5. LED Safety Controller        │
│ 5. Masked Return  │     │ 6. Checkmark Pass   │      │    (SAFE / CAUTION / UNSAFE)    │
└─────────▲─────────┘     └──────────┬──────────┘      └────────────────▲────────────────┘
          │                          │                                  │
          │        POST /complete ───┴──▶ Broadcasts `checkout_completed` & `data_updated`
          └────────── WS Sync ◀───────────▶ Broadcasts `safety_status` on Damaged/Missing Return
```

### Core End-to-End Lifecycle
1. **Checkout Flow**: Student selects apparatus at `kiosk.html` → `POST /api/kiosk/checkout-session` creates token `CHK-XXXXXXXX` + QR Data URL → Student scans QR on phone to open `/student/checkout/CHK-XXXXXXXX` → `student_form.html` fetches session via `GET /api/kiosk/checkout-session/:token` → Student submits form to `POST /api/kiosk/checkout-session/:token/complete` → Server deducts stock, logs `LG-JRC-XXX`, upgrades `SAFE` to `CAUTION` if any borrowed item has `safety_level === 'CAUTION'`, and broadcasts updates over WebSockets.
2. **Return Flow**: Student switches to Return on `kiosk.html` → Holds eye icon to verify masked name → Opens Return Modal and chooses `Good`, `Damaged`, or `Missing` → `POST /api/kiosk/return` marks transaction `Returned / Logged Out`.
   - **`Good`**: Restores `available_qty` (capped at `total_qty`).
   - **`Damaged`**: Restores `available_qty`, sets `eq.condition = 'Damaged'`, and switches Station LED Safety Status to **`CAUTION` (Yellow)** (unless already `UNSAFE`).
   - **`Missing`**: Keeps missing units deducted from `available_qty` and switches Station LED Safety Status to **`CAUTION` (Yellow)** (unless already `UNSAFE`).

---

## 4. UI/UX Design System & Motion Specification

### 4.1 Color Palette Tokens
| Token / Purpose | Hex / Class | Usage |
| :--- | :--- | :--- |
| **AU Royal Blue (Primary)** | `#003087` (Hover `#002466`) | Headers, primary buttons, active tabs, selected basket borders, QR code dark modules. |
| **AU Crimson (Action Accent)** | `#C8102E` (Hover `#a50d25`) | Primary checkout CTA, form submit button, overdue alerts, destructive actions, Missing condition button. |
| **AU Gold (Highlight)** | `#F5A623` | Basket badge pill, active kiosk mode highlight, route helper accent, seal halo glow. |
| **Surface Light** | `#F8FAFC` / `#FFFFFF` | Main viewport background and clean `1px` bordered cards (`border-slate-200`). |
| **Admin Dark Sidebar** | `#0F172A` | Login backdrop (`admin.html`), dark navigation sidebar, 7" LCD simulator chassis. |
| **LED Green (SAFE)** | `#16A34A` / `emerald-500` | Normal laboratory status, Return cards/buttons, confirmation receipt checkmarks. |
| **LED Yellow (CAUTION)** | `#D97706` / `amber-500` | PPE/thermal advisory, Damaged return alert, Missing/Damaged LED escalation. |
| **LED Red (UNSAFE)** | `#DC2626` / `red-600` | Lockout status pausing new checkouts in `borrow` mode while permitting returns. |

### 4.2 Typography Rules
- **Headings (`.font-heading`)**: `'Plus Jakarta Sans', system-ui, sans-serif` (weights 600–800).
- **Body & Touch Labels**: `'DM Sans', system-ui, sans-serif` (weights 400–700); `user-select: none` and `-webkit-tap-highlight-color: transparent` on kiosk touch targets.
- **Monospace Data (`.font-mono`)**: `'JetBrains Mono', monospace` with `font-variant-numeric: tabular-nums` for QR IDs (`LG-EQ-001`), transaction codes (`LG-JRC-101`), compartment slots, idle countdowns, and stock fractions (`10/12`).

### 4.3 Motion & Keyframe Animations
| Animation Class | Surface | Purpose & Timing |
| :--- | :--- | :--- |
| `.animate-seal-halo` | `kiosk.html` (Screen 0) | `3.2s infinite` gold/blue pulsing box-shadow halo and `-3px` vertical float on the AU Seal. |
| `.animate-breathe` | `kiosk.html` (Screen 0) | `2.4s infinite` gentle scale (`1` → `1.03`) on the `"TOUCH SCREEN TO BEGIN"` pill. |
| `.screen-enter` | `kiosk.html` (Screens 0/1/2) | `0.3s cubic-bezier(0.16, 1, 0.3, 1)` slide-up fade (`translateY(8px)` → `0`) forced on screen transitions. |
| `.animate-modal-pop` | `kiosk.html` (Modals 1 & 2) | `0.32s` spring scale (`0.92` → `1.02` → `1`) for Checkout QR and Return Confirmation modals. |
| `.animate-basket-bump` & `.animate-float-add` | `kiosk.html` (Basket) | `0.42s` wobble bump on the basket count pill + floating `+1 Added` badge (`0.75s` rise & fade) on increment. |
| `.animate-check-pop` | `kiosk.html` | `0.5s` rotated spring pop for confirmation icons. |
| `.animate-receipt-pop` | `student_form.html` | `0.45s` slide-up scale entrance for the completed Digital Pass card. |
| `.check-ring-pulse`, `.check-circle-pop`, `.check-svg-path`, `.check-sparkle-1/2/3` | `student_form.html` | Multi-stage celebratory checkout confirmation: radiating emerald rings (`2s` loop), spring circle (`0.65s`), self-drawing SVG `stroke-dashoffset: 48 -> 0` (`0.6s`, `0.28s` delay), and staggered corner sparkles (`✦`/`★`). |

### 4.4 Responsive Viewport Adaptation
- **7-Inch Raspberry Pi LCD Mode (`.rpi-lcd-active`)**: Triggered manually via `#sim-toggle-checkbox` (`800px × 480px` framed bezel) or automatically when `window.innerWidth <= 900 || window.innerHeight <= 560`. Compresses padding, turns equipment grid into a strict 3-column layout (`grid-template-columns: repeat(3, minmax(0, 1fr))`), shrinks card images to `5.2rem`, and locks Welcome cards side-by-side (`min-height: 235px`).
- **Mobile Phone Frame (`student_form.html`)**: Full-bleed viewport below `640px`; wrapped inside a `420px × 820px` rounded smartphone bezel (`rounded-[44px] border-[10px] border-slate-800`) with simulated `9:41` status bar and bottom home bar on desktop previews.

---

## 5. Data Models & Initial Seed Catalog

### 5.1 Core TypeScript Interfaces (`src/types.ts`)
```ts
export type EquipmentCategory =
  | 'Optical & Microscopy'
  | 'Glassware & Measuring'
  | 'Heating & Thermal'
  | 'Balances & Analytical'
  | 'Safety & PPE';

export type SafetyStatusLevel = 'SAFE' | 'CAUTION' | 'UNSAFE';
export type EquipmentCondition = 'Good' | 'Fair' | 'Damaged';
export type TransactionStatus = 'Borrowed / In Lab' | 'Returned / Logged Out' | 'Overdue';

export interface Equipment {
  id: number;
  qr_code: string;               // e.g., "LG-EQ-001"
  name: string;
  category: EquipmentCategory;
  image_url?: string;            // Defaults to "/images/equipment/{qr_code}.svg"
  description: string;
  storage_compartment: string;   // e.g., "1st - 1st Section"
  total_qty: number;
  available_qty: number;
  unit: string;                  // "pc" | "set" | "unit" | "kit"
  condition: EquipmentCondition;
  safety_level: 'SAFE' | 'CAUTION';
  prerequisites: string[];
  is_active: boolean;
  created_at: string;
}

export interface BasketItem {
  equipment_id: number;
  qr_code: string;
  name: string;
  category: EquipmentCategory;
  image_url?: string;
  storage_compartment: string;
  quantity: number;
  unit: string;
  safety_level: 'SAFE' | 'CAUTION';
  prerequisites: string[];
}

export interface CheckoutSession {
  session_token: string;         // Format: "CHK-XXXXXXXX"
  basket_items: BasketItem[];
  qr_data_url?: string;          // Base64 PNG Data URL
  mobile_url?: string;           // "{origin}/student/checkout/{token}"
  status: 'pending_student_info' | 'completed' | 'expired';
  created_at: string;
  expires_at: string;            // created_at + 15 minutes
  completed_transaction?: StudentTransactionLog;
}

export interface StudentTransactionLog {
  id: number;
  transaction_code: string;      // Format: "LG-JRC-{id}"
  student_name: string;
  student_id_lrn: string;
  grade_section: string;         // "STEM" | "HUMSS" | "ABM" | "FACULTY"
  school_email: string;
  subject_activity: string;
  teacher_name: string;
  items: BasketItem[];
  total_items_count: number;
  safety_prerequisites_checked: string[];
  time_in: string;               // ISO 8601
  expected_return: string;       // ISO 8601 (calculated from expected_return_hours)
  time_out: string | null;
  return_condition: 'Good' | 'Damaged' | 'Missing' | null;
  return_notes: string;
  status: TransactionStatus;
}

export interface SafetyStatusState {
  level: SafetyStatusLevel;
  headline: string;
  message: string;
  updated_by: string;
  updated_at: string;
}

export interface LabStudentPreset {
  id: number;
  student_name: string;
  student_id_lrn: string;
  grade_section: string;
  school_email: string;
  default_subject: string;
  default_teacher: string;
}
```

### 5.2 Seeded Locker Inventory (11 Items & Section Locations)
| QR Code | Apparatus Name | Locker Location | Category | Stock (Avail/Total) | Unit | Safety Level |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: |
| `LG-EQ-001` | Beaker | `1st - 1st Section` | Glassware & Measuring | 10 / 12 | `pc` | `SAFE` |
| `LG-EQ-002` | Graduated Cylinder | `2nd - 1st Section` | Glassware & Measuring | 9 / 10 | `pc` | `SAFE` |
| `LG-EQ-003` | Florence Flask | `3rd - 1st Section` | Glassware & Measuring | 8 / 8 | `pc` | `CAUTION` |
| `LG-EQ-004` | Glass Funnel | `4th - 1st Section` | Glassware & Measuring | 10 / 10 | `pc` | `SAFE` |
| `LG-EQ-005` | Erlenmeyer Flask | `1st - 2nd Section` | Glassware & Measuring | 10 / 12 | `pc` | `SAFE` |
| `LG-EQ-006` | Test Tube, Holder & Rack Set | `2nd - 2nd Section` | Glassware & Measuring | 8 / 8 | `set` | `SAFE` |
| `LG-EQ-007` | Tripod Stand | `3rd - 2nd Section` | Heating & Thermal | 7 / 8 | `unit` | `CAUTION` |
| `LG-EQ-008` | Bell Jar | `4th - 2nd Section` | Glassware & Measuring | 4 / 4 | `unit` | `SAFE` |
| `LG-EQ-009` | Laboratory Gown | `1st - 3rd Section` | Safety & PPE | 13 / 15 | `pc` | `SAFE` |
| `LG-EQ-010` | Stirring Rod & PPE Kit (Glasses, Facemask, Gloves) | `2nd - 3rd Section` | Safety & PPE | 14 / 15 | `kit` | `SAFE` |
| `LG-EQ-011` | Compound Light Microscope | `3rd - 3rd Section` | Optical & Microscopy | 6 / 8 | `unit` | `SAFE` |

---

## 6. Screen-by-Screen Functional & Layout Specifications

### 6.1 Interface 1: Touchscreen Kiosk (`templates/kiosk.html`)
**Routes:** `/`, `/kiosk`, `/kiosk.html`

#### Parts & Sections
1. **Prototype Simulator Toolbar (`#simulator-toolbar`)**:
   - **7" LCD Toggle (`#sim-toggle-checkbox`)**: Switches `#kiosk-lcd-viewport` between full-window responsive view and an `800 × 480` framed Raspberry Pi LCD simulator.
   - **Idle Countdown Badge (`#idle-timer-badge`)**: Displays remaining seconds before automatic reset (`45s`). Resets on `pointerdown`, `touchstart`, `click`, `keydown`, and `mousemove` whenever the user is past Screen 0. Reaching `0s` invokes `goToAttractScreen()`, clearing open modals, keyboard drawer, basket popup, and search query.
2. **Screen 0 — Attract / Start Screen (`#attract-screen`)**:
   - Full-viewport navy radial gradient (`#001D53` → `#003087` → `#0A255C`) with subtle blur orbs.
   - Displays official Arellano University seal (`/images/au_seal.jpg`) with `.animate-seal-halo`, campus header, `LabGuard+` title, subtitle `"Smart Science Laboratory Safety Station"`, and breathing `"TOUCH SCREEN TO BEGIN →"` pill. Tapping anywhere triggers `goToWelcomeScreen()`.
3. **Top Navigation & Safety Bar (`#kiosk-top-bar`, hidden on Screen 0)**:
   - Left: Brand button (AU Seal + `LabGuard+` title) that returns to Screen 0.
   - Center: **Live LED Safety Status Pill (`#kiosk-led-pill`)** showing dot + status (`LED GREEN · SAFE`, `LED YELLOW · CAUTION`, `LED RED · UNSAFE`).
   - Right (`#top-mode-bar`, visible in Screen 2): `Borrow`, `Return (count)` pill (`#top-return-count`), and `Exit` button.
4. **Screen 1 — Welcome Guard Screen (`#welcome-screen`)**:
   - Two large touch cards side by side:
     - **Borrow Equipment**: Opens Flow A (`borrow`).
     - **Return Equipment**: Shows live active loan count (`#welcome-return-count`) and opens Flow B (`return`).
5. **Screen 2 — Flow A: Borrow Equipment (`#borrow-section`)**:
   - **Safety Status Banner (`#safety-status-banner`)**: Hidden when `SAFE`; displays amber banner when `CAUTION` and red lockout banner when `UNSAFE` (also disables `+ Add to Basket` buttons and card image tap-to-add when `UNSAFE`).
   - **Top Action Toolbar**:
     - `☰ Categories` button toggles `#collapsible-category-sidebar` (`All Apparatus`, `Glassware`, `Heating`, `Microscopy`, `Safety & PPE`).
     - `🔍 Search items...` button opens the **On-Screen Virtual Touch Keyboard Drawer (`#virtual-keyboard-drawer`)**.
     - Active Category heading.
     - **Single Basket Trigger (`#single-basket-btn`)**: Shows total unit badge (`#top-basket-count-pill`) and opens/collapses `#basket-popup-window`. *(Developer note: Ensure `animateBasketAddition()` targets `#single-basket-btn` and `#top-basket-count-pill` consistently so the container bump and floating `+1 Added` badge anchor accurately.)*
   - **Virtual Touch Keyboard (`#virtual-keyboard-drawer`)**:
     - Fixed bottom dark glass drawer (`slate-900/95`), read-only display input (`#vk-display-input`), `Clear` and `Done ✕` controls, and touch key rows (`1–0`, `QWERTYUIOP`, `ASDFGHJKL`, `ZXCVBNM` + `⌫ Back`, `SPACE`). Live-filters equipment by `name`, `category`, or `storage_compartment`.
   - **Equipment Catalog Grid (`#equipment-grid`)**:
     - Responsive 1–4 column grid (3 columns on 7" LCD). Each card shows SVG image, stock badge (`available/total`), title, compartment section, and either `+ Add to Basket` (or `Unavailable` if 0 stock / disabled if `UNSAFE`) or inline `-` / `N in Basket` / `+` stepper. Tapping the image box also increments by 1.
   - **Floating Basket Popup Window (`#basket-popup-window`)**:
     - Supports `collapse`, `normal` (`bottom-2 right-2 w-80/w-96`), and `maximize` (`inset-2`) window states. Lists each basket item with quantity stepper, compartment label, and an inline **How to Use** guide box (`HOW_TO_USE_GUIDES[qr_code]`), plus `Clear` and `Checkout & Generate QR →`.
   - **Modal 1 — Checkout QR & Material Guide (`#qr-checkout-modal`)**:
     - Displays QR Code PNG (`#qr-modal-img`), session token (`CHK-XXXXXXXX`), **How to Use Borrowed Material** panel for every item in the basket, and direct link `Open Mobile Student Form →` (`/student/checkout/{token}`).
6. **Screen 2 — Flow B: Return Equipment (`#return-section`)**:
   - **Privacy-Masked Active Loan Cards (`#return-cards-grid`)**:
     - `maskStudentName(name)` keeps only first and last characters of each word (e.g., `O*e E*****e S*******n G. A****s`).
     - `maskStudentId(id)` masks all leading characters except the last 4 (`***********0101`).
     - **Hold-to-Reveal Eye Button (`#tx-eye-btn-{id}`)**: Bound to `onpointerdown` → `revealStudentName(id)` and `onpointerup` / `onpointerleave` / `onpointercancel` (plus global `window` `pointerup`/`pointercancel`) → `hideStudentName(id)`. Releasing touch/mouse immediately restores masking.
   - **Modal 2 — Confirm Equipment Return (`#return-modal`)**:
     - Displays masked borrower title, borrowed item list + compartments, and 3 condition buttons: **`Good`**, **`Damaged`**, **`Missing`**.
     - Selecting `Damaged` or `Missing` reveals `#return-condition-alert` warning the user that the Station LED Safety Status will automatically switch to **`YELLOW (CAUTION)`**.
     - Submitting posts to `POST /api/kiosk/return`, updates `safetyStatus`, refreshes UI, and displays `#return-success-banner` (emerald for Good, amber for Damaged/Missing).

---

### 6.2 Interface 2: Mobile Student Form (`templates/student_form.html`)
**Routes:** `/student/checkout/:token`, `/student_form.html`

#### Parts & Sections
1. **Mobile App Header**: Official AU Seal, `LabGuard+` title, `"AU Jose Rizal Campus · Student Form"`, and session token pill (`#header-token-label`).
2. **Card 1 — Borrowed Equipment Summary & Usage Guide (`#basket-summary-items`)**:
   - Loads items from `GET /api/kiosk/checkout-session/:token` (or falls back to first equipment item from `GET /api/state` when previewed directly via `/student/checkout/DEMO-QR`).
   - Renders each item's thumbnail, compartment location, quantity (`2×`), and `"How to use:"` safety guide.
3. **Card 2 — Student Registration Form (`#mobile-student-form`)**:
   - **Returning Borrower Quick Auto-Fill Bar (`#preset-buttons`)**: Displays pill buttons (`FirstName (Last4ID)`) from `student_presets`. Tapping fills Name, LRN, normalized Strand/Faculty, School Email, Default Subject, and Default Teacher.
   - **LRN Auto-Lookup (`#student-lrn`)**: `oninput` checks `presetsList` by case-insensitive `student_id_lrn` match and auto-populates all matching fields.
   - **Strand / Faculty Dropdown (`#grade-section`)**: Grouped `<optgroup label="STRANDS">` (`STEM`, `HUMSS`, `ABM`) and standalone `<option value="FACULTY">FACULTY</option>`, normalized via `normalizeStrandOrFaculty()`.
   - **Additional Inputs**: `School Email (@arellano.edu.ph)`, `Science Subject & Lab Activity` (required), `Supervising Science Teacher` (required).
   - **Flexible Custom Return Date & Time Picker**:
     - Date input (`#custom-return-date`, `min` set to today, defaults to `+2 hours`) and Time input (`#custom-return-time`).
     - Live `handleCustomDateTimeChange()` computes hours (`Math.round((diffMs / 3600000) * 10) / 10`, minimum `0.5h`) or days (`>= 24h`) and updates `#duration-preview-badge` and `#return-estimate-text`. Rejects past timestamps with `"Invalid Time"` warning.
   - **Safety & Accountability Pledge (`#safety-pledge`)**: Required confirmation checkbox.
   - **Submit Button (`#submit-btn`)**: Posts payload to `POST /api/kiosk/checkout-session/:token/complete`.
4. **Completed Digital Pass Receipt (`#completed-receipt-box`)**:
   - Shown immediately upon submission (or if revisiting an already-`completed` session token).
   - Features the **multi-layer animated emerald checkmark badge**, pass code pill (`LG-JRC-XXX`), borrower summary, borrowed item list, and `Done · Return to Kiosk` button. *(Developer note: Server returns `expected_return` on `StudentTransactionLog`; ensure receipt rendering reads `tx.expected_return || tx.time_out_expected` so Due Back always formats cleanly without `Invalid Date`.)*

---

### 6.3 Interface 3: PC Admin Console (`templates/admin.html`)
**Routes:** `/admin`, `/admin.html`

#### Parts & Sections
1. **Screen 1 — Personnel Login Gate (`#admin-login-screen`)**:
   - Centered dark-backdrop card with AU Seal and credential inputs (`#login-email`, `#login-password`).
   - Validates email ending in `@arellano.edu.ph` and password length `>= 4` (demo defaults: `lara.puertollano@arellano.edu.ph` / `au-jrc-2026`, with `Auto-Fill Credentials` helper). Persists unlocked state in `sessionStorage.getItem('labguard_admin_auth') === '1'`.
2. **Screen 2 — Desktop Workspace (`#admin-dashboard-shell`)**:
   - **Fixed 260px Dark Sidebar (`#0F172A`)**: AU Seal header, 3 navigation tabs (`Student Borrow Logs` with count badge, `Kiosk Lab Items (Add/Remove)` with item count badge, `LED Safety Display` with live status pill), logged-in Lab Coordinator profile, and `Lock / Sign Out of PC Console` button.
   - **Top Contextual Header**: Dynamic breadcrumb (`#breadcrumb-current`), `+ Add Lab Item to Kiosk`, `Reset Database` (`POST /api/reset`), and `Export CSV Report` (`#C8102E`).
   - **4-Column KPI Strip**:
     1. Total Student Log-In Records + active in-lab subtitle.
     2. Kiosk Apparatus Stock (`available / total`).
     3. Overdue Sessions count.
     4. Station LED Safety Status (`● GREEN (SAFE)` / `▲ YELLOW (CAUTION)` / `▲ RED (UNSAFE)`) + `updated_by`.
   - **Tab 1 — Student Borrow Logs (`#tab-logs-section`)**:
     - Real-time search across Name, LRN, Strand/Section, Transaction Code, Teacher, and Subject + Status dropdown (`ALL`, `Borrowed / In Lab`, `Overdue`, `Returned / Logged Out`).
     - Displays Time In / Out / Due, Student Info, Subject & Teacher, Checked-Out Items (`qty× Name (QR · Compartment)`), Status badge, and `Check In & Log Out` quick-return button (`return_condition: 'Good'`).
     - **Institutional CSV Export (`exportLogsCsv()`)**: Generates UTF-8 BOM (`\uFEFF`) CSV named `AU_JRC_LabGuard_Student_Logs_YYYY-MM-DD.csv` with a 6-row institutional header block (University name, System name, Report title, Generated date/time, Lab In-Charge, Summary Metrics), 17 formatted columns aligned with the admin table, human-readable Excel dates (`YYYY-MM-DD HH:MM AM/PM`), and calculated loan durations.
   - **Tab 2 — Kiosk Lab Items Inventory (`#tab-inventory-section`)**:
     - Lists every apparatus with thumbnail SVG/custom image, QR code, storage section, safety prerequisite, `available / total` stock, `-1` / `+1` stock steppers (`PATCH /api/admin/equipment/:id`), and `Remove from Kiosk` (`DELETE /api/admin/equipment/:id`).
     - **Add Lab Item Modal (`#add-eq-modal`)**: Name, Category, Storage Compartment (defaults to `4th - 3rd Section`), Total Quantity, Unit (`unit`/`set`/`kit`), Safety Level (`SAFE`/`CAUTION`), Prerequisite instruction, **PC Image Upload** (`FileReader.readAsDataURL` stored as Base64 data URI), and **11 Built-In SVG Icon Presets (`LG-EQ-001.svg` .. `LG-EQ-011.svg`)**.
   - **Tab 3 — LED Safety Display Controller (`#tab-safety-section`)**:
     - 3 interactive status cards (`SAFE`, `CAUTION`, `UNSAFE`) + Custom Safety Banner Message input & `Broadcast Message to Touchscreen Kiosk` button (`POST /api/admin/safety-status`).
   - **Live Synchronization**: Connects to `/ws/kiosk` via `connectAdminSocket()` and calls `fetchAdminState()` whenever kiosk checkouts, returns, or inventory changes occur.

---

## 7. Complete REST & WebSocket API Contract (`server.ts`)

### 7.1 Template & Static Asset Routes
| Method | Path | Behavior |
| :--- | :--- | :--- |
| `GET` | `/`, `/kiosk`, `/kiosk.html` | Serves `templates/kiosk.html`. |
| `GET` | `/student/checkout/:token`, `/student_form.html` | Serves `templates/student_form.html`. |
| `GET` | `/admin`, `/admin.html` | Serves `templates/admin.html`. |
| `GET` | `/images/equipment/:filename` | Returns SVG XML (`Content-Type: image/svg+xml`) from `EQUIPMENT_SVG_MAP` (fallback `LG-EQ-002`). |

### 7.2 REST JSON Endpoints

#### `GET /api/state`
- **Response (`200 OK`)**:
```json
{
  "equipment": [ /* Equipment[] */ ],
  "transactions": [ /* StudentTransactionLog[] */ ],
  "safety_status": { "level": "SAFE", "headline": "...", "message": "...", "updated_by": "...", "updated_at": "..." },
  "student_presets": [ /* LabStudentPreset[] */ ]
}
```

#### `POST /api/kiosk/checkout-session`
- **Guards**: Returns `403` if `safetyStatus.level === 'UNSAFE'`. Returns `400` if `basket_items` is empty or `quantity > available_qty`. Returns `404` if item ID is invalid/inactive.
- **Request**: `{ "basket_items": [{ "equipment_id": 1, "quantity": 2 }] }`
- **Response (`201 Created`)**: `{ "session": CheckoutSession }` (with `session_token`, `qr_data_url`, `mobile_url`, `expires_at` +15m).

#### `GET /api/kiosk/checkout-session/:token`
- **Response (`200 OK`)**: `{ "session": CheckoutSession, "safety_status": SafetyStatusState, "student_presets": LabStudentPreset[] }`
- **Error (`404 Not Found`)**: `{ "error": "Checkout QR session not found or expired." }`

#### `POST /api/kiosk/checkout-session/:token/complete`
- **Request**:
```json
{
  "student_name": "One Enrique Sebastian G. Abalos",
  "student_id_lrn": "AUJRC-2026-0101",
  "grade_section": "STEM",
  "school_email": "one.abalos@arellano.edu.ph",
  "subject_activity": "General Biology 1 — Microscopy",
  "teacher_name": "Ms. Lara Marie Agustin Puertollano",
  "expected_return_hours": 2,
  "basket_items": [ /* optional fallback if no session token exists */ ],
  "safety_prerequisites_checked": [ /* optional */ ]
}
```
- **Side Effects**: Deducts `available_qty`, appends `StudentTransactionLog` (`LG-JRC-{id}`), upgrades `SAFE` → `CAUTION` if any item has `safety_level === 'CAUTION'`, marks `session.status = 'completed'`, broadcasts `checkout_completed` to `/ws/checkout/:token` and `data_updated` to `/ws/kiosk`.
- **Response (`201 Created`)**: `{ "success": true, "transaction": StudentTransactionLog, "safety_status": SafetyStatusState }` *(Idempotent: returns existing `200` receipt if session is already completed.)*

#### `POST /api/kiosk/return`
- **Request**:
```json
{
  "transaction_id": 101,
  "transaction_code": "LG-JRC-101",
  "return_condition": "Good | Damaged | Missing",
  "return_notes": "Optional remarks"
}
```
- **Side Effects**:
  - Sets `status = 'Returned / Logged Out'`, `time_out = nowIso`, `return_condition`, `return_notes`.
  - If `return_condition !== 'Missing'`, restores `available_qty = Math.min(total_qty, available_qty + item.quantity)`.
  - If `return_condition === 'Damaged'`, sets `eq.condition = 'Damaged'`.
  - If `return_condition === 'Damaged' || 'Missing'`, sets `safetyStatus.level = (current === 'UNSAFE' ? 'UNSAFE' : 'CAUTION')` with item names and compartment summary, `updated_by = "LabGuard+ Return Monitor (${condition})"`.
  - Broadcasts `data_updated` on `/ws/kiosk`.
- **Response (`200 OK`)**: `{ "success": true, "transaction": StudentTransactionLog, "safety_status": SafetyStatusState }`

#### `POST /api/admin/equipment`
- **Request**: `{ "name": "...", "category": "...", "storage_compartment": "4th - 3rd Section", "total_qty": 6, "unit": "unit", "safety_level": "SAFE", "prerequisites": ["..."], "image_url": "..." }`
- **Response (`201 Created`)**: `{ "equipment": Equipment }` (Auto-generates `LG-EQ-{pad3}` if `qr_code` omitted; broadcasts `data_updated`).

#### `PATCH /api/admin/equipment/:id`
- **Request**: Partial fields (`name`, `category`, `description`, `storage_compartment`, `condition`, `safety_level`, `total_qty`, `available_qty`, `prerequisites`). Adjusting `total_qty` preserves `borrowedCount = total_qty - available_qty`.
- **Response (`200 OK`)**: `{ "equipment": Equipment }` (Broadcasts `data_updated`).

#### `DELETE /api/admin/equipment/:id`
- **Response (`200 OK`)**: `{ "success": true }` (Removes item from catalog and broadcasts `data_updated`).

#### `POST /api/admin/safety-status`
- **Request**: `{ "level": "SAFE | CAUTION | UNSAFE", "message": "Optional custom text", "updated_by": "..." }`
- **Response (`200 OK`)**: `{ "safety_status": SafetyStatusState }` (Broadcasts `data_updated`).

#### `POST /api/reset`
- **Response (`200 OK`)**: `{ "success": true }` (Restores seed equipment, transactions, `SAFE` LED status, clears active QR sessions, and broadcasts `data_updated`).

### 7.3 WebSocket Channels
| Path | Direction | Payload Schema | Trigger |
| :--- | :--- | :--- | :--- |
| `/ws/kiosk` or `/ws/hardware` | Server → Client | `{ "event": "state_sync", "safety_status": SafetyStatusState }` | Initial connection handshake |
| `/ws/kiosk` or `/ws/hardware` | Server → Client | `{ "event": "data_updated", "transaction"?: ..., "safety_status"?: ... }` | Checkout complete, return, equipment CRUD, safety change, reset |
| `/ws/checkout/:token` | Server → Client | `{ "event": "checkout_completed", "transaction": StudentTransactionLog }` | Mobile student submits `POST .../complete` |

---

## 8. Step-by-Step Developer Build Roadmap

Follow these phases in order to build LabGuard+ from an empty repository to full verification:

### Phase 1: Project Initialization & Dependencies
1. Initialize Node ESM project (`"type": "module"`) and install runtime dependencies: `express`, `ws`, `qrcode`, and dev dependencies `tsx`, `typescript`, `@types/express`, `@types/ws`, `@types/qrcode`, `@types/node`.
2. Add institutional brand asset `public/images/au_seal.jpg`.
3. Configure npm scripts: `"dev": "tsx server.ts"` and `"start": "node server.ts"`.

### Phase 2: Data Types, Seed Catalog & Vector SVG Assets
1. Define TypeScript domain contracts in `src/types.ts` (`Equipment`, `BasketItem`, `CheckoutSession`, `StudentTransactionLog`, `SafetyStatusState`, `LabStudentPreset`).
2. Create `src/data/equipmentImages.ts` mapping `LG-EQ-001` through `LG-EQ-011` to clean `120×120` laboratory apparatus SVGs.
3. Create `src/data/seedData.ts` with the 11 items & exact locker sections (`1st - 1st Section` .. `3rd - 3rd Section`), `SAFETY_PRESET_MESSAGES`, `STUDENT_PRESETS`, and `INITIAL_TRANSACTIONS`.

### Phase 3: Express + WebSocket Server (`server.ts`)
1. On boot, generate `public/images/equipment/*.svg` from `EQUIPMENT_SVG_MAP` and initialize in-memory state from `seedData.ts`.
2. Set up HTTP server + `WebSocketServer({ noServer: true })` and route `upgrade` requests for `/ws/checkout/:token`, `/ws/kiosk`, and `/ws/hardware`.
3. Implement HTML template routes (`/`, `/kiosk`, `/student/checkout/:token`, `/admin`) and SVG image route `/images/equipment/:filename`.
4. Implement all REST endpoints (`/api/state`, `/api/kiosk/checkout-session`, `.../complete`, `/api/kiosk/return`, `/api/admin/equipment*`, `/api/admin/safety-status`, `/api/reset`) with stock validation, QR generation, and Damaged/Missing → `CAUTION` LED escalation.

### Phase 4: Build Surface 1 — Touchscreen Kiosk (`templates/kiosk.html`)
1. Add Tailwind CDN, Google Fonts, keyframe animations (`breathe`, `sealHalo`, `screenSlideIn`, `basketBump`, `floatAddOne`, `popInModal`, `checkmarkPop`), and `.rpi-lcd-active` media/toggle overrides for `800×480`.
2. Build Screen 0 (`#attract-screen`), Persistent Brand & LED Pill Header (`#kiosk-top-bar`), and Screen 1 (`#welcome-screen`).
3. Build Screen 2 Borrow Flow: Category sidebar toggle, Search trigger + Virtual QWERTY Touch Keyboard Drawer, 3/4-column apparatus grid, and collapsible/maximizable Basket Popup Window with `HOW_TO_USE_GUIDES`.
4. Build Checkout QR Modal (`#qr-checkout-modal`) + Return Flow (`#return-cards-grid` with `maskStudentName`/`maskStudentId` + hold-to-reveal eye button + `#return-modal` condition warnings).
5. Wire `fetchKioskState()`, `connectGlobalKioskSocket()`, and the 45-second idle timer (`startIdleTracker()`).

### Phase 5: Build Surface 2 — Mobile Student Form (`templates/student_form.html`)
1. Wrap the mobile viewport in a `420px` desktop smartphone bezel (`>=640px`) and native full-screen layout (`<640px`).
2. Render Card 1 (Basket Summary + `HOW_TO_USE_GUIDES`) from `/api/kiosk/checkout-session/:token`.
3. Build Card 2 Form: Returning Borrower preset chips, LRN `oninput` lookup, Strand/Faculty `<select>` (`STEM`, `HUMSS`, `ABM`, `FACULTY`), Custom Return Date & Time calculator (`handleCustomDateTimeChange()`), and Safety Pledge.
4. Build the Celebratory Receipt View (`#completed-receipt-box`) with pulse rings, self-drawing SVG checkmark, and sparkles.

### Phase 6: Build Surface 3 — PC Admin Console & QA Verification (`templates/admin.html`)
1. Build Login Gate (`#admin-login-screen`) with `sessionStorage` persistence and demo credential autofill.
2. Build Desktop Shell with 260px sidebar, 4-card KPI strip, Logs Table + quick Check-In + Institutional UTF-8 BOM CSV export, Inventory Table + Add Equipment Modal (PC upload + 11 preset icons), and LED Safety Status Controller.
3. Connect `/ws/kiosk` on `admin.html` for live refreshes.
4. **End-to-End Test Checklist**:
   - Verify Kiosk `800×480` simulator layout has no overflowing buttons or clipped welcome cards.
   - Add items via Virtual Keyboard search → generate Checkout QR → complete submission on `student_form.html` → verify stock deducts and Admin Logs update live.
   - Test `Hold-to-Reveal` Eye icon on Kiosk Return cards (releases back to masked immediately).
   - Return an item as **`Damaged`** and another as **`Missing`** → confirm Station LED updates to **`YELLOW (CAUTION)`** on Kiosk & Admin, Missing stock stays deducted, and `POST /api/reset` restores `SAFE`.
