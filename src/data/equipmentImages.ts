/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const EQUIPMENT_SVG_MAP: Record<string, string> = {
  'LG-EQ-001': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="12" fill="#F8FAFC"/>
    <ellipse cx="120" cy="142" rx="54" ry="7" fill="#CBD5E1"/>
    <!-- Base -->
    <rect x="76" y="130" width="88" height="12" rx="4" fill="#003087"/>
    <!-- Pillar & Arm -->
    <path d="M138 130V58C138 44 126 36 112 36H104" stroke="#1E293B" stroke-width="10" stroke-linecap="round"/>
    <!-- Stage -->
    <rect x="82" y="92" width="52" height="6" rx="2" fill="#0F172A"/>
    <rect x="92" y="88" width="26" height="4" rx="1" fill="#38BDF8"/>
    <!-- Condenser & Light -->
    <rect x="98" y="114" width="20" height="16" rx="3" fill="#475569"/>
    <circle cx="108" cy="112" r="5" fill="#F5A623"/>
    <!-- Eyepiece & Body Tube -->
    <g transform="rotate(-18 104 42)">
      <rect x="94" y="16" width="18" height="36" rx="3" fill="#003087"/>
      <rect x="96" y="8" width="14" height="10" rx="2" fill="#0F172A"/>
    </g>
    <!-- Nosepiece & Objectives -->
    <circle cx="106" cy="54" r="9" fill="#94A3B8"/>
    <rect x="97" y="60" width="6" height="18" rx="2" fill="#C8102E"/>
    <rect x="106" y="60" width="6" height="22" rx="2" fill="#003087"/>
    <!-- Focus Knobs -->
    <circle cx="138" cy="106" r="9" fill="#F5A623" stroke="#0F172A" stroke-width="2"/>
    <circle cx="138" cy="106" r="4" fill="#0F172A"/>
  </svg>`,

  'LG-EQ-002': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="12" fill="#F8FAFC"/>
    <ellipse cx="120" cy="142" rx="68" ry="7" fill="#CBD5E1"/>
    <!-- 500mL Beaker -->
    <path d="M58 42H114V128C114 133 110 137 105 137H67C62 137 58 133 58 128V42Z" fill="#E0F2FE" stroke="#003087" stroke-width="3"/>
    <path d="M60 84H112V127C112 131 109 135 105 135H67C63 135 60 131 60 127V84Z" fill="#38BDF8" fill-opacity="0.45"/>
    <line x1="68" y1="60" x2="80" y2="60" stroke="#003087" stroke-width="2"/>
    <line x1="68" y1="78" x2="84" y2="78" stroke="#003087" stroke-width="2"/>
    <line x1="68" y1="96" x2="80" y2="96" stroke="#003087" stroke-width="2"/>
    <line x1="68" y1="114" x2="84" y2="114" stroke="#003087" stroke-width="2"/>
    <!-- Erlenmeyer Flask -->
    <path d="M148 38H168V66L192 126C194 132 190 137 183 137H133C126 137 122 132 124 126L148 66V38Z" fill="#FEE2E2" stroke="#C8102E" stroke-width="3"/>
    <path d="M138 98H178L189 126C190 131 187 135 182 135H134C129 135 126 131 127 126L138 98Z" fill="#C8102E" fill-opacity="0.35"/>
  </svg>`,

  'LG-EQ-003': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="12" fill="#F8FAFC"/>
    <ellipse cx="120" cy="142" rx="64" ry="7" fill="#CBD5E1"/>
    <!-- Tripod Stand -->
    <rect x="68" y="54" width="104" height="6" rx="2" fill="#334155"/>
    <line x1="78" y1="60" x2="64" y2="138" stroke="#475569" stroke-width="4" stroke-linecap="round"/>
    <line x1="162" y1="60" x2="176" y2="138" stroke="#475569" stroke-width="4" stroke-linecap="round"/>
    <!-- Flame -->
    <path d="M120 22C120 22 136 40 136 52C136 61 129 68 120 68C111 68 104 61 104 52C104 40 120 22 120 22Z" fill="#F5A623"/>
    <path d="M120 34C120 34 128 45 128 53C128 58 124 62 120 62C116 62 112 58 112 53C112 45 120 34 120 34Z" fill="#38BDF8"/>
    <!-- Burner Tube & Base -->
    <rect x="114" y="68" width="12" height="56" rx="2" fill="#003087"/>
    <rect x="111" y="110" width="18" height="10" rx="2" fill="#F5A623"/>
    <rect x="94" y="124" width="52" height="12" rx="4" fill="#C8102E"/>
  </svg>`,

  'LG-EQ-004': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="12" fill="#F8FAFC"/>
    <ellipse cx="120" cy="142" rx="66" ry="7" fill="#CBD5E1"/>
    <!-- Draft Shield Chamber -->
    <rect x="74" y="26" width="92" height="72" rx="4" fill="#E0F2FE" fill-opacity="0.6" stroke="#003087" stroke-width="2.5"/>
    <!-- Weighing Pan -->
    <rect x="94" y="78" width="52" height="5" rx="2" fill="#64748B"/>
    <rect x="116" y="83" width="8" height="15" fill="#475569"/>
    <!-- Balance Base & Digital LCD -->
    <rect x="64" y="98" width="112" height="38" rx="6" fill="#003087"/>
    <rect x="78" y="108" width="60" height="18" rx="3" fill="#0F172A"/>
    <text x="108" y="121" text-anchor="middle" fill="#22C55E" font-family="monospace" font-weight="bold" font-size="11">12.450 g</text>
    <circle cx="154" cy="117" r="5" fill="#C8102E"/>
    <circle cx="166" cy="117" r="5" fill="#F5A623"/>
  </svg>`,

  'LG-EQ-005': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="12" fill="#F8FAFC"/>
    <ellipse cx="120" cy="142" rx="62" ry="7" fill="#CBD5E1"/>
    <!-- Stand Base & Rod -->
    <rect x="70" y="130" width="96" height="8" rx="3" fill="#1E293B"/>
    <rect x="86" y="18" width="6" height="112" fill="#475569"/>
    <!-- Clamp -->
    <rect x="86" y="52" width="44" height="6" rx="2" fill="#003087"/>
    <!-- Burette Tube -->
    <rect x="126" y="16" width="8" height="84" rx="2" fill="#E0F2FE" stroke="#003087" stroke-width="2"/>
    <rect x="122" y="86" width="16" height="5" rx="2" fill="#C8102E"/>
    <!-- Receiving Flask -->
    <path d="M124 106H136V114L146 128H114L124 114V106Z" fill="#FCE7F3" stroke="#C8102E" stroke-width="2"/>
  </svg>`,

  'LG-EQ-006': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="12" fill="#F8FAFC"/>
    <ellipse cx="120" cy="142" rx="58" ry="7" fill="#CBD5E1"/>
    <!-- Handheld Meter -->
    <rect x="68" y="30" width="58" height="102" rx="10" fill="#003087"/>
    <rect x="76" y="42" width="42" height="34" rx="4" fill="#DCFCE7"/>
    <text x="97" y="62" text-anchor="middle" fill="#065F46" font-family="monospace" font-weight="bold" font-size="12">pH 7.02</text>
    <circle cx="88" cy="94" r="6" fill="#F5A623"/>
    <circle cx="106" cy="94" r="6" fill="#C8102E"/>
    <!-- Probe Cable & Electrode -->
    <path d="M126 48C148 48 158 32 158 56V116" stroke="#1E293B" stroke-width="4" stroke-linecap="round"/>
    <rect x="152" y="64" width="12" height="52" rx="3" fill="#38BDF8" stroke="#003087" stroke-width="2"/>
    <circle cx="158" cy="120" r="6" fill="#C8102E"/>
  </svg>`,

  'LG-EQ-007': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="12" fill="#F8FAFC"/>
    <ellipse cx="120" cy="142" rx="68" ry="7" fill="#CBD5E1"/>
    <!-- Centrifuge Body -->
    <rect x="64" y="54" width="112" height="80" rx="12" fill="#FFFFFF" stroke="#003087" stroke-width="3"/>
    <ellipse cx="120" cy="54" rx="52" ry="14" fill="#E0F2FE" stroke="#003087" stroke-width="3"/>
    <circle cx="120" cy="54" r="16" fill="#003087"/>
    <rect x="82" y="96" width="76" height="24" rx="4" fill="#0F172A"/>
    <text x="120" y="112" text-anchor="middle" fill="#38BDF8" font-family="monospace" font-weight="bold" font-size="11">4000 RPM</text>
  </svg>`,

  'LG-EQ-008': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="12" fill="#F8FAFC"/>
    <ellipse cx="120" cy="142" rx="58" ry="7" fill="#CBD5E1"/>
    <!-- Calorimeter Cup -->
    <rect x="80" y="56" width="80" height="78" rx="6" fill="#E2E8F0" stroke="#334155" stroke-width="3"/>
    <rect x="74" y="48" width="92" height="10" rx="3" fill="#003087"/>
    <!-- Thermometer -->
    <rect x="116" y="16" width="8" height="96" rx="4" fill="#FFFFFF" stroke="#1E293B" stroke-width="2"/>
    <rect x="118" y="46" width="4" height="66" fill="#C8102E"/>
    <circle cx="120" cy="114" r="7" fill="#C8102E"/>
  </svg>`,

  'LG-EQ-009': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="12" fill="#F8FAFC"/>
    <!-- Dissecting Pan -->
    <rect x="46" y="34" width="148" height="96" rx="10" fill="#CBD5E1" stroke="#334155" stroke-width="3"/>
    <rect x="56" y="44" width="128" height="76" rx="6" fill="#1E293B"/>
    <!-- Instruments -->
    <line x1="76" y1="62" x2="136" y2="102" stroke="#F8FAFC" stroke-width="4" stroke-linecap="round"/>
    <line x1="136" y1="62" x2="76" y2="102" stroke="#F5A623" stroke-width="4" stroke-linecap="round"/>
    <circle cx="156" cy="82" r="16" fill="#E0F2FE" stroke="#003087" stroke-width="3"/>
  </svg>`,

  'LG-EQ-010': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="12" fill="#F8FAFC"/>
    <ellipse cx="120" cy="142" rx="64" ry="7" fill="#CBD5E1"/>
    <!-- Safety Goggles -->
    <rect x="54" y="48" width="132" height="48" rx="18" fill="#E0F2FE" stroke="#003087" stroke-width="4"/>
    <path d="M110 96C114 86 126 86 130 96" stroke="#003087" stroke-width="4" stroke-linecap="round"/>
    <rect x="68" y="60" width="42" height="22" rx="8" fill="#38BDF8" fill-opacity="0.45"/>
    <rect x="130" y="60" width="42" height="22" rx="8" fill="#38BDF8" fill-opacity="0.45"/>
    <!-- Shield Badge -->
    <circle cx="120" cy="120" r="14" fill="#16A34A"/>
    <path d="M114 120L118 124L127 115" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
};

export function getEquipmentImageDataUrl(qrCode: string): string {
  const svg = EQUIPMENT_SVG_MAP[qrCode] || EQUIPMENT_SVG_MAP['LG-EQ-002'];
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
