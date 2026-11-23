import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  AnalysisResult,
  ColumnDetectionResult,
  CurrencyCode,
  InvalidRow,
  RawRow,
  ValidTransaction,
} from '@/types';
import { runKaneIntegrityAudit } from './kane-audit';

// Potential header names for amounts (case-insensitive)
const AMOUNT_PATTERNS = [
  /^amount$/i,
  /^txn[_\s]?amount$/i,
  /^transaction[_\s]?amount$/i,
  /^net[_\s]?amount$/i,
  /^total[_\s]?amount$/i,
  /^total$/i,
  /^value$/i,
  /^price$/i,
  /^sum$/i,
  /^cost$/i,
  /^payment$/i,
  /^gross[_\s]?amount$/i,
  /^debit$/i,
  /^credit$/i,
  /^amt$/i,
  /^balance$/i,
];

// Potential header names for date
const DATE_PATTERNS = [
  /^date$/i,
  /^txn[_\s]?date$/i,
  /^transaction[_\s]?date$/i,
  /^created[_\s]?at$/i,
  /^timestamp$/i,
  /^time$/i,
  /^value[_\s]?date$/i,
  /^posting[_\s]?date$/i,
];

// Potential header names for description
const DESCRIPTION_PATTERNS = [
  /^description$/i,
  /^narrative$/i,
  /^narration$/i,
  /^details$/i,
  /^memo$/i,
  /^reference$/i,
  /^particulars$/i,
  /^merchant$/i,
  /^payee$/i,
  /^beneficiary$/i,
  /^transaction[_\s]?details$/i,
  /^name$/i,
];

// Potential header names for transaction status
const STATUS_PATTERNS = [
  /^status$/i,
  /^txn[_\s]?status$/i,
  /^transaction[_\s]?status$/i,
  /^payment[_\s]?status$/i,
  /^settlement[_\s]?status$/i,
  /^state$/i,
];

/**
 * Clean & parse a numeric amount string.
 * Handles:
 * - "1,234.56"
 * - "(1,234.56)" -> -1234.56 (accounting negative)
 * - "-$1,234.56" or "$ -1,234.56"
 * - "₦ 50,000.00"
 * - "£120.00"
 * - "€99,50" (European comma decimal)
 * - "10000"
 */
