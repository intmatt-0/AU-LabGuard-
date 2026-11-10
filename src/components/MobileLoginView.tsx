/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  UserCheck,
  ShoppingBasket,
  ArrowLeft,
  ShieldCheck,
  LayoutDashboard,
} from 'lucide-react';
import type {
  BasketItem,
  CheckoutSession,
  Equipment,
  LabStudentPreset,
  StudentTransactionLog,
} from '../types';

interface MobileLoginViewProps {
  sessionToken: string;
  activeSession: CheckoutSession | null;
  fallbackBasket: BasketItem[];
  equipment: Equipment[];
  studentPresets: LabStudentPreset[];
  onCompletedTransaction: (tx: StudentTransactionLog) => void;
  onNavigateToKiosk: () => void;
  onNavigateToAdmin: () => void;
}

const GRADE_SECTIONS = [
  'Grade 12 - STEM 1',
  'Grade 12 - STEM 2',
  'Grade 11 - STEM 1',
  'Grade 11 - STEM 2',
  'Grade 12 - ABM 1',
  'Grade 12 - HUMSS 1',
  'Grade 12 - GAS 1',
  'AU-JRC Science Faculty',
];

export const MobileLoginView: React.FC<MobileLoginViewProps> = ({
  sessionToken,
  activeSession,
  fallbackBasket,
  equipment,
  studentPresets,
  onCompletedTransaction,
  onNavigateToKiosk,
  onNavigateToAdmin,
}) => {
  const [loadedSession, setLoadedSession] = useState<CheckoutSession | null>(activeSession);
  const [loadingSession, setLoadingSession] = useState(false);

  // Student Information Form fields
  const [studentName, setStudentName] = useState('');
  const [studentIdLrn, setStudentIdLrn] = useState('');
  const [gradeSection, setGradeSection] = useState('Grade 12 - STEM 1');
  const [schoolEmail, setSchoolEmail] = useState('');
  const [subjectActivity, setSubjectActivity] = useState(
    'General Chemistry 2 — Laboratory Experiment'
  );
  const [teacherName, setTeacherName] = useState('Ms. Lara Marie Agustin Puertollano');
  const [expectedHours, setExpectedHours] = useState<number>(2);
  const [checkedPrerequisites, setCheckedPrerequisites] = useState<boolean>(true);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loggedRecord, setLoggedRecord] = useState<StudentTransactionLog | null>(null);

  // Fetch session from backend if opened via QR URL /student/checkout/:token
  useEffect(() => {
    if (activeSession) {
      setLoadedSession(activeSession);
      return;
    }
    if (!sessionToken) return;

    setLoadingSession(true);
    fetch(`/api/kiosk/checkout-session/${sessionToken}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.session) {
          setLoadedSession(d.session);
          if (d.session.status === 'completed' && d.session.completed_transaction) {
            setLoggedRecord(d.session.completed_transaction);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingSession(false));
  }, [sessionToken, activeSession]);

  // Determine the basket items to log
  const effectiveBasket: BasketItem[] = useMemo(() => {
    if (loadedSession && loadedSession.basket_items.length > 0) {
      return loadedSession.basket_items;
    }
    if (fallbackBasket.length > 0) {
      return fallbackBasket;
    }
    // If opened standalone for demo without picking items yet, default to first available item
    const firstAvail = equipment.find((e) => e.available_qty > 0);
    if (!firstAvail) return [];
    return [
      {
        equipment_id: firstAvail.id,
        qr_code: firstAvail.qr_code,
        name: firstAvail.name,
        category: firstAvail.category,
        storage_compartment: firstAvail.storage_compartment,
        quantity: 1,
        unit: firstAvail.unit,
        safety_level: firstAvail.safety_level,
        prerequisites: firstAvail.prerequisites,
      },
    ];
  }, [loadedSession, fallbackBasket, equipment]);

  const safetyRequirements = useMemo(() => {
    const reqs = new Set<string>([
      'Wearing buttoned laboratory gown and closed-toe shoes',
      'Inspected apparatus condition and QR tags prior to use',
    ]);
    for (const item of effectiveBasket) {
      for (const p of item.prerequisites) {
        reqs.add(p);
      }
    }
    return Array.from(reqs);
  }, [effectiveBasket]);

  const handleApplyPreset = (preset: LabStudentPreset) => {
    setStudentName(preset.student_name);
    setStudentIdLrn(preset.student_id_lrn);
    setGradeSection(preset.grade_section);
    setSchoolEmail(preset.school_email);
    setSubjectActivity(preset.default_subject);
    setTeacherName(preset.default_teacher);
    setErrorMsg(null);
  };

  const handleSubmitStudentInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!checkedPrerequisites) {
      setErrorMsg('Please confirm the laboratory safety prerequisites before logging in.');
      return;
    }

    setSubmitting(true);
    try {
      const tokenToUse = loadedSession?.session_token || sessionToken || 'DIRECT-CHECKOUT';
      const res = await fetch(`/api/kiosk/checkout-session/${tokenToUse}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: studentName,
          student_id_lrn: studentIdLrn,
          grade_section: gradeSection,
          school_email: schoolEmail,
          subject_activity: subjectActivity,
          teacher_name: teacherName,
          expected_return_hours: expectedHours,
          basket_items: effectiveBasket,
          safety_prerequisites_checked: safetyRequirements.slice(0, 4),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.transaction) {
        setErrorMsg(data.error || 'Failed to record student checkout information.');
      } else {
        setLoggedRecord(data.transaction);
        onCompletedTransaction(data.transaction);
      }
    } catch {
      setErrorMsg('Network error while submitting student information to database.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingSession) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 text-center">
        <p className="font-mono text-sm text-slate-600">
          Loading Checkout QR Session ({sessionToken})...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Top Breadcrumb & Back Link */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-[#003087] font-semibold">
            Step 3 of 3 · QR-Directed Student Registration & Laboratory Log-In
          </p>
          <h1 className="text-2xl font-bold text-slate-900 font-heading mt-0.5">
            Student Information & Equipment Accountability Form
          </h1>
        </div>

        <button
          type="button"
          onClick={onNavigateToKiosk}
          className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Inventory Kiosk
        </button>
      </div>

      {/* =================================================================== */}
      {/* SUCCESS STATE: LOGGED INTO DATABASE & VISIBLE IN ADMIN DASHBOARD    */}
      {/* =================================================================== */}
      {loggedRecord ? (
        <div className="mt-6 bg-white border border-emerald-300 rounded-xl p-6 space-y-5">
          <div className="flex items-start gap-3.5">
            <CheckCircle2 className="w-7 h-7 text-[#16A34A] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-mono font-bold uppercase text-[#16A34A]">
                Database Record Saved · Transaction {loggedRecord.transaction_code}
              </p>
              <h2 className="text-xl font-bold text-slate-900 font-heading mt-0.5">
                Student Log-In & Equipment Checkout Confirmed
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Your student information and borrowed equipment basket have been logged into the LabGuard+ central database and are now displayed on the Admin Dashboard.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div className="space-y-1">
              <p className="text-slate-500">Student Name & LRN/ID</p>
              <p className="font-bold text-slate-900">
                {loggedRecord.student_name} · <span className="font-mono">{loggedRecord.student_id_lrn}</span>
              </p>
              <p className="text-slate-600">{loggedRecord.grade_section}</p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-500">Subject & Supervising Teacher</p>
              <p className="font-bold text-slate-900">{loggedRecord.subject_activity}</p>
              <p className="text-slate-600">{loggedRecord.teacher_name}</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-800">
              Logged Equipment Items ({loggedRecord.total_items_count} units):
            </p>
            <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
              {loggedRecord.items.map((item, idx) => (
                <div
                  key={idx}
                  className="px-4 py-2.5 bg-white flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900">{item.name}</span>
                    <span className="text-slate-500 font-mono ml-2">
                      ({item.qr_code} · {item.storage_compartment})
                    </span>
                  </div>
                  <span className="font-mono font-bold tabular-nums text-[#003087]">
                    Qty: {item.quantity} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={onNavigateToKiosk}
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
            >
              Return to Kiosk Inventory
            </button>
            <button
              type="button"
              onClick={onNavigateToAdmin}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-[#003087] hover:bg-[#002466] rounded-lg flex items-center gap-2 cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4" />
              View Logged Record in Admin Dashboard
            </button>
          </div>
        </div>
      ) : (
        /* =================================================================== */
        /* FORM STATE: INPUT STUDENT INFORMATION TO LOG INTO DATABASE          */
        /* =================================================================== */
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 7 Columns: Student Registration Form */}
          <form
            onSubmit={handleSubmitStudentInfo}
            className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5"
          >
            <div className="border-b border-slate-200 pb-3.5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[#003087]" />
                  Student Laboratory Log-In Details
                </h2>
                <span className="font-mono text-xs text-slate-500">
                  {loadedSession?.session_token || 'QR-SESSION'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Fill in your details below or tap a quick-fill student profile to test database logging.
              </p>
            </div>

            {/* Quick-Fill AU-JRC Researcher / Student Profiles */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-slate-600">
                Quick-Fill AU-JRC Student Profile (1-Click Test):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {studentPresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="px-2.5 py-1.5 text-xs font-medium bg-slate-100 hover:bg-[#003087] hover:text-white text-slate-700 rounded-md transition-colors cursor-pointer"
                  >
                    {preset.student_name.split(' ')[0]} {preset.student_name.split(' ').slice(-1)[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Student Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. One Enrique Sebastian G. Abalos"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#003087] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Student ID / LRN Number *
                </label>
                <input
                  type="text"
                  required
                  value={studentIdLrn}
                  onChange={(e) => setStudentIdLrn(e.target.value)}
                  placeholder="e.g. AUJRC-2026-0101"
                  className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#003087] focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Grade Level, Strand & Section *
                </label>
                <select
                  value={gradeSection}
                  onChange={(e) => setGradeSection(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#003087] focus:bg-white"
                >
                  {GRADE_SECTIONS.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  School Email (@arellano.edu.ph)
                </label>
                <input
                  type="email"
                  value={schoolEmail}
                  onChange={(e) => setSchoolEmail(e.target.value)}
                  placeholder="student.name@arellano.edu.ph"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#003087] focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Science Subject & Lab Activity *
                </label>
                <input
                  type="text"
                  required
                  value={subjectActivity}
                  onChange={(e) => setSubjectActivity(e.target.value)}
                  placeholder="e.g. General Chemistry 2 — Titration"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#003087] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Supervising Science Teacher *
                </label>
                <input
                  type="text"
                  required
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="Ms. Lara Marie Agustin Puertollano"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#003087] focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Expected Laboratory Session Duration
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '1 Hour Period', hours: 1 },
                  { label: '2 Hours Lab', hours: 2 },
                  { label: '4 Hours / Half Day', hours: 4 },
                ].map((opt) => (
                  <button
                    key={opt.hours}
                    type="button"
                    onClick={() => setExpectedHours(opt.hours)}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border cursor-pointer ${
                      expectedHours === opt.hours
                        ? 'bg-[#003087] text-white border-[#003087]'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mandatory Safety Prerequisite Checkbox */}
            <label className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={checkedPrerequisites}
                onChange={(e) => setCheckedPrerequisites(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#003087] rounded"
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                <strong className="text-slate-900">
                  AU-JRC Laboratory Safety & Accountability Pledge:
                </strong>{' '}
                I confirm that I am wearing the required laboratory PPE, have inspected the borrowed equipment, and accept responsibility for returning all items in good condition.
              </span>
            </label>

            {errorMsg && (
              <p className="text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || effectiveBasket.length === 0}
              className="w-full py-3.5 px-5 bg-[#C8102E] hover:bg-[#a50d25] disabled:bg-slate-300 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {submitting
                ? 'Logging Student & Equipment to Database...'
                : 'Submit Student Log-In & Complete Checkout'}
            </button>
          </form>

          {/* Right 5 Columns: Checked-Out Basket & Safety Prerequisites Summary */}
          <aside className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 font-heading flex items-center gap-2">
                <ShoppingBasket className="w-4 h-4 text-[#003087]" />
                Checked-Out Basket Summary
              </h3>
              <span className="font-mono text-xs font-bold tabular-nums text-[#003087]">
                {effectiveBasket.reduce((acc, i) => acc + i.quantity, 0)} Units
              </span>
            </div>

            <div className="space-y-2.5">
              {effectiveBasket.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg flex items-start justify-between gap-3"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900">{item.name}</p>
                    <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                      {item.qr_code} · {item.storage_compartment}
                    </p>
                  </div>
                  <span className="font-mono text-xs font-bold tabular-nums text-[#003087] shrink-0">
                    {item.quantity} × {item.unit}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 space-y-2">
              <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
                Research Safety Prerequisites for This Basket
              </p>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {safetyRequirements.map((req, idx) => (
                  <li key={idx} className="leading-snug">
                    • {req}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
