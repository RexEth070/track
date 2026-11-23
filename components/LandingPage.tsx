'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Footprints,
  Globe2,
  ListOrdered,
  MessageSquareText,
  ShieldCheck,
  UploadCloud,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { createSampleCsvFile } from '@/lib/sample-data';

interface LandingPageProps {
  onFileSelected: (file: File) => void;
  isLoading?: boolean;
}

const PROMPTS = [
  'Catch Pending & Reversed rows automatically',
  'Protect from duplicate collapse',
  'Quarantine malformed “N/A” rows to Audit Evidence',
  'Auto-detect USD, NGN, GBP & EUR ledgers',
  'Export print-ready PDF & structured CSV reports',
];

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Kane Cross-Agent Audit',
    body: (
      <>
        Kane CLI audits track’s calculation in real time — catching Pending, Reversed, and
        duplicate-collapse{' '}
        <mark className="bg-[#EEE354] text-[#11161F] px-1 rounded-xs font-semibold">bugs</mark>{' '}
        before results appear.
      </>
    ),
  },
  {
    icon: ListOrdered,
    title: 'Audit Evidence Vault',
    body: 'Every caught bug and skipped row is stored on a dedicated Evidence Page with before/after proof and the full cross-agent transcript.',
  },
  {
    icon: Globe2,
    title: 'Multi-Currency & Formats',
    body: 'USD, NGN, GBP, EUR. track parses CSV, XLSX, and XLS ledgers — handling commas, accounting parentheses, and negative deductions.',
  },
  {
    icon: MessageSquareText,
    title: 'Grounded Ledger Q&A',
    body: 'Ask plain-English questions about dates, vendors, or thresholds and get answers retrieved strictly from your settled ledger.',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Upload',
    body: 'Drop any CSV, XLSX, or XLS transaction file — amounts, dates, and statuses detected automatically.',
  },
  {
    n: '02',
    title: 'Audit & Heal',
    body: 'Kane CLI inspects every row for Pending/Reversed inclusions and duplicate collapse, fixing discrepancies with track Core.',
  },
  {
    n: '03',
    title: 'Ship it',
    body: 'Inspect the certified total, review the Audit Evidence Vault, ask ledger questions, and export PDF or CSV.',
  },
];

const TERMINAL_SLIDES = [
  {
    tag: 'kane audit · status guard',
    prompt: 'Analyzing kane_full_audit_test.csv (11 rows)...',
    steps: [
      { label: 'Initial pass', value: '$46,000.00 (10 numeric rows)', tone: 'muted' as const },
      { label: 'Kane caught', value: '2 Pending (-$7k) · 1 Reversed (-$5k)', tone: 'warn' as const },
      { label: 'track healed', value: 'Removed 3 unsettled rows · 1 N/A skipped', tone: 'info' as const },
    ],
    answerLabel: 'CERTIFIED SETTLED TOTAL',
    answer: '$34,000.00',
    footnote: '7 completed rows · 0 discrepancies',
  },
  {
    tag: 'kane audit · multiplicity',
    prompt: 'Auditing company_test_1k_13k.csv (12 rows)...',
    steps: [
      { label: 'Detected', value: '4x $1,000.00 and 8x $13,000.00', tone: 'info' as const },
      { label: 'Collapse risk', value: '$14,000.00 (-$94,000.00 lost)', tone: 'warn' as const },
      { label: 'track healed', value: 'Discrete row summation enforced', tone: 'info' as const },
    ],
    answerLabel: 'CERTIFIED SETTLED TOTAL',
    answer: '$108,000.00',
    footnote: '12/12 rows preserved · parity verified',
  },
  {
    tag: 'grounded ledger q&a',
    prompt: 'What was the 70th transaction used for?',
    steps: [
      { label: 'Row lookup', value: 'Row #70 · TXN-0070 · 2026-10-14', tone: 'muted' as const },
      { label: 'Vendor', value: 'AWS Cloud Infrastructure (Hosting)', tone: 'info' as const },
      { label: 'Status', value: 'Completed · Included in settled total', tone: 'info' as const },
    ],
    answerLabel: 'EXACT LEDGER ENTRY',
    answer: '-$1,420.50',
    footnote: 'Retrieved strictly from your uploaded file',
  },
  {
    tag: 'evidence vault · proof',
    prompt: 'Verify row reconciliation equation...',
    steps: [
      { label: 'Settled rows', value: '7 completed transactions', tone: 'info' as const },
      { label: 'Quarantined', value: '3 Pending/Reversed + 1 invalid ("N/A")', tone: 'warn' as const },
      { label: 'Row equation', value: '7 + 3 + 1 = 11 / 11 rows balanced', tone: 'info' as const },
    ],
    answerLabel: 'KANE AUDIT VERDICT',
    answer: 'CERTIFIED',
    footnote: 'Full cross-agent transcript saved to Evidence Vault',
  },
];

