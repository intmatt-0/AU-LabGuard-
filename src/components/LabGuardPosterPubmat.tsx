/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Download, FileText, ArrowRight } from 'lucide-react';
import type { Equipment, StudentTransactionLog } from '../types';
import {
  createLabGuardPdfDocument,
  downloadLabGuardPdf,
} from '../utils/posterPdfGenerator';

interface LabGuardPosterPubmatProps {
  equipment: Equipment[];
  transactions: StudentTransactionLog[];
  onNavigateToView: (view: 'kiosk' | 'student' | 'admin') => void;
}

export const LabGuardPosterPubmat: React.FC<LabGuardPosterPubmatProps> = ({
  equipment,
  transactions,
  onNavigateToView,
}) => {
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [generatingMode, setGeneratingMode] = useState<string | null>(null);

  useEffect(() => {
    try {
      const doc = createLabGuardPdfDocument({
        mode: 'both',
        equipment,
        transactions,
      });
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
      return () => URL.revokeObjectURL(url);
    } catch {
      return undefined;
    }
  }, [equipment, transactions]);

  const handleDownload = (mode: 'both' | 'poster' | 'pubmat') => {
    setGeneratingMode(mode);
    setTimeout(() => {
      const url = downloadLabGuardPdf({
        mode,
        equipment,
        transactions,
      });
      setPdfBlobUrl(url);
      setGeneratingMode(null);
    }, 50);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
      {/* Control Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-[#003087] font-semibold">
            Arellano University – Jose Rizal Campus · Practical Research II
          </p>
          <h1 className="text-xl font-bold text-slate-900 font-heading mt-0.5">
            LabGuard+ Printable Research Poster & Pubmat (.PDF)
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Download the vector PDF poster showcasing the Kiosk Inventory Picker, Student QR Info Form, and Admin Dashboard.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleDownload('both')}
            className="px-4 py-2.5 text-xs font-semibold text-white bg-[#C8102E] hover:bg-[#a50d25] rounded-lg flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="w-4 h-4" />
            {generatingMode === 'both'
              ? 'Generating PDF...'
              : 'Download 2-Page PDF (Poster + Pubmat)'}
          </button>

          <button
            type="button"
            onClick={() => handleDownload('poster')}
            className="px-3.5 py-2.5 text-xs font-semibold text-[#003087] bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <FileText className="w-3.5 h-3.5" />
            Poster PDF Only
          </button>

          <button
            type="button"
            onClick={() => handleDownload('pubmat')}
            className="px-3.5 py-2.5 text-xs font-semibold text-[#003087] bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <FileText className="w-3.5 h-3.5" />
            Pubmat PDF Only
          </button>
        </div>
      </div>

      {/* Quick Interactive View Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => onNavigateToView('kiosk')}
          className="p-4 bg-white border border-slate-200 hover:border-[#003087] rounded-xl text-left flex items-center justify-between group cursor-pointer"
        >
          <div>
            <p className="text-xs font-mono font-bold text-[#003087]">PAGE 01 · KIOSK</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">
              Science Equipment Inventory & Basket
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#003087]" />
        </button>

        <button
          type="button"
          onClick={() => onNavigateToView('student')}
          className="p-4 bg-white border border-slate-200 hover:border-[#003087] rounded-xl text-left flex items-center justify-between group cursor-pointer"
        >
          <div>
            <p className="text-xs font-mono font-bold text-[#C8102E]">PAGE 02 · STUDENT FORM</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">
              QR-Directed Student Log-In Page
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#C8102E]" />
        </button>

        <button
          type="button"
          onClick={() => onNavigateToView('admin')}
          className="p-4 bg-white border border-slate-200 hover:border-[#003087] rounded-xl text-left flex items-center justify-between group cursor-pointer"
        >
          <div>
            <p className="text-xs font-mono font-bold text-[#16A34A]">PAGE 03 · ADMIN</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">
              Admin Database & LED Status Console
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#16A34A]" />
        </button>
      </div>

      {/* Embedded Live PDF Viewer */}
      {pdfBlobUrl && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-900 text-white text-xs font-mono flex items-center justify-between">
            <span>LabGuard_Plus_AU_JRC_Poster_and_Pubmat.pdf (Vector PDF Preview)</span>
            <span>Arellano University – Jose Rizal Campus</span>
          </div>
          <iframe
            src={pdfBlobUrl}
            title="LabGuard+ PDF Poster and Pubmat"
            className="w-full h-[760px] border-0"
          />
        </div>
      )}
    </div>
  );
};
