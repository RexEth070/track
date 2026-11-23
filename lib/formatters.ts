import { CurrencyCode, CURRENCIES } from '@/types';

export function formatCurrency(
  amount: number,
  currencyCode: CurrencyCode = 'USD',
  showDecimals: boolean = true
): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `${CURRENCIES[currencyCode].symbol}0.00`;
  }

  const config = CURRENCIES[currencyCode] || CURRENCIES.USD;
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const formatted = new Intl.NumberFormat(config.locale, {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(absAmount);

  // Return format e.g. "₦1,250.00" or "-₦1,250.00"
  return isNegative ? `-${config.symbol}${formatted}` : `${config.symbol}${formatted}`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}