export function LandingPage({
  onFileSelected,
  isLoading = false,
}: LandingPageProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % TERMINAL_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const validateAndHandleFile = (file: File) => {
    setErrorMessage(null);
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const fileNameLower = file.name.toLowerCase();
    const isValid = validExtensions.some((ext) => fileNameLower.endsWith(ext));

    if (!isValid) {
      setErrorMessage('Please upload a valid CSV or Excel file (.csv, .xlsx, .xls).');
      return;
    }

    if (file.size === 0) {
      setErrorMessage('The selected file is empty.');
      return;
    }

    onFileSelected(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndHandleFile(e.dataTransfer.files[0]);
    }
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndHandleFile(e.target.files[0]);
    }
  };

  const handleLoadSample = () => {
    const sample = createSampleCsvFile();
    onFileSelected(sample);
  };

  const scrollToUpload = () => {
    uploadAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const currentSlide = TERMINAL_SLIDES[activeSlide];

  return (
    <div className="flex-1 flex flex-col w-full bg-[#F9F5ED] text-[#11161F] animate-fade-in">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Hero Section */}
      <section className="bg-grid w-full">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:pb-28 lg:pt-16">
          {/* Left Editorial Column */}
          <div>
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#11161F]/15 bg-[#FDFAF4] px-3.5 py-1 font-mono text-xs uppercase tracking-widest text-[#545B66]">
              <span className="size-1.5 rounded-full bg-[#F25820]" />
              AI transaction calculator · Kane CLI
            </p>

            <h1 className="font-display text-5xl font-extrabold leading-[0.95] tracking-tight text-[#11161F] sm:text-6xl lg:text-[66px]">
              Agents make mistakes.
              <br />
              Kane CLI <span className="marker">catches &amp; fixes them.</span>
            </h1>

            <p className="mt-6 max-w-md text-base sm:text-lg leading-relaxed text-[#545B66]">
              Upload your ledger. If an agent slips on Pending, Reversed, or duplicate rows, Kane
              CLI catches the bug and fixes it before you ever see the final number.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              {/* Signature Hot-Orange Stamp Pill Button */}
              <button
                type="button"
                onClick={handleBrowseClick}
                className="inline-flex items-center gap-2.5 rounded-full border-2 border-[#11161F] bg-[#F25820] px-7 py-3.5 text-base font-semibold text-[#FDFAF4] shadow-[4px_4px_0_0_#11161F] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#11161F] active:translate-y-0 active:shadow-none cursor-pointer"
              >
                <span>Upload Ledger</span>
                <ArrowRight className="size-4" />
              </button>

              {/* Paper Secondary Button */}
              <button
                type="button"
                onClick={handleLoadSample}
                className="inline-flex items-center gap-2 rounded-full border-2 border-[#11161F] bg-[#FDFAF4] px-5 py-3.5 text-sm font-semibold text-[#11161F] transition-colors hover:bg-[#EAE0CB] cursor-pointer"
              >
                <Sparkles className="size-4 text-[#F25820]" />
                <span>Try with demo sample</span>
              </button>
            </div>

            <div className="mt-5 font-mono text-xs sm:text-sm text-[#545B66]">
              CSV · XLSX · XLS · Finance &amp; Business
            </div>
          </div>

          {/* Right Column: Iconic Tilted Hot-Orange Frame + Dark Graph-Paper Interactive Terminal */}
          <div ref={uploadAreaRef} className="relative">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative rounded-[28px] bg-[#F25820] p-3.5 pb-4 shadow-[0_24px_60px_-20px_rgba(19,25,34,0.35)] transition-transform duration-300 ${
                isDragOver ? 'rotate-0 scale-[1.02]' : 'rotate-[1.2deg] hover:rotate-[0.4deg]'
              } ${isLoading ? 'pointer-events-none opacity-60' : ''}`}
            >
              {/* Dark Graph-Paper Terminal Window */}
              <div className="bg-grid-ink relative overflow-hidden rounded-[20px] border border-white/10 text-[#F2EEE6]">
                {/* Window Bar */}
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-[#545B66]" />
                    <span className="size-2.5 rounded-full bg-[#545B66]" />
                    <span className="size-2.5 rounded-full bg-[#FD8537]" />
                  </div>
                  <span className="font-mono text-[11px] text-[#9199A5]">
                    {currentSlide.tag}
                  </span>
                </div>

                {/* Terminal Content (Live Animated Audit Demo OR Active Drag Overlay) */}
                <div className="min-h-[285px] p-5 sm:p-6 flex flex-col justify-between">
                  {isDragOver ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-10 border-2 border-dashed border-[#EEE354] rounded-xl bg-[#EEE354]/10">
                      <UploadCloud className="size-10 text-[#EEE354] mb-3" />
                      <p className="font-mono text-sm font-semibold text-[#EEE354]">
                        › Release to run track + Kane CLI audit
                      </p>
                      <p className="font-mono text-xs text-[#9199A5] mt-1">
                        .csv, .xlsx, .xls supported
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Prompt Line */}
                      <div className="space-y-4">
                        <p className="font-mono text-sm sm:text-[15px] leading-relaxed text-[#F2EEE6]">
                          <span className="text-[#FD8537]">› </span>
                          {currentSlide.prompt}
                          <span className="ml-1 inline-block h-4 w-2 translate-y-0.5 bg-[#FD8537] animate-caret" />
                        </p>

                        {/* Step-by-step auditable breakdown */}
                        <div className="space-y-2 border-l-2 border-white/15 pl-3.5 font-mono text-xs">
                          {currentSlide.steps.map((step, i) => (
                            <div key={i} className="flex items-baseline justify-between gap-3">
                              <span className="text-[#9199A5] shrink-0">{step.label}:</span>
                              <span
                                className={`text-right ${
                                  step.tone === 'warn'
                                    ? 'text-[#FD8537]'
                                    : step.tone === 'muted'
                                    ? 'text-[#9199A5] line-through'
                                    : 'text-[#F2EEE6]'
                                }`}
                              >
                                {step.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Certified Answer Strip */}
                      <div className="mt-5 rounded-xl border border-white/10 bg-white/5 px-4 py-3 flex items-center justify-between gap-3">
                        <div>
                          <div className="font-mono text-[10px] uppercase tracking-widest text-[#9199A5]">
                            {currentSlide.answerLabel}
                          </div>
                          <div className="font-mono text-xl sm:text-2xl font-semibold text-[#EEE354] tracking-tight">
                            {currentSlide.answer}
                          </div>
                        </div>
                        <div className="text-right font-mono text-[10px] text-[#9199A5] max-w-[140px] leading-snug">
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-medium mb-0.5">
                            <CheckCircle2 className="size-3" />
                            Verified
                          </span>
                          <div>{currentSlide.footnote}</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Interactive Drop / Upload Footer Bar Inside Terminal */}
                <button
                  type="button"
                  onClick={handleBrowseClick}
                  className="w-full border-t border-white/10 bg-white/[0.03] hover:bg-white/[0.08] px-5 py-3 flex items-center justify-between font-mono text-xs text-[#9199A5] hover:text-[#F2EEE6] transition-colors cursor-pointer"
                >
                  <span className="inline-flex items-center gap-2">
                    <UploadCloud className="size-3.5 text-[#FD8537]" />
                    <span>Drop CSV / Excel here or click to upload</span>
                  </span>
                  <span className="text-[#FD8537]">browse →</span>
                </button>
              </div>

              {/* Signature Slide Indicator Dots on the Hot-Orange Bezel */}
              <div className="mt-3 flex items-center justify-center gap-2">
                {TERMINAL_SLIDES.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveSlide(idx)}
                    aria-label={`View audit example ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      activeSlide === idx
                        ? 'w-7 bg-[#131922]'
                        : 'w-2.5 bg-[#FDFAF4]/60 hover:bg-[#FDFAF4]'
                    }`}
                  />
                ))}
              </div>
            </div>

            {errorMessage && (
              <div className="mt-4 p-3 bg-rose-50 border-2 border-[#11161F] text-rose-900 text-xs font-medium rounded-xl text-center">
                {errorMessage}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Dark Ink Prompt & Audit Marquee */}
      <section
        aria-label="Capabilities and example ledger questions"
        className="w-full overflow-hidden border-y-2 border-[#11161F] bg-[#131922] py-4 text-[#F2EEE6]"
      >
        <div className="flex w-max animate-marquee gap-10 font-mono text-sm">
          {[...PROMPTS, ...PROMPTS].map((p, i) => (
            <span key={i} className="flex items-center gap-10 whitespace-nowrap">
              <span>
                <span className="text-[#FD8537]">› </span>
                {p}
              </span>
              <span className="text-[#9199A5]" aria-hidden>
                ×
              </span>
            </span>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto w-full max-w-6xl px-5 py-24 sm:px-8">
        <div className="mb-14 max-w-2xl">
          <h2 className="font-display text-4xl font-bold tracking-tight text-[#11161F] sm:text-5xl">
            Built for businesses that can’t afford math errors.
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="group rounded-2xl border-2 border-[#11161F] bg-[#FDFAF4] p-6 transition-transform duration-200 hover:-translate-y-1"
            >
              <span className="mb-10 grid size-11 place-items-center rounded-xl bg-[#EDE7DB] text-[#11161F] transition-colors group-hover:bg-[#F25820] group-hover:text-[#FDFAF4]">
                <Icon className="size-5" />
              </span>
              <h3 className="font-display text-xl font-bold text-[#11161F]">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#545B66]">{body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="w-full border-t border-[#D7D0C3] bg-[#EDE7DB]/65">
        <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
          <div className="mb-14 flex items-center gap-3">
            <Footprints className="size-5 text-[#F25820]" />
            <h2 className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-[#11161F]">
              How it works
            </h2>
          </div>

          <ol className="grid gap-10 md:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n} className="border-t-2 border-[#11161F] pt-6">
                <span className="font-mono text-sm font-medium text-[#F25820]">{s.n}</span>
                <h3 className="mt-3 font-display text-4xl font-bold tracking-tight text-[#11161F]">
                  {s.title}
                </h3>
                <p className="mt-3 max-w-xs text-[#545B66] leading-relaxed">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Final Dark Ink CTA */}
      <section id="start" className="w-full px-5 py-24 sm:px-8">
        <div className="bg-grid-ink relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-[#131922] px-8 py-16 text-center text-[#F2EEE6] sm:py-20">
          <p className="font-mono text-sm text-[#FD8537]">› what’s the certified total?</p>
          <h2 className="mx-auto mt-4 max-w-2xl font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
            Less spreadsheet. Exact answers.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-[#9199A5]">
            Bring your next transaction ledger to track and verify every single row with Kane CLI.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            {/* Exact Inverse Pill Button (hovers to yellow highlighter #EEE354) */}
            <button
              type="button"
              onClick={scrollToUpload}
              className="inline-flex items-center gap-2.5 rounded-full border-2 border-[#F2EEE6] bg-[#F2EEE6] px-7 py-3.5 text-base font-semibold text-[#131922] transition-all hover:border-[#EEE354] hover:bg-[#EEE354] hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Upload Ledger</span>
              <ArrowRight className="size-4" />
            </button>

            <button
              type="button"
              onClick={handleLoadSample}
              className="inline-flex items-center gap-2 rounded-full border-2 border-white/25 bg-white/5 px-6 py-3.5 text-sm font-semibold text-[#F2EEE6] transition-all hover:border-[#FD8537] hover:bg-white/10 hover:-translate-y-0.5 cursor-pointer"
            >
              <Sparkles className="size-4 text-[#FD8537]" />
              <span>Try with demo sample</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
