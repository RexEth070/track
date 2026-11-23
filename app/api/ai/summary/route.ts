import { NextRequest, NextResponse } from 'next/server';
import { AnalysisResult, CurrencyCode } from '@/types';
import { generateExecutiveSummary } from '@/lib/ai-query-engine';
import { formatCurrency, formatNumber } from '@/lib/formatters';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, currency }: { data: AnalysisResult; currency: CurrencyCode } = body;

    if (!data) {
      return NextResponse.json({ error: 'Missing transaction data' }, { status: 400 });
    }

    const deterministicSummary = generateExecutiveSummary(data, currency);

    // If an external Gemini API key is configured on server-side:
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (apiKey) {
      try {
        const prompt = `You are Track AI.
Write a 2-3 sentence summary explaining these transaction results in simple, everyday English.
Do NOT use financial jargon like "comprises", "inflows", "outflows", or "net volume". Use simple everyday terms like "incoming payments", "expenses", "total", "average", and "skipped".
DO NOT recalculate or invent any numbers. Use ONLY the verified numbers below:
- File Name: ${data.fileName}
- Currency: ${currency} (${formatCurrency(data.totalAmount, currency)})
- Total Valid Transactions: ${formatNumber(data.validCount)}
- Total Sum: ${formatCurrency(data.totalAmount, currency)}
- Average Amount: ${formatCurrency(data.averageAmount, currency)}
- Highest Transaction: ${formatCurrency(data.highestAmount, currency)}
- Lowest Transaction: ${formatCurrency(data.lowestAmount, currency)}
- Incoming Payments: ${formatCurrency(data.positiveTotal, currency)} (${data.positiveCount} items)
- Expenses: ${formatCurrency(data.negativeTotal, currency)} (${data.negativeCount} items)
- Invalid / Skipped Rows: ${data.invalidCount}

Tone: Friendly, clear, simple everyday English.`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 250,
              },
            }),
          }
        );

        if (response.ok) {
          const result = await response.json();
          const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;
          if (generatedText && generatedText.trim().length > 0) {
            return NextResponse.json({ summary: generatedText.trim() });
          }
        }
      } catch (err) {
        console.warn('Gemini API call failed, falling back to deterministic summary:', err);
      }
    }

    return NextResponse.json({ summary: deterministicSummary });
  } catch (error: unknown) {
    console.error('Error generating summary:', error);
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}