export function parseAmount(val: unknown): { value: number | null; error?: string } {
  if (val === null || val === undefined) {
    return { value: null, error: 'Value is empty or null' };
  }

  if (typeof val === 'number') {
    if (isNaN(val) || !isFinite(val)) {
      return { value: null, error: 'Numeric value is NaN or infinite' };
    }
    return { value: val };
  }

  let str = String(val).trim();
  if (str === '') {
    return { value: null, error: 'Amount is blank' };
  }

  // Check accounting negative in parentheses: (123.45)
  let isNegative = false;
  if (/^\((.*)\)$/.test(str)) {
    isNegative = true;
    str = str.replace(/^\((.*)\)$/, '$1').trim();
  } else if (str.startsWith('-')) {
    isNegative = true;
    str = str.substring(1).trim();
  } else if (str.endsWith('-')) {
    isNegative = true;
    str = str.slice(0, -1).trim();
  }

  // Remove common currency symbols and words
  str = str.replace(/[₦$£€]/g, '').trim();
  str = str.replace(/\b(USD|NGN|GBP|EUR|Naira|Dollars|Pounds|Euros)\b/gi, '').trim();

  // If after currency removal, there's a minus sign:
  if (str.startsWith('-')) {
    isNegative = true;
    str = str.substring(1).trim();
  }

  // Check for common non-numeric keywords
  if (/^(n\/a|na|null|none|pending|failed|error|#value!|#ref!)$/i.test(str)) {
    return { value: null, error: `Invalid numeric text: "${val}"` };
  }

  // Handle number formats:
  // 1) "1.234,56" (European thousands dot, decimal comma)
  // 2) "1,234.56" (Standard thousands comma, decimal dot)
  if (/^\d{1,3}(\.\d{3})+,\d+$/.test(str)) {
    // European with thousands separator: 1.234,56 -> 1234.56
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (/^\d+,\d{2}$/.test(str)) {
    // Simple comma decimal: 1234,56 -> 1234.56
    str = str.replace(',', '.');
  } else {
    // Standard comma thousands separator: 1,234,567.89 -> 1234567.89
    str = str.replace(/,/g, '');
  }

  // Now ensure it's a valid floating number
  if (!/^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$/.test(str)) {
    return { value: null, error: `Unable to parse "${val}" as a valid number` };
  }

  const num = parseFloat(str);
  if (isNaN(num) || !isFinite(num)) {
    return { value: null, error: `Invalid number: "${val}"` };
  }

  // Precision rounded to 2 decimal places to avoid standard JS float errors
  const finalValue = isNegative ? -Math.abs(num) : num;
  return { value: Math.round(finalValue * 100) / 100 };
}

/**
 * Detect currency from column values or headers
 */
export function detectCurrencyFromText(sampleTexts: string[]): CurrencyCode | null {
  for (const text of sampleTexts) {
    if (typeof text !== 'string') continue;
    if (text.includes('₦') || /\bNGN\b/i.test(text) || /\bnaira\b/i.test(text)) return 'NGN';
    if (text.includes('£') || /\bGBP\b/i.test(text)) return 'GBP';
    if (text.includes('€') || /\bEUR\b/i.test(text)) return 'EUR';
    if (text.includes('$') || /\bUSD\b/i.test(text)) return 'USD';
  }
  return null;
}

/**
 * Inspect raw headers and samples to find Amount, Date, and Description columns
 */
export function detectColumns(
  headers: string[],
  rows: RawRow[]
): ColumnDetectionResult {
  const candidateAmountColumns: string[] = [];
  let detectedDateCol: string | null = null;
  let detectedDescCol: string | null = null;
  let detectedStatusCol: string | null = null;

  // 1. Check headers with regex patterns
  for (const h of headers) {
    const cleanHeader = h.trim();
    if (AMOUNT_PATTERNS.some((pat) => pat.test(cleanHeader))) {
      candidateAmountColumns.push(cleanHeader);
    }
    if (!detectedDateCol && DATE_PATTERNS.some((pat) => pat.test(cleanHeader))) {
      detectedDateCol = cleanHeader;
    }
    if (!detectedDescCol && DESCRIPTION_PATTERNS.some((pat) => pat.test(cleanHeader))) {
      detectedDescCol = cleanHeader;
    }
    if (!detectedStatusCol && STATUS_PATTERNS.some((pat) => pat.test(cleanHeader))) {
      detectedStatusCol = cleanHeader;
    }
  }

  // 2. If no amount column found by header, inspect numeric sample rows
  if (candidateAmountColumns.length === 0 && rows.length > 0) {
    const sampleRows = rows.slice(0, 15);
    for (const h of headers) {
      let numericCount = 0;
      for (const row of sampleRows) {
        const val = row[h];
        if (val !== undefined && val !== null && val !== '') {
          const { value } = parseAmount(val);
          if (value !== null) numericCount++;
        }
      }
      if (numericCount >= Math.min(3, sampleRows.length) && numericCount / sampleRows.length > 0.6) {
        candidateAmountColumns.push(h);
      }
    }
  }

  // 3. Detect currency from headers and first 20 row values
  const textSamples: string[] = [...headers];
  for (const row of rows.slice(0, 20)) {
    for (const key of Object.keys(row)) {
      if (row[key]) textSamples.push(String(row[key]));
    }
  }
  const detectedCurrency = detectCurrencyFromText(textSamples);

  // Ambiguity rules:
  // - If 0 amount candidates found -> ambiguous
  // - If multiple candidates found (e.g. both 'Debit' and 'Credit', or 'Amount' and 'Fee') -> ambiguous
  const isAmbiguous = candidateAmountColumns.length !== 1;
  const amountColumn = candidateAmountColumns.length === 1 ? candidateAmountColumns[0] : null;

  return {
    amountColumn,
    candidateAmountColumns,
    dateColumn: detectedDateCol,
    descriptionColumn: detectedDescCol,
    statusColumn: detectedStatusCol,
    isAmbiguous,
    detectedCurrency,
    availableColumns: headers,
  };
}

/**
 * Checks if a row is completely empty across all columns
 */
export function isRowEmpty(row: RawRow): boolean {
  return Object.values(row).every((val) => {
    if (val === null || val === undefined) return true;
    if (typeof val === 'string' && val.trim() === '') return true;
    return false;
  });
}

/**
 * Core calculation function (100% programmatic & accurate, guarded by Kane Verification)
 */
export function calculateTransactions(
  rawRows: RawRow[],
  columns: string[],
  amountCol: string,
  fileName: string,
  fileSize: number,
  fileType: string,
  currency: CurrencyCode,
  dateCol?: string,
  descCol?: string,
  statusCol?: string
): AnalysisResult {
  const allParsedTransactions: ValidTransaction[] = [];
  const invalidRows: InvalidRow[] = [];
  let emptyRowsSkipped = 0;

  // Auto-resolve status column if not explicitly passed
  const resolvedStatusCol =
    statusCol || columns.find((h) => STATUS_PATTERNS.some((pat) => pat.test(h.trim())));

  // =========================================================================
  // STAGE 1: Initial Calculation Pass (includes Pending/Reversed by mistake)
  // =========================================================================
  let initialBuggyTotal = 0;

  rawRows.forEach((row, index) => {
    const rowIndex = index + 1; // 1-based index (matching spreadsheet row numbers)

    // Check empty row
    if (isRowEmpty(row)) {
      emptyRowsSkipped++;
      return;
    }

    const rawAmountValue = row[amountCol];
    const { value: parsedNum, error } = parseAmount(rawAmountValue);

    if (parsedNum === null || error) {
      invalidRows.push({
        rowIndex,
        rawRow: row,
        amountValue: rawAmountValue,
        reason: error || 'Invalid amount format',
      });
      return;
    }

    // Buggy initial pass naively adds ALL parsed amounts including Pending & Reversed
    initialBuggyTotal = Math.round((initialBuggyTotal + parsedNum) * 100) / 100;

    // Date, Description & Status extraction
    let dateStr: string | undefined = undefined;
    if (dateCol && row[dateCol]) {
      dateStr = String(row[dateCol]).trim();
    }

    let descStr: string | undefined = undefined;
    if (descCol && row[descCol]) {
      descStr = String(row[descCol]).trim();
    }

    let statusStr: string | undefined = undefined;
    if (resolvedStatusCol && row[resolvedStatusCol] !== undefined && row[resolvedStatusCol] !== null) {
      statusStr = String(row[resolvedStatusCol]).trim();
    }

    allParsedTransactions.push({
      id: `tx-${rowIndex}-${Date.now()}`,
      rowIndex,
      amount: parsedNum,
      rawAmount: rawAmountValue ?? '',
      date: dateStr,
      description: descStr,
      status: statusStr,
      rawRow: row,
    });
  });

  // =========================================================================
  // STAGE 2: Behind-Closed-Doors Kane Integrity Audit & Self-Healing Fix
  // =========================================================================
  const {
    settledTransactions,
    auditedTotal,
    report: kaneReport,
  } = runKaneIntegrityAudit(
    allParsedTransactions,
    invalidRows,
    rawRows.length,
    emptyRowsSkipped,
    initialBuggyTotal
  );

  // Recompute all final metrics strictly from Kane-certified settled transactions
  let positiveTotal = 0;
  let negativeTotal = 0;
  let positiveCount = 0;
  let negativeCount = 0;
  let zeroCount = 0;
  let highestAmount = -Infinity;
  let lowestAmount = Infinity;

  for (const tx of settledTransactions) {
    if (tx.amount > 0) {
      positiveTotal = Math.round((positiveTotal + tx.amount) * 100) / 100;
      positiveCount++;
    } else if (tx.amount < 0) {
      negativeTotal = Math.round((negativeTotal + tx.amount) * 100) / 100;
      negativeCount++;
    } else {
      zeroCount++;
    }
    if (tx.amount > highestAmount) highestAmount = tx.amount;
    if (tx.amount < lowestAmount) lowestAmount = tx.amount;
  }

  const totalAmount = auditedTotal;
  const netAmount = totalAmount;
  const validCount = settledTransactions.length;
  const averageAmount = validCount > 0 ? Math.round((totalAmount / validCount) * 100) / 100 : 0;
  const grossVolume = Math.round((positiveTotal + Math.abs(negativeTotal)) * 100) / 100;

  if (highestAmount === -Infinity) highestAmount = 0;
  if (lowestAmount === Infinity) lowestAmount = 0;

  return {
    fileName,
    fileSize,
    fileType,
    currency,
    baseCurrency: currency,
    totalAmount,
    netAmount,
    grossVolume,
    validCount,
    invalidCount: invalidRows.length,
    emptyRowsSkipped,
    totalRowsRead: rawRows.length,
    averageAmount,
    highestAmount,
    lowestAmount,
    positiveTotal,
    positiveCount,
    negativeTotal,
    negativeCount,
    zeroCount,
    transactions: settledTransactions,
    invalidRows,
    columns,
    amountColumn: amountCol,
    dateColumn: dateCol,
    descriptionColumn: descCol,
    statusColumn: resolvedStatusCol,
    kaneAudit: kaneReport,
    processedAt: new Date().toISOString(),
  };
}

/**
 * Parse CSV file using PapaParse
 */
export async function parseCsvFile(file: File): Promise<{
  rows: RawRow[];
  headers: string[];
}> {
  return new Promise((resolve, reject) => {
    Papa.parse<RawRow>(file, {
      header: true,
      skipEmptyLines: false, // We handle empty rows explicitly to count skipped rows!
      dynamicTyping: false,
      complete: (results) => {
        const headers = results.meta.fields || [];
        // Filter out headers that might be undefined or empty
        const cleanHeaders = headers.map((h) => h.trim()).filter((h) => h.length > 0);
        resolve({
          rows: results.data as RawRow[],
          headers: cleanHeaders,
        });
      },
      error: (error) => reject(new Error(error.message)),
    });
  });
}

/**
 * Parse Excel file (.xlsx, .xls) using SheetJS
 */
export async function parseExcelFile(file: File): Promise<{
  rows: RawRow[];
  headers: string[];
}> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('Workbook contains no sheets.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  // Parse as json with headers
  const rawData = XLSX.utils.sheet_to_json<RawRow>(worksheet, {
    header: 1, // Get raw rows including header row
    blankrows: true,
    raw: false,
  }) as unknown as unknown[][];

  if (rawData.length === 0) {
    return { rows: [], headers: [] };
  }

  // Find header row (first non-empty array)
  let headerRowIndex = 0;
  while (headerRowIndex < rawData.length && (!rawData[headerRowIndex] || rawData[headerRowIndex].length === 0)) {
    headerRowIndex++;
  }

  const rawHeaders = (rawData[headerRowIndex] || []) as string[];
  const headers = rawHeaders.map((h, i) => (h ? String(h).trim() : `Column_${i + 1}`));

  const rows: RawRow[] = [];
  for (let i = headerRowIndex + 1; i < rawData.length; i++) {
    const rowValues = rawData[i] as unknown[];
    const rowObj: RawRow = {};
    headers.forEach((h, colIdx) => {
      const val = rowValues && rowValues[colIdx] !== undefined ? rowValues[colIdx] : '';
      if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
        rowObj[h] = val;
      } else if (val === null || val === undefined) {
        rowObj[h] = val;
      } else {
        rowObj[h] = String(val);
      }
    });
    rows.push(rowObj);
  }

  return { rows, headers };
}
