'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AnalysisResult, CurrencyCode, CURRENCIES } from '@/types';
import { formatCurrency, formatNumber, formatFileSize, formatDate } from '@/lib/formatters';
import {
  downloadPdfReport,
  downloadExcelReport,
  downloadCsvReport,
  downloadJsonReport,
} from '@/lib/report-generator';
import {
  FileSpreadsheet,
  FileText,
  FileCode2,
  Download,
  ChevronDown,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Send,
  Sparkles,
  Search,
  RefreshCw,
  X,
  Loader2,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { SummaryVisualizer } from './SummaryVisualizer';
import { HeroMetricsList } from './HeroMetricsList';

interface ResultsScreenProps {
  data: AnalysisResult;
  currency: CurrencyCode;
  exchangeRate?: number;
  rateSource?: 'live' | 'fallback';
  onCurrencyChange: (code: CurrencyCode) => void;
  onUploadAnother: () => void;
  onViewEvidence: () => void;
  onRefreshSummary?: () => void;
}

interface QAItem {
  id: string;
  question: string;
  answer: string;
  timestamp: string;
  highlights?: { label: string; value: string | number }[];
}

const ALL_SAMPLE_QUESTIONS = [
  'What was the largest transaction?',
  'Which date was the 60th transaction sent?',
  'What was the 70th transaction used for?',
  'How much did we spend on AWS?',
  'Show transactions above 50,000',
  'What is the average transaction amount?',
  'Are there negative transactions?',
  'What was the smallest transaction?',
];

export function ResultsScreen({
  data,
  currency,
  exchangeRate = 1,
  rateSource = 'live',
  onCurrencyChange,
  onUploadAnother,
  onViewEvidence,
}: ResultsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'gross' | 'net'>('gross');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const pageSize = 10;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const grossTotal =
    data.grossVolume ||
    Math.round((data.positiveTotal + Math.abs(data.negativeTotal)) * 100) / 100;
  const isMixed = data.negativeCount > 0 && data.positiveCount > 0;
  const displayedTotal = !isMixed ? data.totalAmount : viewMode === 'gross' ? grossTotal : data.totalAmount;

  // AI Chat state
  const [questionInput, setQuestionInput] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [qaList, setQaList] = useState<QAItem[]>([]);
  const [randomQuestions, setRandomQuestions] = useState<string[]>([]);

  const shuffleQuestions = () => {
    const shuffled = [...ALL_SAMPLE_QUESTIONS].sort(() => 0.5 - Math.random());
    setRandomQuestions(shuffled.slice(0, 3));
  };

  useEffect(() => {
    shuffleQuestions();
  }, []);

  // Filtered transactions for preview table
  const filteredTransactions = data.transactions.filter((tx) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const matchesDesc = tx.description ? tx.description.toLowerCase().includes(q) : false;
    const matchesDate = tx.date ? tx.date.toLowerCase().includes(q) : false;
    const matchesAmount = String(tx.amount).includes(q) || String(tx.rawAmount).includes(q);
    const matchesRow = String(tx.rowIndex).includes(q);
    return matchesDesc || matchesDate || matchesAmount || matchesRow;
  });

  const totalPages = Math.ceil(filteredTransactions.length / pageSize) || 1;
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleAskQuestion = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed || isAsking) return;

    const qaId = `qa-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setQuestionInput('');
    setIsAsking(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: trimmed,
          data,
          currency,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to query data');
      }

      const resData = await res.json();
      setQaList((prev) => [
        {
          id: qaId,
          question: trimmed,
          answer: resData.answer || 'Unable to analyze query.',
          timestamp,
          highlights: resData.highlights,
        },
        ...prev,
      ]);
    } catch (err) {
      console.error(err);
      setQaList((prev) => [
        {
          id: qaId,
          question: trimmed,
          answer: 'Could not process question. Verified calculation metrics remain unaffected.',
          timestamp,
        },
        ...prev,
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  const handleDismissQA = (id: string) => {
    setQaList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAllQA = () => {
    setQaList([]);
  };

  return (
    <div className="flex-1 px-4 sm:px-6 py-8 max-w-5xl mx-auto w-full space-y-8 animate-fade-in">
      {/* Top File Meta & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E4E4E7]">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onUploadAnother}
            aria-label="Back to landing page"
            title="Back to landing page"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#545B66] hover:text-[#11161F] hover:bg-[#EAE0CB] transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-white border border-[#E4E4E7] flex items-center justify-center text-[#18181B] shadow-xs">
            <FileSpreadsheet className="w-5 h-5 text-[#52525B]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-[#18181B] truncate max-w-xs sm:max-w-md">
                {data.fileName}
              </h2>
              <span
                data-testid="kane-verified-badge"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Kane Audit: Certified</span>
              </span>
            </div>
            <p className="text-xs text-[#71717A]">
              {formatFileSize(data.fileSize)} • Processed on {formatDate(data.processedAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Multi-Format Direct Download Dropdown */}
          <div ref={exportMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#18181B] bg-white hover:bg-[#F4F4F5] border border-[#E4E4E7] px-3.5 py-2 rounded-lg shadow-xs transition-all cursor-pointer"
              title="Download report in PDF, Excel, CSV, or JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Report</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#71717A] transition-transform ${
                  showExportMenu ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-[#E4E4E7] bg-white shadow-lg py-1.5 z-40 animate-fade-in">
                <button
                  type="button"
                  onClick={() => {
                    downloadPdfReport(data, currency, exchangeRate);
                    setShowExportMenu(false);
                  }}
                  className="w-full px-3.5 py-2.5 text-left hover:bg-[#F9F5ED] flex items-start gap-2.5 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-[#F25820] mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-[#11161F]">PDF Document (.pdf)</div>
                    <div className="text-[11px] text-[#71717A]">
                      Direct download · Executive summary &amp; ledger
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    downloadExcelReport(data, currency, exchangeRate);
                    setShowExportMenu(false);
                  }}
                  className="w-full px-3.5 py-2.5 text-left hover:bg-[#F9F5ED] flex items-start gap-2.5 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-[#11161F]">Excel Workbook (.xlsx)</div>
                    <div className="text-[11px] text-[#71717A]">
                      3 sheets · Summary, Ledger &amp; Audit Evidence
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    downloadCsvReport(data, currency);
                    setShowExportMenu(false);
                  }}
                  className="w-full px-3.5 py-2.5 text-left hover:bg-[#F9F5ED] flex items-start gap-2.5 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-[#52525B] mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-[#11161F]">CSV Spreadsheet (.csv)</div>
                    <div className="text-[11px] text-[#71717A]">
                      Universal tabular format with audit notes
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    downloadJsonReport(data, currency, exchangeRate);
                    setShowExportMenu(false);
                  }}
                  className="w-full px-3.5 py-2.5 text-left hover:bg-[#F9F5ED] flex items-start gap-2.5 transition-colors cursor-pointer"
                >
                  <FileCode2 className="w-4 h-4 text-[#52525B] mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-[#11161F]">JSON Audit Data (.json)</div>
                    <div className="text-[11px] text-[#71717A]">
                      Full structured ledger &amp; Kane transcript
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onUploadAnother}
            className="inline-flex items-center gap-1.5 text-xs font-medium bg-[#18181B] hover:bg-[#27272A] text-white px-3.5 py-2 rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            Upload Another
          </button>
        </div>
      </div>

      {/* Main Hero Card: Total Transaction Amount */}
      <div className="bg-white border border-[#E4E4E7] rounded-2xl p-5 sm:p-7 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#71717A]">
                <span>
                  {isMixed
                    ? viewMode === 'gross'
                      ? 'Total Transaction Value (Gross)'
                      : 'Net Transaction Balance (Net)'
                    : 'Total Transaction Value'}
                </span>
                <span className="text-[#A1A1AA]">•</span>
                <span className="text-[#18181B] font-mono">{currency}</span>
              </div>

              {/* Gross vs Net Switcher if there are expenses */}
              {isMixed && (
                <div className="flex items-center bg-[#F4F4F5] p-0.5 rounded-lg text-xs font-medium text-[#71717A]">
                  <button
                    onClick={() => setViewMode('gross')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      viewMode === 'gross'
                        ? 'bg-white text-[#18181B] shadow-2xs font-semibold'
                        : 'hover:text-[#18181B]'
                    }`}
                  >
                    Gross (Total)
                  </button>
                  <button
                    onClick={() => setViewMode('net')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      viewMode === 'net'
                        ? 'bg-white text-[#18181B] shadow-2xs font-semibold'
                        : 'hover:text-[#18181B]'
                    }`}
                  >
                    Net (Balance)
                  </button>
                </div>
              )}
            </div>

            {/* Total Display */}
            <div
              data-testid="total-amount"
              className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#18181B] font-sans"
            >
              {formatCurrency(displayedTotal, currency)}
            </div>

            {data.baseCurrency && currency !== data.baseCurrency && (
              <div className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#545B66] bg-[#F9F5ED] border border-[#D7D0C3] px-2.5 py-1 rounded-md">
                <span>
                  Converted from {data.baseCurrency} · 1 {data.baseCurrency} ={' '}
                  {CURRENCIES[currency].symbol}
                  {exchangeRate.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="text-[#9199A5]">•</span>
                <span className="text-emerald-700 font-medium">
                  {rateSource === 'live' ? 'Live market rate' : 'Market rate'}
                </span>
              </div>
            )}

            <p className="text-xs sm:text-sm text-[#71717A]">
              {isMixed ? (
                viewMode === 'gross' ? (
                  <>
                    Combined value of all{' '}
                    <strong data-testid="valid-count" className="text-[#18181B] font-semibold">
                      {formatNumber(data.validCount)}
                    </strong>{' '}
                    transactions ({formatCurrency(data.positiveTotal, currency)} incoming +{' '}
                    {formatCurrency(Math.abs(data.negativeTotal), currency)} expenses).
                  </>
                ) : (
                  <>
                    Net balance after subtracting{' '}
                    {formatCurrency(Math.abs(data.negativeTotal), currency)} expenses from{' '}
                    {formatCurrency(data.positiveTotal, currency)} incoming payments.
                  </>
                )
              ) : (
                <>
                  Calculated programmatically across{' '}
                  <strong data-testid="valid-count" className="text-[#18181B] font-semibold">
                    {formatNumber(data.validCount)}
                  </strong>{' '}
                  valid transaction rows from column{' '}
                  <span className="font-mono bg-[#F4F4F5] px-1.5 py-0.5 rounded text-[#18181B]">
                    &ldquo;{data.amountColumn}&rdquo;
                  </span>
                  .
                </>
              )}
            </p>
          </div>

          {/* Animated Metrics List (Magic UI AnimatedList) */}
          <div className="pt-2 md:pt-0">
            <HeroMetricsList data={data} currency={currency} />
          </div>
        </div>

        {/* Audit Evidence & Skipped Rows Notice (Opens Dedicated Evidence Page) */}
        {(data.invalidCount > 0 || (data.kaneAudit && data.kaneAudit.bugEvidence.length > 0)) && (() => {
          const audit = data.kaneAudit;
          const totalEvidence = audit ? audit.bugEvidence.length : data.invalidCount;
          const parts: string[] = [];
          if (data.invalidCount > 0) {
            parts.push(`${data.invalidCount} invalid row${data.invalidCount === 1 ? '' : 's'}`);
          }
          if (audit && audit.pendingCount > 0) {
            parts.push(`${audit.pendingCount} pending`);
          }
          if (audit && audit.reversedCount > 0) {
            parts.push(`${audit.reversedCount} reversed`);
          }
          if (audit && audit.duplicateValuesDetected > 0) {
            parts.push(`${audit.duplicateValuesDetected} duplicate collapse${audit.duplicateValuesDetected === 1 ? '' : 's'} healed`);
          }

          return (
            <div
              data-testid="audit-evidence-banner"
              className="mt-6 pt-4 border-t border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-amber-50/60 -mx-5 sm:-mx-7 -mb-5 sm:-mb-7 p-4 sm:px-7"
            >
              <div className="flex items-center gap-2 text-xs text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>{totalEvidence}</strong> issue{totalEvidence === 1 ? '' : 's'} caught &amp; safely resolved by Kane
                  {parts.length > 0 ? ` (${parts.join(', ')})` : ''}.
                </span>
              </div>
              <button
                data-testid="view-audit-evidence-btn"
                onClick={onViewEvidence}
                className="inline-flex items-center gap-1 text-xs font-semibold text-amber-900 hover:text-black underline underline-offset-2 shrink-0 cursor-pointer"
              >
                <span>View Audit Evidence</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })()}
      </div>

      {/* AI Summary Section with Visual Tooltip Breakdown */}
      <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#18181B] text-white flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-sm font-semibold text-[#18181B] tracking-tight">
            AI Transaction Summary
          </h3>
        </div>

        {/* Intelligent visual breakdown with ChartTooltip & ChartTooltipContent */}
        <SummaryVisualizer data={data} currency={currency} />
      </div>

      {/* Interactive AI Question / Q&A Section */}
      <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#71717A]" />
              <h3 className="text-sm font-semibold text-[#18181B]">
                Ask Questions About Your Data
              </h3>
            </div>
            <p className="text-xs text-[#71717A]">
              Answers are retrieved directly from your uploaded file with verified numbers.
            </p>
          </div>

          {qaList.length > 0 && (
            <button
              onClick={handleClearAllQA}
              className="text-xs font-medium text-[#71717A] hover:text-[#18181B] px-2.5 py-1 rounded-md hover:bg-[#F4F4F5] transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* 3 Random Suggested Prompt Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {randomQuestions.map((q) => (
            <button
              key={q}
              onClick={() => handleAskQuestion(q)}
              disabled={isAsking}
              className="text-xs text-[#52525B] hover:text-[#18181B] bg-[#F4F4F5] hover:bg-[#E4E4E7] px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
            >
              {q}
            </button>
          ))}
          <button
            onClick={shuffleQuestions}
            title="Show 3 different questions"
            className="p-1.5 text-[#71717A] hover:text-[#18181B] rounded-full hover:bg-[#F4F4F5] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Q&A List with individual Cancel / Dismiss buttons */}
        {qaList.length > 0 && (
          <div className="space-y-3 pt-1">
            {qaList.map((qa) => (
              <div
                key={qa.id}
                className="p-4 rounded-xl text-xs sm:text-sm bg-[#FAFAF9] border border-[#E4E4E7] relative group shadow-2xs transition-all animate-fade-in"
              >
                {/* Tiny Cancel / Dismiss button */}
                <button
                  onClick={() => handleDismissQA(qa.id)}
                  className="absolute top-3 right-3 text-[#A1A1AA] hover:text-[#18181B] p-1 rounded-md hover:bg-[#E4E4E7]/70 transition-colors"
                  title="Dismiss this answer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                <div className="pr-6 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#18181B]">Q:</span>
                    <span className="font-medium text-[#18181B]">{qa.question}</span>
                    <span className="text-[10px] text-[#A1A1AA] ml-auto mr-1">{qa.timestamp}</span>
                  </div>

                  <div
                    className="text-[#3F3F46] leading-relaxed pt-1"
                    dangerouslySetInnerHTML={{
                      __html: qa.answer.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
                    }}
                  />

                  {/* Highlights cards if available */}
                  {qa.highlights && qa.highlights.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E4E4E7]/60">
                      {qa.highlights.map((hl, i) => (
                        <div
                          key={i}
                          className="bg-white border border-[#E4E4E7] px-2.5 py-1 rounded-md text-[11px]"
                        >
                          <span className="text-[#71717A] mr-1.5">{hl.label}:</span>
                          <span className="font-semibold text-[#18181B] font-mono">
                            {String(hl.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Loading indicator when asking */}
        {isAsking && (
          <div className="flex items-center gap-2 text-xs text-[#71717A] py-1 px-3 bg-[#FAFAF9] border border-[#E4E4E7] rounded-lg w-fit">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#18181B]" />
            <span>Finding answer from verified transaction records...</span>
          </div>
        )}

        {/* Question Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAskQuestion(questionInput);
          }}
          className="flex items-center gap-2 pt-1"
        >
          <input
            type="text"
            value={questionInput}
            onChange={(e) => setQuestionInput(e.target.value)}
            placeholder="Ask a question about this data (e.g., date of 60th transaction, AWS spend)..."
            disabled={isAsking}
            className="flex-1 bg-[#FAFAF9] border border-[#E4E4E7] rounded-lg px-4 py-2 text-xs sm:text-sm text-[#18181B] placeholder-[#A1A1AA] focus:outline-hidden focus:border-[#18181B] focus:bg-white transition-all"
          />
          <button
            type="submit"
            disabled={!questionInput.trim() || isAsking}
            className="bg-[#18181B] hover:bg-[#27272A] text-white p-2.5 rounded-lg disabled:opacity-40 transition-all shrink-0"
            title="Send question"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Transactions Data Table Preview */}
      <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[#18181B]">
              Transaction Ledger ({formatNumber(filteredTransactions.length)})
            </h3>
            <p className="text-xs text-[#71717A]">
              Showing parsed records with calculated numeric values
            </p>
          </div>

          {/* Search Table */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#A1A1AA] absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search transactions..."
              className="w-full bg-[#FAFAF9] border border-[#E4E4E7] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#18181B] placeholder-[#A1A1AA] focus:outline-hidden focus:border-[#18181B]"
            />
          </div>
        </div>

        <div className="border border-[#E4E4E7] rounded-xl overflow-hidden text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#FAFAF9] border-b border-[#E4E4E7] text-[#71717A] font-medium">
                <tr>
                  <th className="p-3 w-14">Row</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-right">Calculated Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F4F5]">
                {paginatedTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#FAFAF9] transition-colors">
                    <td className="p-3 font-mono text-[#71717A]">#{tx.rowIndex}</td>
                    <td className="p-3 text-[#52525B]">{tx.date || '—'}</td>
                    <td className="p-3 text-[#18181B] font-medium">{tx.description || '—'}</td>
                    <td
                      className={`p-3 text-right font-mono font-semibold ${
                        tx.amount < 0 ? 'text-red-600' : 'text-[#18181B]'
                      }`}
                    >
                      {formatCurrency(tx.amount, currency)}
                    </td>
                  </tr>
                ))}
                {paginatedTransactions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-[#71717A]">
                      No transactions matching &ldquo;{searchQuery}&rdquo;
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-3 bg-[#FAFAF9] border-t border-[#E4E4E7] flex items-center justify-between text-xs text-[#71717A]">
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="px-2.5 py-1 rounded border border-[#E4E4E7] bg-white disabled:opacity-40 hover:bg-[#F4F4F5]"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="px-2.5 py-1 rounded border border-[#E4E4E7] bg-white disabled:opacity-40 hover:bg-[#F4F4F5]"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
