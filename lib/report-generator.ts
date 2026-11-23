import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AnalysisResult, CurrencyCode, CURRENCIES } from '@/types';
import { formatCurrency, formatNumber, formatDate } from './formatters';

function getSafeBaseName(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * PDF-safe currency formatter (standard PDF Helvetica does not embed the ₦ glyph,
 * so we render "NGN 1,234.56" cleanly in PDFs while keeping "$", "£", "€").
 */
function formatPdfCurrency(amount: number, currency: CurrencyCode): string {
  const isNeg = amount < 0;
  const formatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const prefix =
    currency === 'NGN'
      ? 'NGN '
      : currency === 'GBP'
      ? 'GBP '
      : currency === 'EUR'
      ? 'EUR '
      : '$';
  return isNeg ? `-${prefix}${formatted}` : `${prefix}${formatted}`;
}

/**
 * 1. Direct PDF Report Download (.pdf)
 * Generates an executive, multi-section PDF with Kane Audit proof and settled ledger.
 */
export function downloadPdfReport(
  data: AnalysisResult,
  currency: CurrencyCode,
  exchangeRate: number = 1
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const audit = data.kaneAudit;

  // Header Banner (Dark Ink)
  doc.setFillColor(19, 25, 34); // #131922
  doc.rect(0, 0, pageWidth, 84, 'F');

  doc.setTextColor(242, 238, 230); // #F2EEE6
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('track', 40, 38);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(253, 133, 55); // #FD8537
  doc.text('KANE AUDIT: CERTIFIED TRANSACTION REPORT', 40, 56);

  doc.setTextColor(145, 153, 165); // #9199A5
  doc.setFontSize(9);
  doc.text(`File: ${data.fileName}`, pageWidth - 40, 36, { align: 'right' });
  doc.text(`Generated: ${formatDate(new Date().toISOString())}`, pageWidth - 40, 50, {
    align: 'right',
  });
  const fxNote =
    data.baseCurrency && data.baseCurrency !== currency
      ? `Currency: ${currency} (Converted from ${data.baseCurrency} @ ${exchangeRate.toFixed(2)})`
      : `Currency: ${currency}`;
  doc.text(fxNote, pageWidth - 40, 64, { align: 'right' });

  // Executive KPI Summary Table
  let currentY = 104;
  doc.setTextColor(17, 22, 31);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Executive Summary', 40, currentY);

  autoTable(doc, {
    startY: currentY + 8,
    margin: { left: 40, right: 40 },
    head: [['Metric', 'Certified Value', 'Metric', 'Certified Value']],
    body: [
      [
        'Certified Net Total',
        formatPdfCurrency(data.totalAmount, currency),
        'Settled Transactions',
        formatNumber(data.validCount),
      ],
      [
        'Gross Volume',
        formatPdfCurrency(data.grossVolume, currency),
        'Average Transaction',
        formatPdfCurrency(data.averageAmount, currency),
      ],
      [
        'Total Inflows',
        formatPdfCurrency(data.positiveTotal, currency),
        'Highest Transaction',
        formatPdfCurrency(data.highestAmount, currency),
      ],
      [
        'Total Outflows',
        formatPdfCurrency(data.negativeTotal, currency),
        'Lowest Transaction',
        formatPdfCurrency(data.lowestAmount, currency),
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: [19, 25, 34], textColor: [242, 238, 230], fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [17, 22, 31] },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [249, 245, 237] },
      2: { fontStyle: 'bold', fillColor: [249, 245, 237] },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentY = (doc as any).lastAutoTable.finalY + 24;

  // Kane Audit Evidence Section
  if (audit && audit.bugEvidence.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(17, 22, 31);
    doc.text(
      `Kane Audit Evidence (${audit.bugEvidence.length} Issue${audit.bugEvidence.length === 1 ? '' : 's'} Caught & Resolved)`,
      40,
      currentY
    );

    autoTable(doc, {
      startY: currentY + 8,
      margin: { left: 40, right: 40 },
      head: [['Bug / Anomaly', 'Impact Protected', 'Resolution Applied']],
      body: audit.bugEvidence.map((ev) => [
        ev.title,
        ev.financialImpact > 0 ? formatPdfCurrency(ev.financialImpact, currency) : 'Quarantined',
        ev.fixApplied,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [242, 88, 32], textColor: [253, 250, 244], fontSize: 9 },
      bodyStyles: { fontSize: 8.5, textColor: [17, 22, 31] },
      columnStyles: {
        0: { cellWidth: 150, fontStyle: 'bold' },
        1: { cellWidth: 95 },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    currentY = (doc as any).lastAutoTable.finalY + 24;
  }

  // Settled Transactions Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(17, 22, 31);
  doc.text(`Certified Settled Ledger (${formatNumber(data.validCount)} Rows)`, 40, currentY);

  autoTable(doc, {
    startY: currentY + 8,
    margin: { left: 40, right: 40 },
    head: [['Row #', 'Date', 'Description', 'Status', `Amount (${currency})`]],
    body: data.transactions.map((t) => [
      `#${t.rowIndex}`,
      t.date || '—',
      t.description || '—',
      t.status || 'Completed',
      formatPdfCurrency(t.amount, currency),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [19, 25, 34], textColor: [242, 238, 230], fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: [17, 22, 31] },
    columnStyles: {
      0: { cellWidth: 45 },
      4: { halign: 'right', fontStyle: 'bold' },
    },
  });

  doc.save(`Track_Report_${getSafeBaseName(data.fileName)}_${currency}.pdf`);
}

/**
 * 2. Direct Multi-Sheet Excel Workbook Download (.xlsx)
 * Generates 3 sheets: Summary, Settled Transactions, and Audit Evidence.
 */
export function downloadExcelReport(
  data: AnalysisResult,
  currency: CurrencyCode,
  exchangeRate: number = 1
) {
  const wb = XLSX.utils.book_new();
  const audit = data.kaneAudit;

  // Sheet 1: Summary
  const summaryRows = [
    ['TRACK — KANE CERTIFIED TRANSACTION REPORT', ''],
    ['File Name', data.fileName],
    ['Generated At', new Date().toLocaleString()],
    ['Display Currency', currency],
    ['Original Base Currency', data.baseCurrency || currency],
    ['Exchange Rate Applied', exchangeRate],
    ['', ''],
    ['Certified Net Total', data.totalAmount],
    ['Gross Volume', data.grossVolume],
    ['Settled Transactions', data.validCount],
    ['Average Transaction', data.averageAmount],
    ['Highest Transaction', data.highestAmount],
    ['Lowest Transaction', data.lowestAmount],
    ['Total Inflows', data.positiveTotal],
    ['Total Outflows', data.negativeTotal],
    ['', ''],
    ['Kane Audit Status', audit?.status === 'self_healed' ? 'Self-Healed & Certified' : 'Certified'],
    ['Initial Buggy Pass Total', audit?.initialBuggyTotal ?? data.totalAmount],
    ['Pending Rows Excluded', audit?.pendingCount ?? 0],
    ['Reversed Rows Excluded', audit?.reversedCount ?? 0],
    ['Invalid Rows Quarantined', data.invalidCount],
    ['Discrepancy Prevented', audit?.healedDifference ?? 0],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

  // Sheet 2: Settled Transactions
  const txRows = data.transactions.map((t) => ({
    'Row #': t.rowIndex,
    Date: t.date || '',
    Description: t.description || '',
    Status: t.status || 'Completed',
    [`Amount (${currency})`]: t.amount,
    'Raw Source Amount': String(t.rawAmount ?? ''),
  }));
  const txSheet = XLSX.utils.json_to_sheet(txRows);
  XLSX.utils.book_append_sheet(wb, txSheet, 'Settled Transactions');

  // Sheet 3: Audit Evidence
  const evidenceRows = (audit?.bugEvidence || []).map((ev) => ({
    Category: ev.type,
    Title: ev.title,
    'Row #': ev.rowIndex ?? 'Multiple',
    'Transaction ID': ev.transactionId || '',
    [`Impact Protected (${currency})`]: ev.financialImpact,
    'Problem Caught': ev.problemDetected,
    'Fix Applied': ev.fixApplied,
    'Verification Proof': ev.verificationCheck,
  }));
  const evidenceSheet =
    evidenceRows.length > 0
      ? XLSX.utils.json_to_sheet(evidenceRows)
      : XLSX.utils.aoa_to_sheet([['No anomalies detected — 0 discrepancies remaining.']]);
  XLSX.utils.book_append_sheet(wb, evidenceSheet, 'Audit Evidence');

  XLSX.writeFile(wb, `Track_Report_${getSafeBaseName(data.fileName)}_${currency}.xlsx`);
}

/**
 * 3. Direct Structured CSV Report Download (.csv)
 */
export function downloadCsvReport(data: AnalysisResult, currency: CurrencyCode) {
  const currencySymbol = CURRENCIES[currency]?.symbol || '$';
  const audit = data.kaneAudit;

  const headerLines = [
    `# TRACK - KANE CERTIFIED TRANSACTION ANALYSIS REPORT`,
    `# File Name: ${data.fileName}`,
    `# Generated At: ${new Date().toLocaleString()}`,
    `# Currency: ${currency} (${currencySymbol})`,
    `# Certified Net Total: ${formatCurrency(data.totalAmount, currency)}`,
    `# Settled Transactions: ${data.validCount}`,
    `# Pending/Reversed Excluded: ${audit ? audit.pendingCount + audit.reversedCount : 0}`,
    `# Invalid Rows Skipped: ${data.invalidCount}`,
    `# Empty Rows Ignored: ${data.emptyRowsSkipped}`,
    `# Average Transaction: ${formatCurrency(data.averageAmount, currency)}`,
    `# Highest Transaction: ${formatCurrency(data.highestAmount, currency)}`,
    `# Lowest Transaction: ${formatCurrency(data.lowestAmount, currency)}`,
    ``,
    `Row Number,Amount (${currency}),Raw Amount,Date,Description,Audit Status`,
  ];

  const transactionLines = data.transactions.map((t) => {
    const desc = t.description ? `"${t.description.replace(/"/g, '""')}"` : '';
    const date = t.date ? `"${t.date.replace(/"/g, '""')}"` : '';
    return `${t.rowIndex},${t.amount},"${String(t.rawAmount).replace(/"/g, '""')}",${date},${desc},Settled (Certified)`;
  });

  const excludedStatusLines = (audit?.excludedStatusRows || []).map((ex) => {
    const desc = ex.description ? `"${ex.description.replace(/"/g, '""')}"` : '';
    const date = ex.date ? `"${ex.date.replace(/"/g, '""')}"` : '';
    return `${ex.rowIndex},${ex.amount},"${String(ex.rawAmount).replace(/"/g, '""')}",${date},${desc},"Excluded (${ex.status})"`;
  });

  const invalidLines = data.invalidRows.map((inv) => {
    const rawVal =
      inv.amountValue !== undefined ? `"${String(inv.amountValue).replace(/"/g, '""')}"` : '""';
    const reason = `"${inv.reason.replace(/"/g, '""')}"`;
    return `${inv.rowIndex},N/A,${rawVal},,${reason},Invalid (Quarantined)`;
  });

  const fullContent = [
    ...headerLines,
    ...transactionLines,
    ...excludedStatusLines,
    ...invalidLines,
  ].join('\n');

  const blob = new Blob([fullContent], { type: 'text/csv;charset=utf-8;' });
  triggerBlobDownload(blob, `Track_Report_${getSafeBaseName(data.fileName)}_${currency}.csv`);
}

/**
 * 4. Direct JSON Audit Report Download (.json)
 */
export function downloadJsonReport(
  data: AnalysisResult,
  currency: CurrencyCode,
  exchangeRate: number = 1
) {
  const payload = {
    generator: 'Track + Kane CLI Verification Protocol',
    exportedAt: new Date().toISOString(),
    fileName: data.fileName,
    currency,
    baseCurrency: data.baseCurrency || currency,
    exchangeRate,
    summary: {
      totalAmount: data.totalAmount,
      netAmount: data.netAmount,
      grossVolume: data.grossVolume,
      validCount: data.validCount,
      invalidCount: data.invalidCount,
      averageAmount: data.averageAmount,
      highestAmount: data.highestAmount,
      lowestAmount: data.lowestAmount,
      positiveTotal: data.positiveTotal,
      negativeTotal: data.negativeTotal,
    },
    kaneAudit: data.kaneAudit,
    settledTransactions: data.transactions.map((t) => ({
      rowIndex: t.rowIndex,
      date: t.date,
      description: t.description,
      status: t.status || 'Completed',
      amount: t.amount,
      rawAmount: t.rawAmount,
    })),
    invalidRows: data.invalidRows.map((r) => ({
      rowIndex: r.rowIndex,
      amountValue: r.amountValue,
      reason: r.reason,
    })),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8;',
  });
  triggerBlobDownload(blob, `Track_Audit_${getSafeBaseName(data.fileName)}_${currency}.json`);
}
