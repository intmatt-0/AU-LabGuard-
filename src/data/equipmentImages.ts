/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const EQUIPMENT_SVG_MAP: Record<string, string> = {
  // LG-EQ-001: Beaker (1st - 1st Section)
  'LG-EQ-001': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="12" fill="#F8FAFC"/>
    <ellipse cx="120" cy="142" rx="54" ry="7" fill="#CBD5E1"/>
    <path d="M74 34L82 40V128C82 134 86 138 92 138H148C154 138 158 134 158 128V40L164 34H74Z" fill="#E0F2FE" stroke="#003087" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M84 82H156V127C156 132 152 136 147 136H93C88 136 84 132 84 127V82Z" fill="#38BDF8" fill-opacity="0.45"/>
    <ellipse cx="120" cy="82" rx="36" ry="4" fill="#0284C7" fill-opacity="0.35"/>
    <line x1="94" y1="54" x2="110" y2="54" stroke="#003087" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="94" y1="70" x2="106" y2="70" stroke="#003087" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="94" y1="86" x2="112" y2="86" stroke="#003087" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="94" y1="102" x2="106" y2="102" stroke="#003087" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="94" y1="118" x2="112" y2="118" stroke="#003087" stroke-width="2.5" stroke-linecap="round"/>
    <text x="134" y="122" text-anchor="middle" fill="#003087" font-family="monospace" font-weight="bold" font-size="11">250mL</text>
  </svg>`,

  // LG-EQ-002: Graduated Cylinder (2nd - 1st Section)
  'LG-EQ-002': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="12" fill="#F8FAFC"/>
    <ellipse cx="120" cy="142" rx="46" ry="6" fill="#CBD5E1"/>
    <!-- Hexagonal Base -->
    <rect x="86" y="130" width="68" height="10" rx="4" fill="#003087"/>
    <!-- Tall Cylinder Tube -->
    <path d="M102 22L106 28V130H134V28L138 22H102Z" fill="#E0F2FE" stroke="#003087" stroke-width="3" stroke-linejoin="round"/>
    <!-- Liquid inside -->
    <rect x="108" y="64" width="24" height="64" fill="#38BDF8" fill-opacity="0.5"/>
    <path d="M108 64C114 68 126 68 132 64" stroke="#0284C7" stroke-width="2"/>
    <!-- Graduations -->
    <line x1="110" y1="40" x2="122" y2="40" stroke="#003087" stroke-width="2"/>
    <line x1="110" y1="52" x2="118" y2="52" stroke="#003087" stroke-width="2"/>
    <line x1="110" y1="64" x2="122" y2="64" stroke="#003087" stroke-width="2"/>
    <line x1="110" y1="76" x2="118" y2="76" stroke="#003087" stroke-width="2"/>
    <line x1="110" y1="88" x2="122" y2="88" stroke="#003087" stroke-width="2"/>
    <line x1="110" y1="100" x2="118" y2="100" stroke="#003087" stroke-width="2"/>
    <line x1="110" y1="112" x2="122" y2="112" stroke="#003087" stroke-width="2"/>
  </svg>`,

  // LG-EQ-003: Florence Flask (3rd - 1st Section)
  'LG-EQ-003': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="12" fill="#F8FAFC"/>
    <ellipse cx="120" cy="142" rx="48" ry="6" fill="#CBD5E1"/>
    <!-- Rim & Long Neck -->
    <rect x="106" y="20" width="28" height="6" rx="3" fill="#E0F2FE" stroke="#003087" stroke-width="2.5"/>
    <!-- Round Bulb Body -->
    <path d="M110 26V60C90 66 78 83 78 103C78 124 94 138 120 138C146 138 162 124 162 103C162 83 150 66 130 60V26H110Z" fill="#FEF3C7" fill-opacity="0.55" stroke="#003087" stroke-width="3.5" stroke-linejoin="round"/>
    <!-- Amber/Blue Solution -->
    <path d="M81 106C81 124 96 136 120 136C144 136 159 124 159 106H81Z" fill="#F5A623" fill-opacity="0.5"/>
    <ellipse cx="120" cy="106" rx="39" ry="5" fill="#D97706" fill-opacity="0.4"/>
    <circle cx="104" cy="90" r="6" fill="#FFFFFF" fill-opacity="0.7"/>
  </svg>`,

  // LG-EQ-004: Glass Funnel (4th - 1st Section)
  'LG-EQ-004': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="12" fill="#F8FAFC"/>
    <ellipse cx="120" cy="142" rx="46" ry="6" fill="#CBD5E1"/>
    <!-- Conical Funnel & Stem -->
    <path d="M62 34H178L128 92V132L112 138V92L62 34Z" fill="#E0F2FE" stroke="#003087" stroke-width="3.5" stroke-linejoin="round"/>
    <ellipse cx="120" cy="34" rx="58" ry="8" fill="#BAE6FD" stroke="#003087" stroke-width="3"/>
    <!-- Filter paper line inside -->
    <path d="M74 36L120 84L166 36" stroke="#FFFFFF" stroke-width="2.5" stroke-dasharray="4 3"/>
    <line x1="120" y1="92" x2="120" y2="128" stroke="#38BDF8" stroke-width="4" stroke-linecap="round"/>
  </svg>`,

  // LG-EQ-005: Erlenmeyer Flask (1st - 2nd Section)
  'LG-EQ-005': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="12" fill="#F8FAFC"/>
    <ellipse cx="120" cy="142" rx="56" ry="7" fill="#CBD5E1"/>
    <rect x="103" y="22" width="34" height="7" rx="3" fill="#FEE2E2" stroke="#003087" stroke-width="2.5"/>
    <path d="M107 29V58L70 124C67 131 71 138 79 138H161C169 138 173 131 170 124L133 58V29H107Z" fill="#E0F2FE" stroke="#003087" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M88 94H152L168 124C170 129 167 135 160 135H80C73 135 70 129 72 124L88 94Z" fill="#C8102E" fill-opacity="0.35"/>
    <line x1="94" y1="84" x2="108" y2="84" stroke="#003087" stroke-width="2"/>
    <line x1="88" y1="102" x2="104" y2="102" stroke="#003087" stroke-width="2"/>
    <line x1="82" y1="120" x2="100" y2="120" stroke="#003087" stroke-width="2"/>
  </svg>`,

  // LG-EQ-006: Test Tube, Test Tube Holder & Rack (2nd - 2nd Section)
  'LG-EQ-006': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="12" fill="#F8FAFC"/>
    <ellipse cx="120" cy="142" rx="68" ry="6" fill="#CBD5E1"/>
    <!-- Test Tube Rack -->
    <rect x="58" y="122" width="114" height="12" rx="3" fill="#003087"/>
    <rect x="64" y="64" width="6" height="58" fill="#1E293B"/>
    <rect x="160" y="64" width="6" height="58" fill="#1E293B"/>
    <rect x="58" y="60" width="114" height="8" rx="3" fill="#003087"/>
    <!-- 3 Test Tubes -->
    <rect x="78" y="34" width="14" height="78" rx="7" fill="#E0F2FE" stroke="#003087" stroke-width="2.5"/>
    <rect x="80" y="74" width="10" height="36" rx="5" fill="#38BDF8" fill-opacity="0.6"/>
    <rect x="108" y="34" width="14" height="78" rx="7" fill="#FEF3C7" stroke="#003087" stroke-width="2.5"/>
    <rect x="110" y="66" width="10" height="44" rx="5" fill="#F5A623" fill-opacity="0.7"/>
    <rect x="138" y="34" width="14" height="78" rx="7" fill="#DCFCE7" stroke="#003087" stroke-width="2.5"/>
    <rect x="140" y="80" width="10" height="30" rx="5" fill="#16A34A" fill-opacity="0.6"/>
    <!-- Test Tube Holder Clamp -->
    <path d="M174 44L198 112" stroke="#64748B" stroke-width="4" stroke-linecap="round"/>
    <path d="M168 42C168 36 180 36 180 42" stroke="#C8102E" stroke-width="3.5" stroke-linecap="round"/>
  </svg>`,

  // LG-EQ-007: Tripod Stand (3rd - 2nd Section)
  'LG-EQ-007': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="12" fill="#F8FAFC"/>
    <ellipse cx="120" cy="142" rx="66" ry="6" fill="#CBD5E1"/>
    <!-- Wire Gauze / Top Ring -->
    <ellipse cx="120" cy="46" rx="52" ry="12" fill="#94A3B8" stroke="#1E293B" stroke-width="4"/>
    <ellipse cx="120" cy="46" rx="36" ry="7" fill="#E2E8F0"/>
    <!-- Three Iron Legs -->
    <line x1="76" y1="52" x2="58" y2="136" stroke="#1E293B" stroke-width="6" stroke-linecap="round"/>
    <line x1="164" y1="52" x2="182" y2="136" stroke="#1E293B" stroke-width="6" stroke-linecap="round"/>
    <line x1="120" y1="58" x2="120" y2="138" stroke="#475569" stroke-width="5" stroke-linecap="round"/>
  </svg>`,

  // LG-EQ-008: Bell Jar (4th - 2nd Section)
  'LG-EQ-008': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="12" fill="#F8FAFC"/>
    <ellipse cx="120" cy="142" rx="64" ry="7" fill="#CBD5E1"/>
    <!-- Base Plate -->
    <rect x="66" y="124" width="108" height="12" rx="4" fill="#1E293B"/>
    <!-- Top Glass Knob -->
    <circle cx="120" cy="24" r="9" fill="#BAE6FD" stroke="#003087" stroke-width="3"/>
    <!-- Bell Dome -->
    <path d="M76 124V76C76 50 95 33 120 33C145 33 164 50 164 76V124H76Z" fill="#E0F2FE" fill-opacity="0.7" stroke="#003087" stroke-width="3.5"/>
    <!-- Glass Shine -->
    <path d="M90 74C90 56 100 45 112 43" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
    <rect x="72" y="118" width="96" height="6" rx="2" fill="#003087"/>
  </svg>`,

  // LG-EQ-009: Laboratory Gown (1st - 3rd Section)
  'LG-EQ-009': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="12" fill="#F8FAFC"/>
    <ellipse cx="120" cy="144" rx="58" ry="6" fill="#CBD5E1"/>
    <!-- Sleeves & Coat Body -->
    <path d="M96 24L60 44L46 98L66 104L78 66V138H162V66L174 104L194 98L180 44L144 24H96Z" fill="#FFFFFF" stroke="#003087" stroke-width="3.5" stroke-linejoin="round"/>
    <!-- Collar & Center Seam -->
    <path d="M96 24L120 56L144 24" fill="#E0F2FE" stroke="#003087" stroke-width="3" stroke-linejoin="round"/>
    <line x1="120" y1="56" x2="120" y2="138" stroke="#94A3B8" stroke-width="2"/>
    <!-- Buttons -->
    <circle cx="120" cy="72" r="2.5" fill="#003087"/>
    <circle cx="120" cy="90" r="2.5" fill="#003087"/>
    <circle cx="120" cy="108" r="2.5" fill="#003087"/>
    <!-- Pockets & AU Crest -->
    <rect x="88" y="96" width="20" height="22" rx="3" fill="#F1F5F9" stroke="#64748B" stroke-width="2"/>
    <rect x="132" y="96" width="20" height="22" rx="3" fill="#F1F5F9" stroke="#64748B" stroke-width="2"/>
    <circle cx="142" cy="64" r="7" fill="#C8102E"/>
  </svg>`,

  // LG-EQ-010: Stirring Rod, PPE Glasses, Facemask, Gloves (2nd - 3rd Section)
  'LG-EQ-010': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="12" fill="#F8FAFC"/>
    <!-- PPE Safety Glasses -->
    <rect x="44" y="28" width="96" height="34" rx="12" fill="#E0F2FE" stroke="#003087" stroke-width="3"/>
    <rect x="54" y="36" width="32" height="18" rx="6" fill="#38BDF8" fill-opacity="0.45"/>
    <rect x="98" y="36" width="32" height="18" rx="6" fill="#38BDF8" fill-opacity="0.45"/>
    <!-- Facemask -->
    <rect x="48" y="82" width="88" height="44" rx="10" fill="#BAE6FD" stroke="#0284C7" stroke-width="3"/>
    <line x1="58" y1="96" x2="126" y2="96" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="58" y1="110" x2="126" y2="110" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
    <!-- Nitrile Glove -->
    <path d="M158 76V52C158 48 164 48 164 52V74H168V46C168 42 174 42 174 46V74H178V50C178 46 184 46 184 50V76H188V60C188 56 194 56 194 60V98C194 114 182 126 172 126H160C152 126 146 118 146 106V88C146 82 152 76 158 76Z" fill="#A7F3D0" stroke="#16A34A" stroke-width="2.5"/>
    <!-- Glass Stirring Rod -->
    <line x1="164" y1="22" x2="206" y2="54" stroke="#003087" stroke-width="5" stroke-linecap="round"/>
    <line x1="164" y1="22" x2="206" y2="54" stroke="#BAE6FD" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  // LG-EQ-011: Compound Light Microscope (3rd - 3rd Section)
  'LG-EQ-011': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="12" fill="#F8FAFC"/>
    <ellipse cx="120" cy="142" rx="54" ry="7" fill="#CBD5E1"/>
    <rect x="76" y="130" width="88" height="12" rx="4" fill="#003087"/>
    <path d="M138 130V58C138 44 126 36 112 36H104" stroke="#1E293B" stroke-width="10" stroke-linecap="round"/>
    <rect x="82" y="92" width="52" height="6" rx="2" fill="#0F172A"/>
    <rect x="92" y="88" width="26" height="4" rx="1" fill="#38BDF8"/>
    <rect x="98" y="114" width="20" height="16" rx="3" fill="#475569"/>
    <circle cx="108" cy="112" r="5" fill="#F5A623"/>
    <g transform="rotate(-18 104 42)">
      <rect x="94" y="16" width="18" height="36" rx="3" fill="#003087"/>
      <rect x="96" y="8" width="14" height="10" rx="2" fill="#0F172A"/>
    </g>
    <circle cx="106" cy="54" r="9" fill="#94A3B8"/>
    <rect x="97" y="60" width="6" height="18" rx="2" fill="#C8102E"/>
    <rect x="106" y="60" width="6" height="22" rx="2" fill="#003087"/>
    <circle cx="138" cy="106" r="9" fill="#F5A623" stroke="#0F172A" stroke-width="2"/>
    <circle cx="138" cy="106" r="4" fill="#0F172A"/>
  </svg>`,
};

export function getEquipmentImageDataUrl(qrCode: string): string {
  const svg = EQUIPMENT_SVG_MAP[qrCode] || EQUIPMENT_SVG_MAP['LG-EQ-001'];
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
