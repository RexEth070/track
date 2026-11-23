export type CurrencyCode = 'USD' | 'NGN' | 'GBP' | 'EUR';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  locale: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  NGN: { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', locale: 'en-NG' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
};

export type RawValue = string | number | boolean | null | undefined;

export interface RawRow {
  [key: string]: RawValue;
}

export interface ValidTransaction {
  id: string;
  rowIndex: number;
  amount: number;
  rawAmount: RawValue;
  date?: string;
  description?: string;
  status?: string;
  rawRow: RawRow;
}

export interface InvalidRow {
  rowIndex: number;
  rawRow: RawRow;
  amountValue: RawValue;
  reason: string;
}

export interface ExcludedStatusRow {
  rowIndex: number;
  transactionId?: string;
  amount: number;
  rawAmount: RawValue;
  status: string;
  normalizedStatus: 'pending' | 'reversed' | 'other_unsettled';
  date?: string;
  description?: string;
  reason: string;
  rawRow: RawRow;
}

export interface ColumnDetectionResult {
  amountColumn: string | null;
  candidateAmountColumns: string[];
  dateColumn: string | null;
  descriptionColumn: string | null;
  statusColumn: string | null;
  isAmbiguous: boolean;
  detectedCurrency: CurrencyCode | null;
  availableColumns: string[];
}

export interface KaneAuditLog {
  source: 'Kane Verification Agent' | 'Track Calculation Core';
  message: string;
  timestamp: string;
  status: 'info' | 'warning' | 'resolved';
}

export type KaneBugType =
  | 'pending_status'
  | 'reversed_status'
  | 'duplicate_collapse'
  | 'invalid_row';

export interface KaneBugEvidence {
  id: string;
  type: KaneBugType;
  title: string;
  severity: 'critical' | 'high' | 'medium';
  rowIndex?: number;
  transactionId?: string;
  statusValue?: string;
  rawValue?: string;
  financialImpact: number;
  problemDetected: string;
  fixApplied: string;
  verificationCheck: string;
}

export interface KaneAuditReport {
  audited: boolean;
  duplicateValuesDetected: number;
  distinctValues: number;
  anomaliesPrevented: number;
  status: 'passed' | 'self_healed';
  rawCandidateTotal: number;
  initialBuggyTotal: number;
  naiveCollapsedTotal?: number;
  healedDifference?: number;
  pendingCount: number;
  reversedCount: number;
  pendingAmountExcluded: number;
  reversedAmountExcluded: number;
  excludedStatusRows: ExcludedStatusRow[];
  bugEvidence: KaneBugEvidence[];
  reconciliation: {
    totalRowsRead: number;
    validSettledCount: number;
    excludedStatusCount: number;
    invalidRowCount: number;
    emptyRowsSkipped: number;
    isBalanced: boolean;
    parityVerified: boolean;
  };
  logs: KaneAuditLog[];
}

export interface AnalysisResult {
  fileName: string;
  fileSize: number;
  fileType: string;
  currency: CurrencyCode;
  baseCurrency: CurrencyCode;
  
  // Calculations (100% programmatic)
  totalAmount: number; // Net total (inflows + negative expenses)
  netAmount: number; // Explicit net total
  grossVolume: number; // Total gross volume (all transactions combined |inflow| + |outflow|)
  validCount: number;
  invalidCount: number;
  emptyRowsSkipped: number;
  totalRowsRead: number;
  
  // Statistical metrics
  averageAmount: number;
  highestAmount: number;
  lowestAmount: number;
  
  // Breakdown
  positiveTotal: number;
  positiveCount: number;
  negativeTotal: number;
  negativeCount: number;
  zeroCount: number;
  
  // Detailed data
  transactions: ValidTransaction[];
  invalidRows: InvalidRow[];
  columns: string[];
  amountColumn: string;
  dateColumn?: string;
  descriptionColumn?: string;
  statusColumn?: string;
  
  // AI summary & Kane Verification
  aiSummary?: string;
  kaneAudit?: KaneAuditReport;
  processedAt: string;
}

export type ProcessingStep = 
  | 'idle'
  | 'reading'
  | 'checking'
  | 'calculating'
  | 'preparing'
  | 'ready'
  | 'ambiguous'
  | 'error';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  dataHighlights?: {
    label: string;
    value: string | number;
  }[];
}
