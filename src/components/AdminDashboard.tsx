/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  Plus,
  RotateCcw,
  QrCode,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import QRCode from 'qrcode';
import type {
  Equipment,
  EquipmentCategory,
  StudentTransactionLog,
  SafetyStatusState,
  SafetyStatusLevel,
} from '../types';
import { SAFETY_PRESET_MESSAGES } from '../data/seedData';

interface AdminDashboardProps {
  equipment: Equipment[];
  transactions: StudentTransactionLog[];
  safetyStatus: SafetyStatusState;
  onRefreshData: () => void;
  onResetSystem: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  equipment,
  transactions,
  safetyStatus,
  onRefreshData,
  onResetSystem,
}) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'inventory' | 'safety'>('logs');

  // Student Logs filters
  const [logSearch, setLogSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'Borrowed / In Lab' | 'Overdue' | 'Returned / Logged Out'
  >('ALL');

  // Equipment Add Modal state
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [newEqName, setNewEqName] = useState('');
  const [newEqQr, setNewEqQr] = useState('');
  const [newEqCategory, setNewEqCategory] = useState<EquipmentCategory>('Glassware & Measuring');
  const [newEqCompartment, setNewEqCompartment] = useState('4th - 3rd Section');
  const [newEqQty, setNewEqQty] = useState(5);
  const [newEqUnit, setNewEqUnit] = useState('set');
  const [newEqSafety, setNewEqSafety] = useState<'SAFE' | 'CAUTION'>('SAFE');
  const [newEqPrereq, setNewEqPrereq] = useState(
    'Wear buttoned laboratory gown and chemical splash goggles'
  );

  // QR Tag Preview Modal
  const [qrPreviewItem, setQrPreviewItem] = useState<{
    item: Equipment;
    dataUrl: string;
  } | null>(null);

  // Safety Status Controller state
  const [customSafetyMsg, setCustomSafetyMsg] = useState(safetyStatus.message);
  const [updatedByInput, setUpdatedByInput] = useState(
    'Ms. Lara Marie Agustin Puertollano (Lab Coordinator)'
  );
  const [savingSafety, setSavingSafety] = useState(false);

  const filteredLogs = useMemo(() => {
    return transactions.filter((tx) => {
      if (statusFilter !== 'ALL' && tx.status !== statusFilter) return false;
      if (logSearch.trim()) {
        const q = logSearch.toLowerCase();
        const matchItems = tx.items.some(
          (i) =>
            i.name.toLowerCase().includes(q) || i.qr_code.toLowerCase().includes(q)
        );
        return (
          tx.student_name.toLowerCase().includes(q) ||
          tx.student_id_lrn.toLowerCase().includes(q) ||
          tx.grade_section.toLowerCase().includes(q) ||
          tx.transaction_code.toLowerCase().includes(q) ||
          tx.teacher_name.toLowerCase().includes(q) ||
          tx.subject_activity.toLowerCase().includes(q) ||
          matchItems
        );
      }
      return true;
    });
  }, [transactions, statusFilter, logSearch]);

  const activeInLabCount = useMemo(
    () => transactions.filter((t) => t.status === 'Borrowed / In Lab').length,
    [transactions]
  );

  const overdueCount = useMemo(
    () => transactions.filter((t) => t.status === 'Overdue').length,
    [transactions]
  );

  const totalUnitsAvailable = useMemo(
    () => equipment.reduce((sum, e) => sum + e.available_qty, 0),
    [equipment]
  );

  const totalUnitsCapacity = useMemo(
    () => equipment.reduce((sum, e) => sum + e.total_qty, 0),
    [equipment]
  );

  const handleQuickMarkReturned = async (tx: StudentTransactionLog) => {
    await fetch('/api/kiosk/return', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transaction_id: tx.id,
        return_condition: 'Good',
        return_notes: 'Verified and checked in by Lab Personnel via Admin Dashboard.',
      }),
    });
    onRefreshData();
  };

  const formatCsvDate = (val?: string) => {
    if (!val) return 'N/A';
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const formatCsvTime = (val?: string) => {
    if (!val) return 'N/A';
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatCsvDateTime = (val?: string) => {
    if (!val) return 'N/A';
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const t = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${y}-${m}-${day} ${t}`;
  };

  const handleExportLogsCsv = () => {
    const now = new Date();
    const generatedDateStr = now.toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const generatedTimeStr = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    const targetList: StudentTransactionLog[] = filteredLogs.length > 0 ? filteredLogs : transactions;
    const totalLogs = targetList.length;
    const activeCount = targetList.filter((t: StudentTransactionLog) => t.status === 'Borrowed / In Lab').length;
    const returnedCount = targetList.filter((t: StudentTransactionLog) => t.status === 'Returned / Logged Out').length;
    const overdueCount = targetList.filter((t: StudentTransactionLog) => t.status === 'Overdue').length;
    const totalUnitsOnLoan = targetList.reduce(
      (sum: number, t: StudentTransactionLog) =>
        sum + (t.total_items_count || (t.items || []).reduce((s: number, i: { quantity?: number }) => s + (i.quantity || 1), 0)),
      0
    );

    // Institutional Report Header Block (Formatted for Excel/Google Sheets)
    const headerBlock: string[][] = [
      ['ARELLANO UNIVERSITY - JOSE RIZAL CAMPUS'],
      ['Science & Technology Laboratory Management System (LabGuard+)'],
      ['OFFICIAL STUDENT EQUIPMENT BORROWING & ACCOUNTABILITY LOG REPORT'],
      [`Report Generated: ${generatedDateStr} at ${generatedTimeStr}`],
      ['Supervising Faculty / Laboratory In-Charge: Ms. Lara Marie Agustin Puertollano'],
      [`Summary Metrics: Total Records: ${totalLogs} | Active In-Lab: ${activeCount} | Completed Returns: ${returnedCount} | Overdue Returns: ${overdueCount} | Total Units Borrowed: ${totalUnitsOnLoan}`],
      [], // Empty row separator before table headers
    ];

    // Column Headers (Aligned with Admin Dashboard layout)
    const tableHeaders: string[] = [
      'Transaction ID',
      'Current Status',
      'Date Borrowed',
      'Time Borrowed (Time In)',
      'Expected Return (Due Time)',
      'Actual Return (Time Out)',
      'Loan Duration',
      'Student Full Name',
      'Student ID / LRN',
      'Strand / Department',
      'School Email',
      'Subject & Lab Activity',
      'Supervising Science Teacher',
      'Borrowed Apparatus Items & Compartments',
      'Total Units Borrowed',
      'Return Condition',
      'Remarks / Log Notes',
    ];

    // Data Rows with clean, Excel-friendly formatted dates and duration
    const rows = targetList.map((t: StudentTransactionLog) => {
      const dateBorrowed = formatCsvDate(t.time_in);
      const timeBorrowed = formatCsvTime(t.time_in);
      const expectedDue = t.expected_return
        ? formatCsvDateTime(t.expected_return)
        : 'Not Specified';
      const actualReturn = t.time_out
        ? formatCsvDateTime(t.time_out)
        : 'Active In Lab (Not Yet Returned)';

      let durationStr = 'N/A';
      if (t.time_in && t.expected_return) {
        const dueMs = new Date(t.expected_return).getTime() - new Date(t.time_in).getTime();
        if (dueMs > 0) {
          const h = Math.round((dueMs / 3600000) * 10) / 10;
          durationStr = h >= 24 ? `${Math.round((h / 24) * 10) / 10} Days (${h}h)` : `${h} Hours`;
        }
      }

      const itemsFormatted = (t.items || [])
        .map((i) => {
          const qty = i.quantity || 1;
          const comp = i.storage_compartment ? ` [${i.storage_compartment}]` : '';
          const code = i.qr_code ? ` (${i.qr_code})` : '';
          return `${qty}x ${i.name}${code}${comp}`;
        })
        .join('; ');

      const totalUnits =
        t.total_items_count || (t.items || []).reduce((s: number, i: { quantity?: number }) => s + (i.quantity || 1), 0);
      const returnCondition = t.return_condition
        ? `${t.return_condition}`
        : t.status === 'Returned / Logged Out'
        ? 'Good'
        : 'N/A (Active In Lab)';
      const remarks =
        t.return_notes ||
        (t.status === 'Returned / Logged Out'
          ? 'Returned and verified in stock'
          : t.status === 'Overdue'
          ? 'Immediate teacher follow-up required'
          : 'Equipment currently in use by student');

      return [
        t.transaction_code,
        t.status,
        dateBorrowed,
        timeBorrowed,
        expectedDue,
        actualReturn,
        durationStr,
        t.student_name,
        t.student_id_lrn,
        t.grade_section,
        t.school_email || 'N/A',
        t.subject_activity,
        t.teacher_name,
        itemsFormatted,
        String(totalUnits),
        returnCondition,
        remarks,
      ];
    });

    const allRows: (string | number)[][] = [...headerBlock, tableHeaders, ...rows];
    const csvContent = allRows
      .map((row: (string | number)[]) =>
        row
          .map((cell: string | number) => {
            const str = cell === null || cell === undefined ? '' : String(cell);
            return `"${str.replace(/"/g, '""')}"`;
          })
          .join(',')
      )
      .join('\r\n');

    // Prepend UTF-8 BOM (\uFEFF) so Microsoft Excel opens directly with correct UTF-8 character encoding
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    a.download = `AU_JRC_LabGuard_Student_Logs_${yyyy}-${mm}-${dd}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEqName.trim()) return;
    await fetch('/api/admin/equipment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newEqName,
        qr_code: newEqQr,
        category: newEqCategory,
        storage_compartment: newEqCompartment,
        total_qty: newEqQty,
        unit: newEqUnit,
        safety_level: newEqSafety,
        prerequisites: [newEqPrereq],
      }),
    });
    setNewEqName('');
    setNewEqQr('');
    setShowAddEquipment(false);
    onRefreshData();
  };

  const handleAdjustStock = async (item: Equipment, delta: number) => {
    const nextTotal = Math.max(1, item.total_qty + delta);
    await fetch(`/api/admin/equipment/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ total_qty: nextTotal }),
    });
    onRefreshData();
  };

  const handleDeleteEquipment = async (id: number) => {
    await fetch(`/api/admin/equipment/${id}`, { method: 'DELETE' });
    onRefreshData();
  };

  const handleShowEquipmentQr = async (item: Equipment) => {
    const dataUrl = await QRCode.toDataURL(item.qr_code, {
      width: 260,
      margin: 1,
      color: { dark: '#003087', light: '#FFFFFF' },
    });
    setQrPreviewItem({ item, dataUrl });
  };

  const handleUpdateSafetyLevel = async (level: SafetyStatusLevel, customMessage?: string) => {
    setSavingSafety(true);
    const presetMsg = customMessage ?? SAFETY_PRESET_MESSAGES[level].message;
    setCustomSafetyMsg(presetMsg);
    try {
      await fetch('/api/admin/safety-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level,
          message: presetMsg,
          updated_by: updatedByInput,
        }),
      });
      onRefreshData();
    } finally {
      setSavingSafety(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
      {/* Top Header & System Actions */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-[#003087] font-semibold">
            Arellano University – Jose Rizal Campus · Science Laboratory Personnel Console
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading mt-1">
            LabGuard+ Admin & Monitoring Dashboard
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Real-time student QR log-in records, borrowed apparatus accountability, equipment QR inventory, and LED safety status control
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportLogsCsv}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Export Logs CSV
          </button>
          <button
            type="button"
            onClick={onResetSystem}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Demo Data
          </button>
        </div>
      </div>

      {/* 4-Column Metric Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-slate-500">
            Total Student Log-In Records
          </p>
          <p className="text-3xl font-mono font-bold tabular-nums text-slate-900 mt-1">
            {transactions.length}
          </p>
          <p className="text-xs text-slate-600 mt-1">
            {activeInLabCount} currently active in laboratory
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-slate-500">
            Science Apparatus Availability
          </p>
          <p className="text-3xl font-mono font-bold tabular-nums text-[#003087] mt-1">
            {totalUnitsAvailable}{' '}
            <span className="text-sm font-normal text-slate-400">/ {totalUnitsCapacity} units</span>
          </p>
          <p className="text-xs text-slate-600 mt-1">
            Across {equipment.length} registered QR equipment types
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-slate-500">
            Overdue / Unreturned Sessions
          </p>
          <p
            className={`text-3xl font-mono font-bold tabular-nums mt-1 ${
              overdueCount > 0 ? 'text-[#C8102E]' : 'text-emerald-600'
            }`}
          >
            {overdueCount}
          </p>
          <p className="text-xs text-slate-600 mt-1">
            {overdueCount > 0
              ? 'Requires teacher or lab personnel follow-up'
              : 'All active sessions within time limit'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-mono uppercase tracking-wider text-slate-500">
            Station LED Safety Status
          </p>
          <p
            className={`text-2xl font-mono font-bold mt-1 ${
              safetyStatus.level === 'SAFE'
                ? 'text-[#16A34A]'
                : safetyStatus.level === 'CAUTION'
                ? 'text-[#D97706]'
                : 'text-[#DC2626]'
            }`}
          >
            {safetyStatus.level === 'SAFE'
              ? '● GREEN (SAFE)'
              : safetyStatus.level === 'CAUTION'
              ? '▲ YELLOW (CAUTION)'
              : '▲ RED (UNSAFE)'}
          </p>
          <p className="text-xs text-slate-600 mt-1 truncate">{safetyStatus.updated_by}</p>
        </div>
      </div>

      {/* Admin Workspace Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {[
          {
            id: 'logs' as const,
            label: `1. Student Log-In & Borrowed Records (${transactions.length})`,
          },
          {
            id: 'inventory' as const,
            label: `2. Equipment Inventory & QR Tags (${equipment.length})`,
          },
          {
            id: 'safety' as const,
            label: `3. LED Safety Status Display (${safetyStatus.level})`,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === tab.id
                ? 'border-[#003087] text-[#003087]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* =================================================================== */}
      {/* TAB 1: STUDENT LOG-IN & BORROWED EQUIPMENT DATABASE RECORDS         */}
      {/* =================================================================== */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Search by Student Name, LRN/ID, Strand/Section, Teacher, or Equipment..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#003087] focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(
                ['ALL', 'Borrowed / In Lab', 'Overdue', 'Returned / Logged Out'] as const
              ).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    statusFilter === st
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st === 'ALL' ? 'All Records' : st}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-mono uppercase text-slate-500">
                    <th className="py-3 px-4">Transaction & Time</th>
                    <th className="py-3 px-4">Student Information</th>
                    <th className="py-3 px-4">Subject & Teacher</th>
                    <th className="py-3 px-4">Checked-Out Equipment Basket</th>
                    <th className="py-3 px-4">Status & Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {filteredLogs.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 align-top">
                      <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                        <p className="font-bold text-[#003087]">{tx.transaction_code}</p>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          In: {new Date(tx.time_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {tx.time_out ? (
                          <p className="text-emerald-700 text-[11px]">
                            Out: {new Date(tx.time_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        ) : (
                          <p className="text-slate-400 text-[11px]">
                            Due: {new Date(tx.expected_return).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{tx.student_name}</p>
                        <p className="text-slate-600 font-mono text-[11px] mt-0.5">
                          {tx.student_id_lrn} · {tx.grade_section}
                        </p>
                        <p className="text-slate-500 text-[11px]">{tx.school_email}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800">{tx.subject_activity}</p>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          Teacher: {tx.teacher_name}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <ul className="space-y-1">
                          {tx.items.map((item, i) => (
                            <li key={i} className="text-slate-700">
                              <span className="font-mono font-bold tabular-nums text-[#003087]">
                                {item.quantity}×
                              </span>{' '}
                              <span className="font-medium">{item.name}</span>{' '}
                              <span className="text-slate-400 font-mono text-[11px]">
                                ({item.qr_code} · {item.storage_compartment})
                              </span>
                            </li>
                          ))}
                        </ul>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-2">
                          <span
                            className={`font-mono font-bold text-xs ${
                              tx.status === 'Returned / Logged Out'
                                ? 'text-[#16A34A]'
                                : tx.status === 'Overdue'
                                ? 'text-[#C8102E]'
                                : 'text-[#D97706]'
                            }`}
                          >
                            {tx.status === 'Returned / Logged Out'
                              ? `● Returned (${tx.return_condition || 'Good'})`
                              : tx.status === 'Overdue'
                              ? '▲ Overdue in Lab'
                              : '● Active in Lab'}
                          </span>

                          {tx.status !== 'Returned / Logged Out' && (
                            <div>
                              <button
                                type="button"
                                onClick={() => handleQuickMarkReturned(tx)}
                                className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[#16A34A] hover:bg-emerald-700 rounded-md flex items-center gap-1 cursor-pointer"
                              >
                                <RotateCcw className="w-3 h-3" />
                                Check In & Log Out
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: SCIENCE EQUIPMENT INVENTORY & REGISTERED QR TAGS             */}
      {/* =================================================================== */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-600">
              All science laboratory equipment below is bound to a unique QR code for student checkout and return tracking.
            </p>
            <button
              type="button"
              onClick={() => setShowAddEquipment(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#003087] hover:bg-[#002466] rounded-lg flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Register New Equipment QR
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-mono uppercase text-slate-500">
                    <th className="py-3 px-4">QR Code & Compartment</th>
                    <th className="py-3 px-4">Apparatus Name & Category</th>
                    <th className="py-3 px-4">Safety Prerequisite</th>
                    <th className="py-3 px-4 text-right">Stock (Avail / Total)</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {equipment.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 align-middle">
                      <td className="py-3 px-4 font-mono whitespace-nowrap">
                        <p className="font-bold text-[#003087]">{item.qr_code}</p>
                        <p className="text-slate-500 text-[11px]">{item.storage_compartment}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{item.name}</p>
                        <p className="text-slate-500 text-[11px]">
                          {item.category} · Condition: {item.condition}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-mono font-bold text-[11px] ${
                            item.safety_level === 'CAUTION'
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {item.safety_level === 'CAUTION' ? '▲ CAUTION / PPE' : '● SAFE'}
                        </span>
                        <p className="text-slate-500 text-[11px] truncate max-w-xs">
                          {item.prerequisites[0]}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                        <span className="font-bold text-sm text-slate-900">
                          {item.available_qty}
                        </span>{' '}
                        <span className="text-slate-400">/ {item.total_qty} {item.unit}s</span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAdjustStock(item, -1)}
                            className="px-2 py-1 text-xs font-mono bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                            title="Decrease total stock"
                          >
                            -1
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdjustStock(item, 1)}
                            className="px-2 py-1 text-xs font-mono bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                            title="Increase total stock"
                          >
                            +1
                          </button>
                          <button
                            type="button"
                            onClick={() => handleShowEquipmentQr(item)}
                            className="px-2.5 py-1 text-xs font-semibold text-[#003087] bg-blue-50 hover:bg-blue-100 rounded flex items-center gap-1 cursor-pointer"
                          >
                            <QrCode className="w-3 h-3" />
                            QR Tag
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEquipment(item.id)}
                            className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                            title="Delete item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: LED SAFETY STATUS DISPLAY CONTROLLER                         */}
      {/* =================================================================== */}
      {activeTab === 'safety' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 max-w-3xl">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-lg font-bold text-slate-900 font-heading">
              LabGuard+ LED Safety Status Display Controller
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Per the AU-JRC research study (Definition of Terms, p. 12), the LED Safety Status Display communicates immediate laboratory conditions: GREEN represents SAFE, YELLOW represents CAUTION, and RED represents UNSAFE.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(
              [
                {
                  level: 'SAFE' as const,
                  title: 'GREEN · SAFE',
                  desc: 'Standard laboratory operation. All checkouts allowed.',
                  color: 'border-emerald-600 bg-emerald-50/70 text-emerald-950',
                },
                {
                  level: 'CAUTION' as const,
                  title: 'YELLOW · CAUTION',
                  desc: 'Thermal, chemical, or glassware in use. PPE mandatory.',
                  color: 'border-amber-600 bg-amber-50/70 text-amber-950',
                },
                {
                  level: 'UNSAFE' as const,
                  title: 'RED · UNSAFE',
                  desc: 'Spill, breakage, or hazard alert. Pauses new checkouts.',
                  color: 'border-red-600 bg-red-50/70 text-red-950',
                },
              ]
            ).map((card) => {
              const active = safetyStatus.level === card.level;
              return (
                <button
                  key={card.level}
                  type="button"
                  disabled={savingSafety}
                  onClick={() => handleUpdateSafetyLevel(card.level)}
                  className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    active
                      ? `${card.color} ring-2 ring-offset-1 ring-slate-900/20`
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <p className="font-mono text-xs font-bold">{card.title}</p>
                  <p className="text-xs mt-1 opacity-85">{card.desc}</p>
                </button>
              );
            })}
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Pre-Programmed / Custom Safety Display Message
              </label>
              <input
                type="text"
                value={customSafetyMsg}
                onChange={(e) => setCustomSafetyMsg(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#003087] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Updated By (Teacher / Laboratory Personnel)
              </label>
              <input
                type="text"
                value={updatedByInput}
                onChange={(e) => setUpdatedByInput(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#003087] focus:bg-white"
              />
            </div>

            <button
              type="button"
              disabled={savingSafety}
              onClick={() => handleUpdateSafetyLevel(safetyStatus.level, customSafetyMsg)}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-[#003087] hover:bg-[#002466] rounded-lg cursor-pointer"
            >
              {savingSafety ? 'Updating LED Display...' : 'Broadcast Message to Kiosk Banner'}
            </button>
          </div>
        </div>
      )}

      {/* Add Equipment Modal */}
      {showAddEquipment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateEquipment}
            className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl"
          >
            <h3 className="text-lg font-bold text-slate-900 font-heading">
              Register New Science Equipment QR
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Equipment Name *
              </label>
              <input
                type="text"
                required
                value={newEqName}
                onChange={(e) => setNewEqName(e.target.value)}
                placeholder="e.g. Graduated Cylinder 100mL (Borosilicate)"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  QR Code ID
                </label>
                <input
                  type="text"
                  value={newEqQr}
                  onChange={(e) => setNewEqQr(e.target.value)}
                  placeholder="Auto (e.g. LG-EQ-011)"
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Storage Compartment
                </label>
                <input
                  type="text"
                  value={newEqCompartment}
                  onChange={(e) => setNewEqCompartment(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Category
                </label>
                <select
                  value={newEqCategory}
                  onChange={(e) => setNewEqCategory(e.target.value as EquipmentCategory)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="Optical & Microscopy">Optical & Microscopy</option>
                  <option value="Glassware & Measuring">Glassware & Measuring</option>
                  <option value="Heating & Thermal">Heating & Thermal</option>
                  <option value="Balances & Analytical">Balances & Analytical</option>
                  <option value="Safety & PPE">Safety & PPE</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Safety Prerequisite Level
                </label>
                <select
                  value={newEqSafety}
                  onChange={(e) => setNewEqSafety(e.target.value as 'SAFE' | 'CAUTION')}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="SAFE">SAFE (Standard)</option>
                  <option value="CAUTION">CAUTION (PPE / Thermal / Glass)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Total Quantity
                </label>
                <input
                  type="number"
                  min={1}
                  value={newEqQty}
                  onChange={(e) => setNewEqQty(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Unit Label
                </label>
                <input
                  type="text"
                  value={newEqUnit}
                  onChange={(e) => setNewEqUnit(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Primary Safety Prerequisite Reminder
              </label>
              <input
                type="text"
                value={newEqPrereq}
                onChange={(e) => setNewEqPrereq(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddEquipment(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-[#003087] rounded-lg cursor-pointer"
              >
                Save Equipment & Generate QR
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Equipment QR Code Tag Preview Modal */}
      {qrPreviewItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl">
            <p className="text-xs font-mono font-bold text-[#003087] uppercase">
              LabGuard+ Registered Apparatus QR Tag
            </p>
            <h3 className="text-base font-bold text-slate-900 font-heading">
              {qrPreviewItem.item.name}
            </h3>
            <div className="p-3 bg-white border-2 border-[#003087] rounded-xl inline-block">
              <img
                src={qrPreviewItem.dataUrl}
                alt={qrPreviewItem.item.qr_code}
                referrerPolicy="no-referrer"
                className="w-44 h-44 object-contain"
              />
            </div>
            <p className="font-mono text-sm font-bold text-slate-900">
              {qrPreviewItem.item.qr_code} · {qrPreviewItem.item.storage_compartment}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setQrPreviewItem(null)}
                className="w-full py-2.5 text-xs font-semibold text-white bg-[#003087] rounded-lg cursor-pointer"
              >
                Close QR Label Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
