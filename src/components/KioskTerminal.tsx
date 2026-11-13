/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  QrCode,
  ShoppingBasket,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  ShieldAlert,
  Smartphone,
} from 'lucide-react';
import type {
  Equipment,
  EquipmentCategory,
  BasketItem,
  CheckoutSession,
  StudentTransactionLog,
  SafetyStatusState,
} from '../types';

interface KioskTerminalProps {
  equipment: Equipment[];
  transactions: StudentTransactionLog[];
  safetyStatus: SafetyStatusState;
  basket: BasketItem[];
  onUpdateBasket: React.Dispatch<React.SetStateAction<BasketItem[]>>;
  onOpenStudentCheckoutSession: (session: CheckoutSession) => void;
  onRefreshData: () => void;
}

const CATEGORIES: ('All' | EquipmentCategory)[] = [
  'All',
  'Glassware & Measuring',
  'Heating & Thermal',
  'Optical & Microscopy',
  'Safety & PPE',
];

export const KioskTerminal: React.FC<KioskTerminalProps> = ({
  equipment,
  transactions,
  safetyStatus,
  basket,
  onUpdateBasket,
  onOpenStudentCheckoutSession,
  onRefreshData,
}) => {
  const [kioskMode, setKioskMode] = useState<'borrow' | 'return'>('borrow');
  const [selectedCategory, setSelectedCategory] = useState<'All' | EquipmentCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [qrInputCode, setQrInputCode] = useState('');
  const [qrScanNotice, setQrScanNotice] = useState<string | null>(null);

  // Checkout QR Session Modal state
  const [activeCheckoutSession, setActiveCheckoutSession] = useState<CheckoutSession | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [completedReceipt, setCompletedReceipt] = useState<StudentTransactionLog | null>(null);

  // Return Equipment state
  const [returnSearch, setReturnSearch] = useState('');
  const [returningTx, setReturningTx] = useState<StudentTransactionLog | null>(null);
  const [returnCondition, setReturnCondition] = useState<'Good' | 'Damaged' | 'Missing'>('Good');
  const [returnNotes, setReturnNotes] = useState('');
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [returnSuccessTx, setReturnSuccessTx] = useState<StudentTransactionLog | null>(null);

  // Listen to WebSocket if a Checkout QR Modal is open on the kiosk
  useEffect(() => {
    if (!activeCheckoutSession || activeCheckoutSession.status === 'completed') return;

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(
      `${proto}//${window.location.host}/ws/checkout/${activeCheckoutSession.session_token}`
    );

    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        if (data.event === 'checkout_completed' && data.transaction) {
          setCompletedReceipt(data.transaction);
          setActiveCheckoutSession(null);
          onUpdateBasket([]);
          onRefreshData();
        }
      } catch {
        // ignore parse errors
      }
    };

    return () => {
      ws.close();
    };
  }, [activeCheckoutSession, onRefreshData, onUpdateBasket]);

  const filteredEquipment = useMemo(() => {
    return equipment.filter((item) => {
      if (!item.is_active) return false;
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.qr_code.toLowerCase().includes(q) ||
          item.storage_compartment.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [equipment, selectedCategory, searchQuery]);

  const activeBorrows = useMemo(() => {
    return transactions.filter((t) => {
      if (t.status === 'Returned / Logged Out') return false;
      if (!returnSearch.trim()) return true;
      const q = returnSearch.toLowerCase();
      return (
        t.student_name.toLowerCase().includes(q) ||
        t.student_id_lrn.toLowerCase().includes(q) ||
        t.transaction_code.toLowerCase().includes(q) ||
        t.grade_section.toLowerCase().includes(q)
      );
    });
  }, [transactions, returnSearch]);

  const getBasketQty = (equipmentId: number): number => {
    return basket.find((b) => b.equipment_id === equipmentId)?.quantity || 0;
  };

  const handleSetItemQuantity = (item: Equipment, nextQty: number) => {
    setCheckoutError(null);
    const clamped = Math.max(0, Math.min(item.available_qty, nextQty));
    onUpdateBasket((prev) => {
      if (clamped === 0) {
        return prev.filter((b) => b.equipment_id !== item.id);
      }
      const existing = prev.find((b) => b.equipment_id === item.id);
      if (existing) {
        return prev.map((b) =>
          b.equipment_id === item.id ? { ...b, quantity: clamped } : b
        );
      }
      return [
        ...prev,
        {
          equipment_id: item.id,
          qr_code: item.qr_code,
          name: item.name,
          category: item.category,
          storage_compartment: item.storage_compartment,
          quantity: clamped,
          unit: item.unit,
          safety_level: item.safety_level,
          prerequisites: item.prerequisites,
        },
      ];
    });
  };

  const handleQuickQrAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const code = qrInputCode.trim().toUpperCase();
    if (!code) return;
    const match = equipment.find((eq) => eq.qr_code.toUpperCase() === code && eq.is_active);
    if (!match) {
      setQrScanNotice(`No registered equipment matches QR code "${code}".`);
      return;
    }
    const currentQty = getBasketQty(match.id);
    if (currentQty >= match.available_qty) {
      setQrScanNotice(`Maximum available stock (${match.available_qty}) already in basket for ${match.name}.`);
      return;
    }
    handleSetItemQuantity(match, currentQty + 1);
    setQrInputCode('');
    setQrScanNotice(`Added 1 × ${match.name} (${match.qr_code}) to basket.`);
    setTimeout(() => setQrScanNotice(null), 3500);
  };

  const totalBasketUnits = useMemo(
    () => basket.reduce((sum, item) => sum + item.quantity, 0),
    [basket]
  );

  const aggregatedPrerequisites = useMemo(() => {
    const set = new Set<string>();
    for (const item of basket) {
      for (const pre of item.prerequisites) {
        set.add(pre);
      }
    }
    return Array.from(set);
  }, [basket]);

  const handleCheckoutBasket = async () => {
    if (basket.length === 0) return;
    setIsCreatingSession(true);
    setCheckoutError(null);
    try {
      const res = await fetch('/api/kiosk/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ basket_items: basket }),
      });
      const data = await res.json();
      if (!res.ok || !data.session) {
        setCheckoutError(data.error || 'Unable to generate Checkout QR code.');
      } else {
        setActiveCheckoutSession(data.session);
      }
    } catch {
      setCheckoutError('Network error while creating checkout QR session.');
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleConfirmReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returningTx) return;
    setIsSubmittingReturn(true);
    try {
      const res = await fetch('/api/kiosk/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: returningTx.id,
          return_condition: returnCondition,
          return_notes: returnNotes,
        }),
      });
      const data = await res.json();
      if (res.ok && data.transaction) {
        setReturnSuccessTx(data.transaction);
        setReturningTx(null);
        setReturnNotes('');
        onRefreshData();
      }
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-6">
      {/* Kiosk Station Context Header & Mode Switcher */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-[#003087] font-semibold">
            Arellano University – Jose Rizal Campus · Senior High School Department
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading mt-1">
            Science Laboratory Equipment Kiosk
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Step 1: Pick apparatus into your basket · Step 2: Scan Checkout QR · Step 3: Input Student Log-In Details
          </p>
        </div>

        {/* Interactive Mode Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-lg">
          <button
            type="button"
            onClick={() => setKioskMode('borrow')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              kioskMode === 'borrow'
                ? 'bg-[#003087] text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            1. Pick Equipment ({equipment.reduce((acc, e) => acc + e.available_qty, 0)} Available)
          </button>
          <button
            type="button"
            onClick={() => setKioskMode('return')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              kioskMode === 'return'
                ? 'bg-[#003087] text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            2. Return & Log Out ({activeBorrows.length} Active in Lab)
          </button>
        </div>
      </div>

      {/* LED Safety Status Banner for Red UNSAFE or Yellow CAUTION */}
      {safetyStatus.level === 'UNSAFE' && kioskMode === 'borrow' && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-900">
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold">
              LED Safety Status is RED (UNSAFE) — Equipment Checkout Paused
            </p>
            <p className="text-red-700 mt-0.5">
              {safetyStatus.message} Please coordinate with Laboratory Personnel or switch to the Return tab to return borrowed items.
            </p>
          </div>
        </div>
      )}
      {safetyStatus.level === 'CAUTION' && (
        <div className="mt-6 p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3 text-amber-950">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold">
              LED Safety Status is YELLOW (CAUTION) — PPE & Inspection Advisory Active
            </p>
            <p className="text-amber-800 mt-0.5">
              {safetyStatus.message}
            </p>
          </div>
        </div>
      )}

      {/* Completed Checkout Confirmation Receipt Banner */}
      {completedReceipt && (
        <div className="mt-6 p-5 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-base font-bold text-emerald-950 font-heading">
                Checkout & Student Log-In Recorded ({completedReceipt.transaction_code})
              </h2>
              <p className="text-xs text-emerald-800 mt-0.5">
                {completedReceipt.student_name} · {completedReceipt.student_id_lrn} · {completedReceipt.grade_section} · Teacher: {completedReceipt.teacher_name}
              </p>
              <p className="text-xs text-emerald-700 mt-1 font-mono">
                Items Logged: {completedReceipt.items.map((i) => `${i.quantity}× ${i.name} (${i.storage_compartment})`).join(' · ')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCompletedReceipt(null)}
            className="px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-100 cursor-pointer whitespace-nowrap shrink-0"
          >
            Dismiss Receipt
          </button>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODE 1: PICK SCIENCE EQUIPMENT & CHECKOUT BASKET                    */}
      {/* =================================================================== */}
      {kioskMode === 'borrow' && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 8 Columns: Search, QR Scan Input, Category Filters, Equipment Grid */}
          <div className="lg:col-span-8 space-y-5">
            {/* Search & Quick Equipment QR Tag Input Bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search equipment name, compartment, or QR code (e.g. Microscope, LG-EQ-001)..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#003087] focus:bg-white"
                />
              </div>

              <form onSubmit={handleQuickQrAdd} className="flex items-center gap-2">
                <div className="relative">
                  <QrCode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={qrInputCode}
                    onChange={(e) => setQrInputCode(e.target.value)}
                    placeholder="Scan Item QR (LG-EQ-001)"
                    className="w-48 pl-9 pr-3 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#003087] focus:bg-white"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3.5 py-2.5 text-xs font-semibold text-white bg-[#003087] hover:bg-[#002466] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Scan Add
                </button>
              </form>
            </div>

            {qrScanNotice && (
              <div className="px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-[#003087] font-medium flex items-center justify-between">
                <span>{qrScanNotice}</span>
                <button
                  type="button"
                  onClick={() => setQrScanNotice(null)}
                  className="text-xs underline ml-4 cursor-pointer"
                >
                  Close
                </button>
              </div>
            )}

            {/* Category Filter Segmented Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {CATEGORIES.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-[#003087] text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {cat === 'All' ? 'All Apparatus' : cat}
                  </button>
                );
              })}
            </div>

            {/* Equipment Inventory Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredEquipment.map((item) => {
                const selectedQty = getBasketQty(item.id);
                const outOfStock = item.available_qty === 0;

                return (
                  <div
                    key={item.id}
                    className={`bg-white border rounded-xl overflow-hidden flex flex-col justify-between transition-colors ${
                      selectedQty > 0
                        ? 'border-[#003087] ring-1 ring-[#003087]/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      {/* Visual Equipment Image */}
                      <div className="h-36 bg-slate-100 border-b border-slate-100 flex items-center justify-center p-3 relative">
                        <img
                          src={item.image_url || `/images/equipment/${item.qr_code}.svg`}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>

                      {/* Card Title First */}
                      <div className="p-5 pb-0 flex items-start justify-between gap-3">
                        <h2 className="text-base font-bold text-slate-900 font-heading leading-snug">
                          {item.name}
                        </h2>
                        <span className="font-mono text-xs font-bold tabular-nums text-slate-700 whitespace-nowrap shrink-0">
                          {item.available_qty}/{item.total_qty} {item.unit}s
                        </span>
                      </div>

                      {/* Clean Unboxed Metadata with Typographic Separators */}
                      <div className="px-5 mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 font-mono">
                        <span className="font-semibold text-[#003087]">{item.qr_code}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.storage_compartment}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-sans">{item.category}</span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={
                            item.safety_level === 'CAUTION'
                              ? 'text-amber-700 font-semibold'
                              : 'text-emerald-700 font-semibold'
                          }
                        >
                          {item.safety_level === 'CAUTION' ? '▲ Caution / PPE' : '● Standard Safe'}
                        </span>
                      </div>

                      <p className="mt-2.5 text-xs text-slate-600 leading-relaxed">
                        {item.description}
                      </p>

                      {/* Research Prerequisite Rules for this Apparatus */}
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="text-[11px] font-semibold text-slate-700">
                          Safety Prerequisites:
                        </p>
                        <ul className="mt-1 space-y-0.5 text-[11px] text-slate-600">
                          {item.prerequisites.slice(0, 2).map((pre, idx) => (
                            <li key={idx} className="truncate">
                              • {pre}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Touch-First Picker Action Row */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                      <span className="text-xs text-slate-500">
                        {outOfStock ? (
                          <span className="text-red-600 font-semibold">Currently Out of Stock</span>
                        ) : selectedQty > 0 ? (
                          <span className="text-[#003087] font-semibold font-mono tabular-nums">
                            In Basket: {selectedQty} {item.unit}
                            {selectedQty > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span>Tap to add to basket</span>
                        )}
                      </span>

                      {selectedQty === 0 ? (
                        <button
                          type="button"
                          disabled={outOfStock || safetyStatus.level === 'UNSAFE'}
                          onClick={() => handleSetItemQuantity(item, 1)}
                          className="px-4 py-2 text-xs font-semibold text-white bg-[#003087] hover:bg-[#002466] disabled:bg-slate-200 disabled:text-slate-400 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Pick Item
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSetItemQuantity(item, selectedQty - 1)}
                            className="w-8 h-8 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-800 cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-7 text-center font-mono text-sm font-bold tabular-nums text-slate-900">
                            {selectedQty}
                          </span>
                          <button
                            type="button"
                            disabled={selectedQty >= item.available_qty}
                            onClick={() => handleSetItemQuantity(item, selectedQty + 1)}
                            className="w-8 h-8 rounded-lg border border-[#003087] bg-[#003087] text-white hover:bg-[#002466] disabled:opacity-40 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 4 Columns: Sticky Student Equipment Basket & Checkout Trigger */}
          <aside className="lg:col-span-4 lg:sticky lg:top-28 bg-white border border-slate-200 rounded-xl p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3.5">
              <div className="flex items-center gap-2.5">
                <ShoppingBasket className="w-5 h-5 text-[#003087]" />
                <h2 className="text-base font-bold text-slate-900 font-heading">
                  Selected Equipment Basket
                </h2>
              </div>
              <span className="font-mono text-xs font-bold tabular-nums text-[#003087]">
                {totalBasketUnits} item{totalBasketUnits === 1 ? '' : 's'}
              </span>
            </div>

            {basket.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <QrCode className="w-9 h-9 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">
                  Your equipment basket is empty
                </p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Choose science laboratory apparatus from the inventory grid on the left, then tap Checkout to scan your QR code.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {basket.map((item) => {
                    const eq = equipment.find((e) => e.id === item.equipment_id);
                    const maxAvail = eq ? eq.available_qty : item.quantity;
                    return (
                      <div
                        key={item.equipment_id}
                        className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {item.name}
                          </p>
                          <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                            {item.qr_code} · {item.storage_compartment}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              eq && handleSetItemQuantity(eq, item.quantity - 1)
                            }
                            className="w-6 h-6 rounded border border-slate-300 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-100 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center font-mono text-xs font-bold tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={item.quantity >= maxAvail}
                            onClick={() =>
                              eq && handleSetItemQuantity(eq, item.quantity + 1)
                            }
                            className="w-6 h-6 rounded border border-slate-300 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Research-Based Prerequisite Summary for Selected Basket */}
                {aggregatedPrerequisites.length > 0 && (
                  <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg space-y-1.5">
                    <p className="text-xs font-bold text-amber-950">
                      Required Laboratory Safety Prerequisites
                    </p>
                    <ul className="space-y-1 text-[11px] text-amber-900">
                      {aggregatedPrerequisites.slice(0, 4).map((req, i) => (
                        <li key={i}>• {req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {checkoutError && (
                  <p className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                    {checkoutError}
                  </p>
                )}

                <div className="space-y-2.5 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    disabled={isCreatingSession || safetyStatus.level === 'UNSAFE'}
                    onClick={handleCheckoutBasket}
                    className="w-full py-3 px-4 bg-[#C8102E] hover:bg-[#a50d25] disabled:bg-slate-300 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <QrCode className="w-4 h-4" />
                    {isCreatingSession
                      ? 'Generating Checkout QR...'
                      : 'Checkout Basket & Scan QR'}
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateBasket([])}
                    className="w-full py-2 px-3 text-xs font-medium text-slate-600 hover:text-red-600 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear Basket
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODE 2: RETURN EQUIPMENT & STUDENT LABORATORY LOG-OUT               */}
      {/* =================================================================== */}
      {kioskMode === 'return' && (
        <div className="mt-6 space-y-5">
          {returnSuccessTx && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-emerald-950">
                    Equipment Returned & Student Logged Out ({returnSuccessTx.transaction_code})
                  </p>
                  <p className="text-emerald-800">
                    {returnSuccessTx.student_name} · Condition: {returnSuccessTx.return_condition} · Stock restored to inventory.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReturnSuccessTx(null)}
                className="text-xs font-semibold text-emerald-900 underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={returnSearch}
                onChange={(e) => setReturnSearch(e.target.value)}
                placeholder="Search active borrower by Student Name, LRN/ID, or Transaction Code (e.g. LG-JRC-101)..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#003087] focus:bg-white"
              />
            </div>
            <p className="text-xs text-slate-500 font-mono">
              Showing {activeBorrows.length} active laboratory session{activeBorrows.length === 1 ? '' : 's'}
            </p>
          </div>

          {activeBorrows.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="text-base font-bold text-slate-900">
                All borrowed laboratory equipment has been returned
              </p>
              <p className="text-xs text-slate-500">
                No active student borrow transactions match your filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeBorrows.map((tx) => (
                <div
                  key={tx.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 font-heading">
                          {tx.student_name}
                        </h3>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          {tx.transaction_code} · {tx.student_id_lrn} · {tx.grade_section}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-mono font-bold whitespace-nowrap ${
                          tx.status === 'Overdue' ? 'text-red-600' : 'text-amber-700'
                        }`}
                      >
                        {tx.status === 'Overdue' ? '▲ OVERDUE' : '● IN LAB'}
                      </span>
                    </div>

                    <p className="mt-2.5 text-xs text-slate-700">
                      <span className="font-semibold">Activity:</span> {tx.subject_activity} ·{' '}
                      <span className="font-semibold">Teacher:</span> {tx.teacher_name}
                    </p>

                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                      <p className="text-[11px] font-semibold text-slate-600">
                        Borrowed Basket ({tx.total_items_count} units):
                      </p>
                      {tx.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs text-slate-700 font-mono"
                        >
                          <span className="truncate font-sans">
                            {item.quantity}× {item.name}
                          </span>
                          <span className="text-slate-500 shrink-0 ml-2">
                            {item.storage_compartment}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                    <span className="text-[11px] font-mono text-slate-500">
                      Time In: {new Date(tx.time_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setReturningTx(tx);
                        setReturnCondition('Good');
                        setReturnNotes('');
                      }}
                      className="px-4 py-2 text-xs font-semibold text-white bg-[#16A34A] hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Return Items & Log Out
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 1: CHECKOUT QR CODE HANDOFF TO STUDENT INFO PAGE              */}
      {/* =================================================================== */}
      {activeCheckoutSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs font-mono font-bold uppercase text-[#003087]">
                  Step 2 of 3 · Basket Checkout QR Generated
                </p>
                <h2 className="text-xl font-bold text-slate-900 font-heading mt-0.5">
                  Scan QR to Input Student Information
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveCheckoutSession(null)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-4 bg-white border-2 border-[#003087] rounded-xl">
                {activeCheckoutSession.qr_data_url ? (
                  <img
                    src={activeCheckoutSession.qr_data_url}
                    alt={`Checkout QR Code ${activeCheckoutSession.session_token}`}
                    referrerPolicy="no-referrer"
                    className="w-52 h-52 object-contain"
                  />
                ) : (
                  <div className="w-52 h-52 flex items-center justify-center font-mono text-xs text-slate-500">
                    Generating QR...
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <p className="font-mono text-xs font-bold text-[#003087]">
                  Session Token: {activeCheckoutSession.session_token} · {totalBasketUnits} Item{totalBasketUnits === 1 ? '' : 's'}
                </p>
                <p className="text-xs text-slate-600 max-w-md">
                  Scan this QR code with your phone camera to open the{' '}
                  <span className="font-semibold text-slate-900">
                    Student Information & Laboratory Log-In Page
                  </span>
                  , or click the button below to open the Student Info Page directly on this screen.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const sess = activeCheckoutSession;
                  setActiveCheckoutSession(null);
                  onOpenStudentCheckoutSession(sess);
                }}
                className="w-full py-3 px-4 bg-[#003087] hover:bg-[#002466] text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                Open Student Information Form (After QR Scan)
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: CONFIRM EQUIPMENT RETURN & CONDITION                       */}
      {/* =================================================================== */}
      {returningTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmReturn}
            className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl"
          >
            <div className="border-b border-slate-200 pb-3">
              <p className="text-xs font-mono font-bold text-[#16A34A] uppercase">
                Equipment Return & Lab Log-Out
              </p>
              <h3 className="text-lg font-bold text-slate-900 font-heading mt-0.5">
                {returningTx.student_name} ({returningTx.transaction_code})
              </h3>
            </div>

            <div className="space-y-1 text-xs text-slate-600">
              <p className="font-semibold text-slate-800">Returning Items:</p>
              {returningTx.items.map((item, i) => (
                <p key={i} className="font-mono">
                  • {item.quantity}× {item.name} → {item.storage_compartment}
                </p>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Returned Equipment Condition
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Good', 'Damaged', 'Missing'] as const).map((cond) => (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => setReturnCondition(cond)}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border cursor-pointer ${
                      returnCondition === cond
                        ? cond === 'Good'
                          ? 'bg-[#003087] text-white border-[#003087]'
                          : 'bg-amber-600 text-white border-amber-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cond}
                  </button>
                ))}
              </div>
              {returnCondition !== 'Good' && (
                <div className="mt-2.5 p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-[11px] text-amber-900">
                  <span className="font-bold">LED Safety Status Notice:</span> Reporting a{' '}
                  <span className="font-bold uppercase">{returnCondition}</span> item will automatically switch the Station LED Safety Status to{' '}
                  <span className="font-bold">YELLOW (CAUTION)</span> and alert the Laboratory Coordinator.
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Return Remarks / Compartment Verification
              </label>
              <input
                type="text"
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="e.g. Cleaned and returned to assigned compartment"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#003087]"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setReturningTx(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingReturn}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#16A34A] hover:bg-emerald-700 rounded-lg cursor-pointer"
              >
                {isSubmittingReturn ? 'Recording Return...' : 'Confirm Return & Log Out'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
