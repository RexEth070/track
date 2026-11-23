'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/Header';
import { LandingPage } from '@/components/LandingPage';
import { ProcessingScreen } from '@/components/ProcessingScreen';
import { ResultsScreen } from '@/components/ResultsScreen';
import { AuditEvidencePage } from '@/components/AuditEvidencePage';
import { ColumnPickerModal } from '@/components/ColumnPickerModal';
import {
  AnalysisResult,
  ColumnDetectionResult,
  CurrencyCode,
  ProcessingStep,
  RawRow,
} from '@/types';
import {
  parseCsvFile,
  parseExcelFile,
  detectColumns,
  calculateTransactions,
} from '@/lib/parser';
import { generateExecutiveSummary } from '@/lib/ai-query-engine';
import {
  DEFAULT_EXCHANGE_RATES,
  ExchangeRates,
  convertAnalysisResult,
  getExchangeRate,
} from '@/lib/currency';

export default function Home() {
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>(DEFAULT_EXCHANGE_RATES);
  const [rateSource, setRateSource] = useState<'live' | 'fallback'>('fallback');
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('idle');
  const [activeFile, setActiveFile] = useState<File | null>(null);

  // Parsing intermediate state
  const [rawRows, setRawRows] = useState<RawRow[]>([]);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [columnDetection, setColumnDetection] = useState<ColumnDetectionResult | null>(null);

  // Final calculated result (stored immutably in its original baseCurrency)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showEvidencePage, setShowEvidencePage] = useState(false);

  // Fetch live market exchange rates on mount
  useEffect(() => {
    let active = true;
    fetch('/api/exchange-rates')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (active && json?.rates) {
          setExchangeRates(json.rates);
          if (json.source === 'live' || json.source === 'fallback') {
            setRateSource(json.source);
          }
        }
      })
      .catch(() => {
        // Silently retain fallback rates
      });
    return () => {
      active = false;
    };
  }, []);

  // Derive currency-converted view cleanly without mutating raw base numbers
  const displayedResult = useMemo(() => {
    if (!analysisResult) return null;
    return convertAnalysisResult(analysisResult, currency, exchangeRates);
  }, [analysisResult, currency, exchangeRates]);

  const activeExchangeRate = useMemo(() => {
    if (!analysisResult) return 1;
    return getExchangeRate(analysisResult.baseCurrency, currency, exchangeRates);
  }, [analysisResult, currency, exchangeRates]);

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleFileSelected = async (file: File) => {
    try {
      setActiveFile(file);
      setAnalysisResult(null);

      // Step 1: Reading file
      setProcessingStep('reading');
      await delay(400);

      const isCsv = file.name.toLowerCase().endsWith('.csv');
      const { rows, headers } = isCsv ? await parseCsvFile(file) : await parseExcelFile(file);

      setRawRows(rows);
      setRawHeaders(headers);

      // Step 2: Checking transactions & detecting columns
      setProcessingStep('checking');
      await delay(450);

      const detection = detectColumns(headers, rows);
      setColumnDetection(detection);

      // Auto-switch currency if detected in file
      if (detection.detectedCurrency) {
        setCurrency(detection.detectedCurrency);
      }

      // Check for ambiguity
      if (detection.isAmbiguous || !detection.amountColumn) {
        setProcessingStep('ambiguous');
        return;
      }

      // Proceed with unambiguous calculation
      await performCalculation(
        file,
        rows,
        headers,
        detection.amountColumn,
        detection.detectedCurrency || currency,
        detection.dateColumn || undefined,
        detection.descriptionColumn || undefined,
        detection.statusColumn || undefined
      );
    } catch (err: unknown) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Error reading file');
      setProcessingStep('idle');
      setActiveFile(null);
    }
  };

  const performCalculation = async (
    file: File,
    rows: RawRow[],
    headers: string[],
    amountCol: string,
    curr: CurrencyCode,
    dateCol?: string,
    descCol?: string,
    statusCol?: string
  ) => {
    try {
      // Step 3: Calculating total
      setProcessingStep('calculating');
      await delay(400);

      const result = calculateTransactions(
        rows,
        headers,
        amountCol,
        file.name,
        file.size,
        file.name.split('.').pop() || '',
        curr,
        dateCol,
        descCol,
        statusCol
      );

      // Step 4: Preparing results & generating AI summary
      setProcessingStep('preparing');

      let summaryText = generateExecutiveSummary(result, curr);
      try {
        const aiRes = await fetch('/api/ai/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: result, currency: curr }),
        });
        if (aiRes.ok) {
          const aiJson = await aiRes.json();
          if (aiJson.summary) {
            summaryText = aiJson.summary;
          }
        }
      } catch (e) {
        console.warn('AI summary API call skipped/fallback:', e);
      }

      result.aiSummary = summaryText;

      await delay(300);
      setAnalysisResult(result);
      setProcessingStep('ready');
    } catch (err) {
      console.error(err);
      alert('Error during calculation. Please check file columns.');
      setProcessingStep('idle');
    }
  };

  const handleConfirmColumns = async (
    amountCol: string,
    dateCol?: string,
    descCol?: string
  ) => {
    if (!activeFile) return;
    await performCalculation(
      activeFile,
      rawRows,
      rawHeaders,
      amountCol,
      currency,
      dateCol,
      descCol
    );
  };

  const handleReset = () => {
    setActiveFile(null);
    setAnalysisResult(null);
    setShowEvidencePage(false);
    setRawRows([]);
    setRawHeaders([]);
    setColumnDetection(null);
    setProcessingStep('idle');
  };

  const handleCurrencyChange = (newCurrency: CurrencyCode) => {
    setCurrency(newCurrency);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F5ED]">
      <Header
        currentCurrency={currency}
        onCurrencyChange={handleCurrencyChange}
        hasActiveFile={!!analysisResult}
        onReset={handleReset}
      />

      <main className="flex-1 flex flex-col justify-center">
        {/* Main Screen: Landing Page & Upload Engine */}
        {processingStep === 'idle' && (
          <LandingPage onFileSelected={handleFileSelected} />
        )}

        {/* Processing Screen */}
        {(processingStep === 'reading' ||
          processingStep === 'checking' ||
          processingStep === 'calculating' ||
          processingStep === 'preparing') && (
          <ProcessingScreen
            currentStep={processingStep}
            fileName={activeFile?.name || 'Uploaded File'}
          />
        )}

        {/* Column Resolution Modal (if Ambiguous) */}
        {processingStep === 'ambiguous' && columnDetection && (
          <ColumnPickerModal
            detection={columnDetection}
            sampleRows={rawRows}
            onConfirm={handleConfirmColumns}
            onCancel={handleReset}
          />
        )}

        {/* Results Screen or Dedicated Audit Evidence Page */}
        {processingStep === 'ready' && displayedResult && (
          showEvidencePage ? (
            <AuditEvidencePage
              data={displayedResult}
              currency={currency}
              onBack={() => setShowEvidencePage(false)}
            />
          ) : (
            <ResultsScreen
              data={displayedResult}
              currency={currency}
              exchangeRate={activeExchangeRate}
              rateSource={rateSource}
              onCurrencyChange={handleCurrencyChange}
              onUploadAnother={handleReset}
              onViewEvidence={() => setShowEvidencePage(true)}
            />
          )
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#D7D0C3] py-7 text-sm text-[#545B66] bg-[#F9F5ED]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-display font-bold text-[#11161F]">track</span>
          <span>Programmatically verified · Audited by Kane CLI</span>
        </div>
      </footer>
    </div>
  );
}
