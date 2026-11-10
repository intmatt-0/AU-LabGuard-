/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import type { Equipment, StudentTransactionLog } from '../types';

export interface PdfGenerationOptions {
  mode: 'both' | 'poster' | 'pubmat';
  equipment: Equipment[];
  transactions: StudentTransactionLog[];
}

function drawExhibitionPosterPage(
  doc: jsPDF,
  equipment: Equipment[],
  transactions: StudentTransactionLog[]
) {
  const totalAvail = equipment.reduce((sum, e) => sum + e.available_qty, 0);
  const totalCap = equipment.reduce((sum, e) => sum + e.total_qty, 0);
  const activeCount = transactions.filter((b) => b.status === 'Borrowed / In Lab').length;

  // Page Background
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, 297, 210, 'F');

  // Top Header Banner (AU Blue)
  doc.setFillColor(0, 48, 135);
  doc.rect(0, 0, 297, 34, 'F');
  doc.setFillColor(200, 16, 46);
  doc.rect(0, 34, 297, 2, 'F');

  // AU Seal Circle
  doc.setFillColor(245, 166, 35);
  doc.circle(18, 17, 9, 'F');
  doc.setFillColor(0, 48, 135);
  doc.circle(18, 17, 7.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('AU', 18, 16.5, { align: 'center' });
  doc.setFontSize(5);
  doc.text('1938', 18, 20.5, { align: 'center' });

  // Institutional Title
  doc.setTextColor(245, 166, 35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(
    'ARELLANO UNIVERSITY - JOSE RIZAL CAMPUS · SENIOR HIGH SCHOOL PRACTICAL RESEARCH II',
    31,
    10
  );

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('LabGuard+: Smart Science Laboratory Safety Station', 31, 18.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(219, 234, 254);
  doc.text(
    'QR Code Equipment Tracking, QR-Based User Log-In Monitoring, and LED Safety Status Display',
    31,
    25
  );

  // Right Header Metrics
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(232, 7, 55, 20, 2, 2, 'F');
  doc.setTextColor(0, 48, 135);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('AU-JRC SCIENCE LAB', 259.5, 13, { align: 'center' });
  doc.setFontSize(7);
  doc.setTextColor(22, 163, 74);
  doc.text(`Avail Stock: ${totalAvail}/${totalCap} Units`, 259.5, 18, { align: 'center' });
  doc.setTextColor(100, 116, 139);
  doc.text(`Adviser: Ms. L. M. A. Puertollano`, 259.5, 23, { align: 'center' });

  // 3-Step Input-Process-Output Workflow Strip
  const steps = [
    {
      num: 'STEP 01 · KIOSK INVENTORY',
      title: 'Pick Science Equipment Basket',
      desc: 'Students browse apparatus on the kiosk, review safety prerequisites, and checkout their basket.',
      color: [0, 48, 135] as [number, number, number],
    },
    {
      num: 'STEP 02 · QR STUDENT LOG-IN',
      title: 'Scan QR & Input Student Info',
      desc: 'Scanning the Checkout QR directs students to input Name, LRN, Strand/Section, and Teacher.',
      color: [200, 16, 46] as [number, number, number],
    },
    {
      num: 'STEP 03 · DATABASE & LED STATUS',
      title: 'Admin Dashboard & LED Display',
      desc: 'Logs student & items into the database, updates Admin view, and sets LED Safety Status.',
      color: [22, 163, 74] as [number, number, number],
    },
  ];

  steps.forEach((step, idx) => {
    const x = 10 + idx * 94;
    const y = 40;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, 89, 22, 2, 2, 'FD');

    doc.setFillColor(step.color[0], step.color[1], step.color[2]);
    doc.rect(x, y, 3, 22, 'F');

    doc.setTextColor(step.color[0], step.color[1], step.color[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text(step.num, x + 6, y + 6);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8.5);
    doc.text(step.title, x + 6, y + 11.5);

    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    const lines = doc.splitTextToSize(step.desc, 79);
    doc.text(lines, x + 6, y + 16);
  });

  // =========================================================================
  // 3 SOFTWARE SNAPSHOTS ROW (y = 66 to 184)
  // =========================================================================
  const snapY = 66;
  const snapH = 118;

  // SNAPSHOT 1: KIOSK INVENTORY & BASKET PICKER
  const s1X = 10;
  const s1W = 90;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(s1X, snapY, s1W, snapH, 3, 3, 'FD');
  doc.setFillColor(0, 48, 135);
  doc.rect(s1X, snapY, s1W, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('SNAPSHOT A · KIOSK INVENTORY PICKER', s1X + 4, snapY + 6.5);

  equipment.slice(0, 4).forEach((eq, i) => {
    const cy = snapY + 14 + i * 21;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(s1X + 4, cy, s1W - 8, 18, 1.5, 1.5, 'FD');
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(eq.name.slice(0, 36), s1X + 7, cy + 6);
    doc.setTextColor(0, 48, 135);
    doc.setFontSize(6);
    doc.text(
      `${eq.qr_code} · ${eq.storage_compartment} · ${eq.available_qty}/${eq.total_qty} ${eq.unit}s`,
      s1X + 7,
      cy + 11.5
    );
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(`Prerequisite: ${eq.prerequisites[0]?.slice(0, 42) || 'PPE Required'}`, s1X + 7, cy + 15.5);
  });

  doc.setFillColor(200, 16, 46);
  doc.roundedRect(s1X + 4, snapY + 101, s1W - 8, 12, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('CHECKOUT BASKET & GENERATE QR CODE', s1X + s1W / 2, snapY + 108.5, {
    align: 'center',
  });

  // SNAPSHOT 2: QR-DIRECTED STUDENT INFORMATION PAGE
  const s2X = 104;
  const s2W = 89;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(s2X, snapY, s2W, snapH, 3, 3, 'FD');
  doc.setFillColor(200, 16, 46);
  doc.rect(s2X, snapY, s2W, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('SNAPSHOT B · STUDENT QR LOG-IN FORM', s2X + 4, snapY + 6.5);

  const formFields = [
    ['Student Full Name', 'One Enrique Sebastian G. Abalos'],
    ['Student ID / LRN', 'AUJRC-2026-0101'],
    ['Grade & Strand', 'Grade 12 - STEM 1 (AU Jose Rizal Campus)'],
    ['Subject & Activity', 'General Biology 1 — Microscopy Lab'],
    ['Supervising Teacher', 'Ms. Lara Marie Agustin Puertollano'],
    ['Checked-Out Basket', '2x Compound Light Microscope (LG-EQ-001)'],
  ];

  formFields.forEach(([label, val], idx) => {
    const fy = snapY + 14 + idx * 14;
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    doc.text(label.toUpperCase(), s2X + 5, fy + 3.5);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(s2X + 5, fy + 5, s2W - 10, 7.5, 1, 1, 'FD');
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text(val, s2X + 7, fy + 10);
  });

  doc.setFillColor(0, 48, 135);
  doc.roundedRect(s2X + 5, snapY + 101, s2W - 10, 12, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('SUBMIT STUDENT INFO TO DATABASE', s2X + s2W / 2, snapY + 108.5, {
    align: 'center',
  });

  // SNAPSHOT 3: ADMIN & LAB PERSONNEL DASHBOARD
  const s3X = 197;
  const s3W = 90;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(s3X, snapY, s3W, snapH, 3, 3, 'FD');
  doc.setFillColor(15, 23, 42);
  doc.rect(s3X, snapY, s3W, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('SNAPSHOT C · ADMIN DATABASE & LED STATUS', s3X + 4, snapY + 6.5);

  // LED Status Strip inside Snapshot C
  doc.setFillColor(22, 163, 74);
  doc.roundedRect(s3X + 4, snapY + 14, s3W - 8, 12, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6.5);
  doc.text('LED DISPLAY: GREEN (SAFE) · YELLOW (CAUTION) · RED (UNSAFE)', s3X + 7, snapY + 21.5);

  // Logged Student Transactions inside Snapshot C
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(7);
  doc.text(`Logged Student Transactions (${transactions.length} Total · ${activeCount} Active):`, s3X + 4, snapY + 33);

  transactions.slice(0, 4).forEach((tx, idx) => {
    const ty = snapY + 36 + idx * 19;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(s3X + 4, ty, s3W - 8, 16.5, 1.5, 1.5, 'FD');
    doc.setTextColor(0, 48, 135);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text(`${tx.transaction_code} · ${tx.student_name.slice(0, 26)}`, s3X + 6, ty + 5.5);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.text(`${tx.grade_section} · ${tx.items[0]?.name.slice(0, 28) || 'Science Apparatus'}`, s3X + 6, ty + 10.5);
    doc.setTextColor(tx.status === 'Overdue' ? 200 : 22, tx.status === 'Overdue' ? 16 : 163, tx.status === 'Overdue' ? 46 : 74);
    doc.setFont('helvetica', 'bold');
    doc.text(`Status: ${tx.status}`, s3X + 6, ty + 14.5);
  });

  // Footer
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 190, 297, 20, 'F');
  doc.setTextColor(245, 166, 35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(
    'GROUP 1 RESEARCHERS · ARELLANO UNIVERSITY JOSE RIZAL CAMPUS (MARCH 2026)',
    10,
    198
  );
  doc.setTextColor(203, 213, 225);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(
    'Abalos · Contreras · Dones · Macalong · Marcos · Martinez · Metilla · Miranda · Mocorro · Pangilinan · Ramos · Raquiza · Redulla · Revellame · Rezaga · Sales · San Pedro · Villanueva',
    10,
    204
  );
}

function drawPortraitPubmatPage(
  doc: jsPDF,
  equipment: Equipment[],
  transactions: StudentTransactionLog[]
) {
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 210, 297, 'F');

  // Top Header
  doc.setFillColor(0, 48, 135);
  doc.rect(0, 0, 210, 38, 'F');
  doc.setFillColor(200, 16, 46);
  doc.rect(0, 38, 210, 2.5, 'F');

  doc.setTextColor(245, 166, 35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('ARELLANO UNIVERSITY - JOSE RIZAL CAMPUS · SENIOR HIGH SCHOOL', 14, 13);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(17);
  doc.text('LabGuard+ System Architecture & Inventory Sheet', 14, 23);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(219, 234, 254);
  doc.text(
    'QR Equipment Tracking · QR Student Log-In Monitoring · LED Safety Status Display',
    14,
    31
  );

  // Section 1: Three Integrated Research Features
  doc.setTextColor(0, 48, 135);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('1. THREE INTEGRATED FUNCTIONS OF LABGUARD+ (AU-JRC RESEARCH SCOPE)', 14, 50);

  const pillars = [
    [
      '1. QR Code Equipment Tracking',
      'Facilitates identification, availability monitoring, and condition logging of science laboratory materials bound to registered QR codes (LG-EQ-001 to LG-EQ-010).',
    ],
    [
      '2. QR-Based User Log-In Monitoring',
      'After checking out an equipment basket on the kiosk, students scan the Checkout QR code to input their Name, LRN, Strand/Section, and Teacher into the central database.',
    ],
    [
      '3. LED Safety Status Display',
      'Provides an immediate visual indication of laboratory safety status: GREEN represents SAFE, YELLOW represents CAUTION (PPE required), and RED represents UNSAFE.',
    ],
  ];

  pillars.forEach(([title, desc], idx) => {
    const py = 54 + idx * 20;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, py, 182, 17, 2, 2, 'FD');
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(title, 18, py + 6.5);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    const lines = doc.splitTextToSize(desc, 174);
    doc.text(lines, 18, py + 11.5);
  });

  // Section 2: Registered Science Laboratory Equipment Table
  doc.setTextColor(0, 48, 135);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('2. REGISTERED SCIENCE LABORATORY EQUIPMENT & SAFETY PREREQUISITES', 14, 122);

  doc.setFillColor(0, 48, 135);
  doc.rect(14, 126, 182, 7.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6.8);
  doc.text('QR CODE', 17, 131);
  doc.text('COMPARTMENT', 38, 131);
  doc.text('SCIENCE APPARATUS NAME', 68, 131);
  doc.text('SAFETY', 148, 131);
  doc.text('AVAIL / TOTAL', 170, 131);

  equipment.slice(0, 10).forEach((eq, idx) => {
    const ry = 133.5 + idx * 12.5;
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, ry, 182, 12.5, 'FD');

    doc.setTextColor(0, 48, 135);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.text(eq.qr_code, 17, ry + 5);

    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.text(eq.storage_compartment, 38, ry + 5);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(eq.name.slice(0, 44), 68, ry + 5);

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.8);
    doc.text(`Prerequisite: ${eq.prerequisites[0]?.slice(0, 62) || ''}`, 68, ry + 9.8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    if (eq.safety_level === 'CAUTION') {
      doc.setTextColor(217, 119, 6);
      doc.text('CAUTION', 148, ry + 6.5);
    } else {
      doc.setTextColor(22, 163, 74);
      doc.text('SAFE', 148, ry + 6.5);
    }

    doc.setTextColor(15, 23, 42);
    doc.text(`${eq.available_qty} / ${eq.total_qty} ${eq.unit}s`, 170, ry + 6.5);
  });

  // Footer
  doc.setFillColor(0, 48, 135);
  doc.rect(0, 275, 210, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(
    `Arellano University – Jose Rizal Campus · LabGuard+ (${transactions.length} Logged Sessions)`,
    14,
    284
  );
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(219, 234, 254);
  doc.text(
    'Practical Research II · Research Adviser: Ms. Lara Marie Agustin Puertollano · March 2026',
    14,
    290
  );
}

export function createLabGuardPdfDocument(options: PdfGenerationOptions): jsPDF {
  const { mode, equipment, transactions } = options;

  if (mode === 'poster') {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    drawExhibitionPosterPage(doc, equipment, transactions);
    return doc;
  }

  if (mode === 'pubmat') {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    drawPortraitPubmatPage(doc, equipment, transactions);
    return doc;
  }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  drawExhibitionPosterPage(doc, equipment, transactions);
  doc.addPage('a4', 'portrait');
  drawPortraitPubmatPage(doc, equipment, transactions);
  return doc;
}

export function downloadLabGuardPdf(options: PdfGenerationOptions): string {
  const doc = createLabGuardPdfDocument(options);
  const filename =
    options.mode === 'poster'
      ? 'LabGuard_Plus_AU_JRC_Poster_Landscape.pdf'
      : options.mode === 'pubmat'
      ? 'LabGuard_Plus_AU_JRC_Pubmat_Portrait.pdf'
      : 'LabGuard_Plus_AU_JRC_Poster_and_Pubmat.pdf';

  doc.save(filename);
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
}
