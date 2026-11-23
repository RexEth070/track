'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Bot,
  Cpu,
  FileSpreadsheet,
  Clock,
  RotateCcw,
  Layers,
  XCircle,
  Check,
} from 'lucide-react';
import { AnalysisResult, CurrencyCode, KaneBugType } from '@/types';
import { formatCurrency, formatNumber, formatDate } from '@/lib/formatters';

interface AuditEvidencePageProps {
  data: AnalysisResult;
  currency: CurrencyCode;
  onBack: () => void;
}

type FilterTab = 'all' | 'status' | 'duplicate' | 'invalid';

export function AuditEvidencePage({
  data,
  currency,
  onBack,
}: AuditEvidencePageProps) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const audit = data.kaneAudit;

  if (!audit) {
    return (
      <div className="flex-1 px-4 sm:px-6 py-12 max-w-5xl mx-auto w-full">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#52525B] hover:text-[#18181B] mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Results
        </button>
        <div className="bg-white border border-[#E4E4E7] rounded-2xl p-8 text-center text-sm text-[#71717A]">
          No audit evidence is available for this file.
        </div>
      </div>
    );
  }

  const evidenceList = audit.bugEvidence || [];

  const filteredEvidence = evidenceList.filter((ev) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'status') {
      return ev.type === 'pending_status' || ev.type === 'reversed_status';
    }
    if (activeFilter === 'duplicate') return ev.type === 'duplicate_collapse';
    if (activeFilter === 'invalid') return ev.type === 'invalid_row';
    return true;
  });

  const statusIssueCount = audit.pendingCount + audit.reversedCount;
  const dedupIssueCount = audit.duplicateValuesDetected > 0 ? 1 : 0;
  const invalidIssueCount = data.invalidCount;

  const getBadgeMeta = (type: KaneBugType) => {
    switch (type) {
      case 'pending_status':
        return {
          label: 'Pending Status Bug',
          icon: Clock,
          classes: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      case 'reversed_status':
        return {
          label: 'Reversed Status Bug',
          icon: RotateCcw,
          classes: 'bg-rose-50 text-rose-800 border-rose-200',
        };
      case 'duplicate_collapse':
        return {
          label: 'Deduplication Collapse Bug',
          icon: Layers,
          classes: 'bg-violet-50 text-violet-800 border-violet-200',
        };
      case 'invalid_row':
        return {
          label: 'Malformed / Invalid Row',
          icon: XCircle,
          classes: 'bg-zinc-100 text-zinc-700 border-zinc-200',
        };
    }
  };

  return (
    <div
      data-testid="audit-evidence-page"
      className="flex-1 px-4 sm:px-6 py-8 max-w-5xl mx-auto w-full space-y-8 animate-fade-in"
    >
      {/* Top Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E4E4E7]">
        <div className="space-y-2">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#71717A] hover:text-[#18181B] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Calculation Results
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#E4E4E7] flex items-center justify-center text-[#18181B] shadow-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg font-semibold text-[#18181B] tracking-tight">
                  Autonomous Audit &amp; Bug Evidence Vault
                </h1>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Kane Audit: Certified
                </span>
              </div>
              <p className="text-xs text-[#71717A] flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{data.fileName}</span>
                <span>•</span>
                <span>Audited on {formatDate(data.processedAt)}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Proof Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E4E4E7] rounded-2xl p-5 space-y-1.5">
          <div className="text-[11px] font-medium uppercase tracking-wider text-[#71717A]">
            Initial Buggy Pass
          </div>
          <div
            className={`text-xl font-bold tracking-tight ${
              Math.abs(audit.initialBuggyTotal - audit.rawCandidateTotal) > 0.01
                ? 'text-rose-700 line-through'
                : 'text-[#18181B]'
            }`}
          >
            {formatCurrency(audit.initialBuggyTotal, currency)}
          </div>
          <p className="text-[11px] text-[#71717A]">
            {statusIssueCount > 0
              ? `Included ${statusIssueCount} Pending/Reversed row${statusIssueCount === 1 ? '' : 's'}`
              : 'Raw pre-audit ledger pass'}
          </p>
        </div>

        <div className="bg-white border border-emerald-200 rounded-2xl p-5 space-y-1.5">
          <div className="text-[11px] font-medium uppercase tracking-wider text-emerald-700">
            Certified Final Total
          </div>
          <div className="text-xl font-bold tracking-tight text-emerald-800">
            {formatCurrency(audit.rawCandidateTotal, currency)}
          </div>
          <p className="text-[11px] text-emerald-700">
            Verified across {formatNumber(data.validCount)} settled rows
          </p>
        </div>

        <div className="bg-white border border-[#E4E4E7] rounded-2xl p-5 space-y-1.5">
          <div className="text-[11px] font-medium uppercase tracking-wider text-[#71717A]">
            Discrepancy Prevented
          </div>
          <div className="text-xl font-bold tracking-tight text-[#18181B]">
            {formatCurrency(audit.healedDifference ?? 0, currency)}
          </div>
          <p className="text-[11px] text-[#71717A]">
            {audit.bugEvidence.length} evidence record{audit.bugEvidence.length === 1 ? '' : 's'} logged
          </p>
        </div>

        <div className="bg-white border border-[#E4E4E7] rounded-2xl p-5 space-y-1.5">
          <div className="text-[11px] font-medium uppercase tracking-wider text-[#71717A]">
            Row Reconciliation
          </div>
          <div className="text-xl font-bold tracking-tight text-[#18181B] flex items-center gap-1.5">
            <span>
              {audit.reconciliation.validSettledCount +
                audit.reconciliation.excludedStatusCount +
                audit.reconciliation.invalidRowCount +
                audit.reconciliation.emptyRowsSkipped}
              /{audit.reconciliation.totalRowsRead}
            </span>
            {audit.reconciliation.isBalanced && audit.reconciliation.parityVerified && (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            )}
          </div>
          <p className="text-[11px] text-[#71717A]">
            {audit.reconciliation.validSettledCount} settled •{' '}
            {audit.reconciliation.excludedStatusCount} excluded •{' '}
            {audit.reconciliation.invalidRowCount} invalid
          </p>
        </div>
      </div>

      {/* Caught Bugs & Evidence Records */}
      <div className="bg-white border border-[#E4E4E7] rounded-2xl overflow-hidden shadow-xs">
        <div className="p-6 border-b border-[#E4E4E7] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-[#18181B] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Caught Bugs, Quarantined Rows &amp; Resolution Proof
            </h2>
            <p className="text-xs text-[#71717A] mt-0.5">
              Every anomaly intercepted behind closed doors by Kane CLI before final results were issued.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { key: 'all' as FilterTab, label: `All (${evidenceList.length})` },
              { key: 'status' as FilterTab, label: `Pending/Reversed (${statusIssueCount})` },
              { key: 'duplicate' as FilterTab, label: `Deduplication (${dedupIssueCount})` },
              { key: 'invalid' as FilterTab, label: `Invalid Rows (${invalidIssueCount})` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeFilter === tab.key
                    ? 'bg-[#18181B] text-white'
                    : 'bg-[#F4F4F5] text-[#52525B] hover:bg-[#E4E4E7]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-[#F4F4F5]">
          {filteredEvidence.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#71717A]">
              No anomalies in this category.
            </div>
          ) : (
            filteredEvidence.map((item) => {
              const meta = getBadgeMeta(item.type);
              const Icon = meta.icon;

              return (
                <div key={item.id} className="p-6 space-y-4 hover:bg-[#FAFAF9]/60 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${meta.classes}`}
                      >
                        <Icon className="w-3 h-3" />
                        {meta.label}
                      </span>
                      <h3 className="text-sm font-semibold text-[#18181B]">{item.title}</h3>
                      {item.transactionId && (
                        <span className="text-[11px] font-mono text-[#71717A] bg-[#F4F4F5] px-2 py-0.5 rounded">
                          {item.transactionId}
                        </span>
                      )}
                    </div>

                    {item.financialImpact > 0 && (
                      <div className="text-xs font-semibold font-mono text-[#18181B] bg-[#F4F4F5] px-2.5 py-1 rounded-lg shrink-0">
                        Impact Protected: {formatCurrency(item.financialImpact, currency)}
                      </div>
                    )}
                  </div>

                  {/* 3-Step Proof Grid: Problem -> Fix -> Verification */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-rose-50/40 border border-rose-200/70 space-y-1">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-rose-700">
                        1. Problem Caught
                      </div>
                      <p className="text-[#18181B] leading-relaxed">{item.problemDetected}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#FAFAF9] border border-[#E4E4E7] space-y-1">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-[#52525B]">
                        2. Autonomous Fix Applied
                      </div>
                      <p className="text-[#18181B] leading-relaxed">{item.fixApplied}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-50/40 border border-emerald-200/70 space-y-1">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        3. How Kane Verified It
                      </div>
                      <p className="text-emerald-950 leading-relaxed">{item.verificationCheck}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Autonomous Cross-Agent Verification Protocol Transcript */}
      <div className="bg-white border border-[#E4E4E7] rounded-2xl overflow-hidden shadow-xs">
        <div className="p-6 border-b border-[#E4E4E7]">
          <h2 className="text-base font-semibold text-[#18181B]">
            Autonomous Cross-Agent Verification Transcript
          </h2>
          <p className="text-xs text-[#71717A] mt-0.5">
            Timestamped behind-closed-doors communication between Kane Verification Agent and Track Calculation Core.
          </p>
        </div>

        <div className="p-6 space-y-3 font-mono text-xs">
          {audit.logs.map((log, idx) => {
            const isKane = log.source === 'Kane Verification Agent';
            const isResolved = log.status === 'resolved';
            const isWarning = log.status === 'warning';

            return (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border ${
                  isKane
                    ? isWarning
                      ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                      : isResolved
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                      : 'bg-[#F4F4F5] border-[#E4E4E7] text-[#18181B]'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-100'
                }`}
              >
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-black/5">
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
                  <span className="text-[10px] opacity-60">{log.timestamp}</span>
                </div>
                <p className="leading-relaxed whitespace-pre-wrap">{log.message}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
