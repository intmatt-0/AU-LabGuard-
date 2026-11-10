/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  Equipment,
  BasketItem,
  CheckoutSession,
  StudentTransactionLog,
  SafetyStatusState,
  LabStudentPreset,
} from './types';
import {
  INITIAL_EQUIPMENT,
  INITIAL_TRANSACTIONS,
  INITIAL_SAFETY_STATUS,
  STUDENT_PRESETS,
} from './data/seedData';
import { Header, ActiveAppView } from './components/Header';
import { KioskTerminal } from './components/KioskTerminal';
import { MobileLoginView } from './components/MobileLoginView';
import { AdminDashboard } from './components/AdminDashboard';
import { LabGuardPosterPubmat } from './components/LabGuardPosterPubmat';

export default function App() {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const qrCheckoutMatch = pathname.match(/^\/student\/checkout\/([^/]+)/);
  const directQrToken = qrCheckoutMatch ? qrCheckoutMatch[1] : '';

  const getInitialView = (): ActiveAppView => {
    if (directQrToken || pathname.startsWith('/student')) return 'student';
    if (pathname.startsWith('/admin')) return 'admin';
    if (pathname.startsWith('/poster')) return 'poster';
    return 'kiosk';
  };

  const [activeView, setActiveView] = useState<ActiveAppView>(getInitialView);
  const [equipment, setEquipment] = useState<Equipment[]>(INITIAL_EQUIPMENT);
  const [transactions, setTransactions] =
    useState<StudentTransactionLog[]>(INITIAL_TRANSACTIONS);
  const [safetyStatus, setSafetyStatus] =
    useState<SafetyStatusState>(INITIAL_SAFETY_STATUS);
  const [studentPresets, setStudentPresets] =
    useState<LabStudentPreset[]>(STUDENT_PRESETS);

  // Kiosk Basket & Active Checkout Session state
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [activeCheckoutSession, setActiveCheckoutSession] =
    useState<CheckoutSession | null>(null);
  const [currentSessionToken, setCurrentSessionToken] =
    useState<string>(directQrToken);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const fetchAllData = useCallback(async () => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.equipment)) setEquipment(data.equipment);
        if (Array.isArray(data.transactions)) setTransactions(data.transactions);
        if (data.safety_status) setSafetyStatus(data.safety_status);
        if (Array.isArray(data.student_presets)) {
          setStudentPresets(data.student_presets);
        }
      }
    } catch {
      // Fallback to initial seed state if offline
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Connect to global WebSocket /ws/kiosk for real-time inventory, student logs & LED safety status updates
  useEffect(() => {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${proto}//${window.location.host}/ws/kiosk`);

    ws.onmessage = (evt) => {
      try {
        const payload = JSON.parse(evt.data);
        if (payload.safety_status) {
          setSafetyStatus(payload.safety_status);
        }
        if (payload.event === 'data_updated') {
          fetchAllData();
        }
      } catch {
        // ignore parse errors
      }
    };

    return () => {
      ws.close();
    };
  }, [fetchAllData]);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
    }
  };

  const handleOpenStudentCheckoutSession = (session: CheckoutSession) => {
    setActiveCheckoutSession(session);
    setCurrentSessionToken(session.session_token);
    setActiveView('student');
  };

  const handleResetSystem = async () => {
    await fetch('/api/reset', { method: 'POST' });
    setBasket([]);
    setActiveCheckoutSession(null);
    fetchAllData();
  };

  const basketCount = useMemo(
    () => basket.reduce((sum, item) => sum + item.quantity, 0),
    [basket]
  );

  const activeBorrowCount = useMemo(
    () => transactions.filter((t) => t.status !== 'Returned / Logged Out').length,
    [transactions]
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
      <Header
        activeView={activeView}
        onSelectView={setActiveView}
        safetyStatus={safetyStatus}
        basketCount={basketCount}
        activeBorrowCount={activeBorrowCount}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
      />

      <main className="flex-1 pb-12">
        {activeView === 'kiosk' && (
          <KioskTerminal
            equipment={equipment}
            transactions={transactions}
            safetyStatus={safetyStatus}
            basket={basket}
            onUpdateBasket={setBasket}
            onOpenStudentCheckoutSession={handleOpenStudentCheckoutSession}
            onRefreshData={fetchAllData}
          />
        )}

        {activeView === 'student' && (
          <MobileLoginView
            sessionToken={currentSessionToken}
            activeSession={activeCheckoutSession}
            fallbackBasket={basket}
            equipment={equipment}
            studentPresets={studentPresets}
            onCompletedTransaction={() => {
              setBasket([]);
              setActiveCheckoutSession(null);
              fetchAllData();
            }}
            onNavigateToKiosk={() => setActiveView('kiosk')}
            onNavigateToAdmin={() => setActiveView('admin')}
          />
        )}

        {activeView === 'admin' && (
          <AdminDashboard
            equipment={equipment}
            transactions={transactions}
            safetyStatus={safetyStatus}
            onRefreshData={fetchAllData}
            onResetSystem={handleResetSystem}
          />
        )}

        {activeView === 'poster' && (
          <LabGuardPosterPubmat
            equipment={equipment}
            transactions={transactions}
            onNavigateToView={(v) => setActiveView(v)}
          />
        )}
      </main>
    </div>
  );
}
