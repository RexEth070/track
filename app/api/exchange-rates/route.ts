import { NextResponse } from 'next/server';
import { CurrencyCode } from '@/types';

// Up-to-date fallback market rates (USD base) used only if live FX endpoint is unreachable
const FALLBACK_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  NGN: 1550,
  GBP: 0.79,
  EUR: 0.92,
};

let cachedPayload: {
  rates: Record<CurrencyCode, number>;
  updatedAt: string;
  source: 'live' | 'fallback';
  fetchedAtMs: number;
} | null = null;

const ONE_HOUR_MS = 60 * 60 * 1000;

export async function GET() {
  const now = Date.now();
  if (cachedPayload && cachedPayload.source === 'live' && now - cachedPayload.fetchedAtMs < ONE_HOUR_MS) {
    return NextResponse.json({
      rates: cachedPayload.rates,
      updatedAt: cachedPayload.updatedAt,
      source: cachedPayload.source,
    });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`FX API responded with status ${res.status}`);
    }

    const json = await res.json();
    const apiRates = json?.rates;

    if (
      apiRates &&
      typeof apiRates.NGN === 'number' &&
      typeof apiRates.GBP === 'number' &&
      typeof apiRates.EUR === 'number'
    ) {
      const rates: Record<CurrencyCode, number> = {
        USD: 1,
        NGN: Number(apiRates.NGN),
        GBP: Number(apiRates.GBP),
        EUR: Number(apiRates.EUR),
      };

      const updatedAt = json.time_last_update_utc || new Date().toISOString();

      cachedPayload = {
        rates,
        updatedAt,
        source: 'live',
        fetchedAtMs: now,
      };

      return NextResponse.json({
        rates,
        updatedAt,
        source: 'live',
      });
    }

    throw new Error('Unexpected FX API payload format');
  } catch (err) {
    console.warn('Live FX fetch failed, serving fallback market rates:', err);
    return NextResponse.json({
      rates: FALLBACK_RATES,
      updatedAt: new Date().toISOString(),
      source: 'fallback',
    });
  }
}
