'use client';

import React from 'react';
import { X, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight, Bot, Cpu } from 'lucide-react';
import { KaneAuditReport, CurrencyCode } from '@/types';
import { formatCurrency } from '@/lib/formatters';

interface KaneAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  report?: KaneAuditReport;
  currency: CurrencyCode;
}

export function KaneAuditModal({
  isOpen,
  onClose,
  report,
  currency,
}: KaneAuditModalProps) {
  if (!isOpen || !report) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-[#E4E4E7] rounded-2xl max-w-2xl w-full shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-[#E4E4E7] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-[#18181B]">
                  Kane Integrity Audit: Behind Closed Doors
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-emerald-100 text-emerald-800">
                  {report.status === 'self_healed' ? 'Self-Healed' : 'Certified'}
                </span>
              </div>
              <p className="text-xs text-[#71717A]">
                Autonomous cross-agent verification protocol between Kane CLI and Track Core
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] rounded-lg transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Anomaly Resolution Snapshot if duplicate values occurred */}
        {report.duplicateValuesDetected > 0 && (
          <div className="px-6 py-4 bg-[#FAFAF9] border-b border-[#E4E4E7]">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-white border border-[#E4E4E7] rounded-xl">
                <div className="text-[11px] text-[#71717A]">Recurring Values</div>
                <div className="text-sm font-semibold text-[#18181B]">
                  {report.duplicateValuesDetected} repeat instances
                </div>
              </div>

              <div className="p-3 bg-white border border-rose-200 bg-rose-50/30 rounded-xl">
                <div className="text-[11px] text-rose-700">Naive Collapse Risk</div>
                <div className="text-sm font-semibold text-rose-800 line-through">
                  {formatCurrency(report.naiveCollapsedTotal ?? 0, currency)}
                </div>
              </div>

              <div className="p-3 bg-white border border-emerald-200 bg-emerald-50/30 rounded-xl">
                <div className="text-[11px] text-emerald-700">Certified True Ledger</div>
                <div className="text-sm font-semibold text-emerald-800">
                  {formatCurrency(report.rawCandidateTotal, currency)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Behind-the-Scenes Agent Conversation Logs */}
        <div className="p-6 overflow-y-auto space-y-3.5 flex-1 font-mono text-xs">
          <div className="text-[11px] font-sans font-medium text-[#71717A] uppercase tracking-wider mb-2">
            Autonomous Verification Dialogue
          </div>

          {report.logs.map((log, idx) => {
            const isKane = log.source === 'Kane Verification Agent';
            const isResolved = log.status === 'resolved';
            const isWarning = log.status === 'warning';

            return (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border transition-all ${
                  isKane
                    ? isWarning
                      ? 'bg-amber-50/50 border-amber-200 text-amber-950'
                      : isResolved
                      ? 'bg-emerald-50/40 border-emerald-200 text-emerald-950'
                      : 'bg-[#F4F4F5] border-[#E4E4E7] text-[#18181B]'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-100'
                }`}
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-black/5 dark:border-white/10 mb-2">
                  <div className="flex items-center gap-1.5 font-sans font-semibold text-[11px]">
                    {isKane ? (
                      <>
                        <Bot className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Kane Verification Agent</span>
                      </>
                    ) : (
                      <>
                        <Cpu className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="text-zinc-200">Track Calculation Core</span>
                      </>
                    )}
                  </div>
                  <span className="text-[10px] opacity-60 font-mono">{log.timestamp}</span>
                </div>

                <p className="leading-relaxed whitespace-pre-wrap">{log.message}</p>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-[#E4E4E7] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#71717A]">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Behind-closed-doors verification successful. Zero human intervention required.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-white bg-[#18181B] hover:bg-[#27272A] rounded-lg transition-all"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
}
