/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { SafetyStatusState } from '../types';

export type ActiveAppView = 'kiosk' | 'student' | 'admin' | 'poster';

interface HeaderProps {
  activeView: ActiveAppView;
  onSelectView: (view: ActiveAppView) => void;
  safetyStatus: SafetyStatusState;
  basketCount: number;
  activeBorrowCount: number;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onSelectView,
  safetyStatus,
  basketCount,
  activeBorrowCount,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const navItems: { id: ActiveAppView; label: string }[] = [
    {
      id: 'kiosk',
      label: basketCount > 0 ? `Inventory Kiosk (${basketCount})` : 'Inventory Kiosk',
    },
    {
      id: 'student',
      label: 'Student QR Form',
    },
    {
      id: 'admin',
      label: activeBorrowCount > 0 ? `Admin Dashboard (${activeBorrowCount})` : 'Admin Dashboard',
    },
    {
      id: 'poster',
      label: 'Poster & Pubmat PDF',
    },
  ];

  const getLedBannerStyles = () => {
    if (safetyStatus.level === 'UNSAFE') {
      return {
        bg: 'bg-[#DC2626] text-white border-b border-red-800',
        indicator: '▲ LED RED · UNSAFE',
      };
    }
    if (safetyStatus.level === 'CAUTION') {
      return {
        bg: 'bg-[#D97706] text-white border-b border-amber-700',
        indicator: '▲ LED YELLOW · CAUTION',
      };
    }
    return {
      bg: 'bg-[#16A34A] text-white border-b border-emerald-800',
      indicator: '● LED GREEN · SAFE',
    };
  };

  const ledStyle = getLedBannerStyles();

  return (
    <div className="no-print sticky top-0 z-40">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="bg-[#003087] text-white border-b border-white/15 px-6 py-3.5 flex items-center justify-between gap-8">
        <button
          type="button"
          onClick={() => onSelectView('kiosk')}
          className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-white font-heading whitespace-nowrap shrink-0 text-left cursor-pointer"
        >
          <div className="w-7 h-7 rounded-full overflow-hidden bg-white shrink-0 flex items-center justify-center p-0.5">
            <img src="/images/au_seal.jpg" alt="Arellano University Seal" className="w-full h-full object-contain" />
          </div>
          <span>LabGuard+ Station</span>
        </button>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav className="flex items-center gap-6 overflow-x-auto text-sm font-medium">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectView(item.id)}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                  isActive
                    ? 'text-[#F5A623] border-[#F5A623] font-semibold'
                    : 'text-white/80 border-transparent hover:text-white hover:border-white/40'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#C8102E] hover:bg-[#a50d25] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Kiosk'}
          </button>
        </div>
      </header>

      {/* LabGuard+ Research Feature #3: LED Safety Status Display Banner */}
      <div className={`${ledStyle.bg} px-6 py-2 transition-colors`}>
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono font-bold tracking-wider uppercase whitespace-nowrap shrink-0">
              {ledStyle.indicator}
            </span>
            <span aria-hidden="true" className="opacity-60">
              ·
            </span>
            <span className="font-medium truncate">{safetyStatus.message}</span>
          </div>
          <div className="font-mono text-[11px] opacity-90 whitespace-nowrap shrink-0">
            Arellano University – Jose Rizal Campus · SHS Science Laboratory
          </div>
        </div>
      </div>
    </div>
  );
};
