import { NextRequest, NextResponse } from 'next/server';
import { AnalysisResult, CurrencyCode } from '@/types';
import { queryTransactionData } from '@/lib/ai-query-engine';
import { formatCurrency, formatNumber } from '@/lib/formatters';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      question,
      data,
      currency,
    }: {
      question: string;
      data: AnalysisResult;
      currency: CurrencyCode;
    } = body;

    if (!question || !data) {
      return NextResponse.json({ error: 'Missing question or data' }, { status: 400 });
    }

    // Step 1: Programmatic deterministic answer & fact extraction
    const deterministicResult = queryTransactionData(question, data, currency);

    // Step 2: If server has Gemini API configured, refine response while enforcing grounding
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (apiKey) {
      try {
        const matchedContext = deterministicResult.matchedRows && deterministicResult.matchedRows.length > 0
          ? JSON.stringify(deterministicResult.matchedRows, null, 2)
          : JSON.stringify(data.transactions.slice(0, 10), null, 2);

        const prompt = `You are Track AI, an intelligent financial assistant answering a business user's questions about their uploaded transaction data.
CRITICAL CONSTRAINT: You must retrieve information ONLY from the uploaded data provided below and NEVER fabricate or hallucinate answers, amounts, or dates.

VERIFIED PRE-CALCULATED FACTS FOR THIS QUESTION:
"${deterministicResult.answer}"

RELEVANT MATCHED ROWS / DATA CONTEXT:
${matchedContext}

OVERALL DATA SUMMARY:
- File: ${data.fileName}
- Total Sum: ${formatCurrency(data.totalAmount, currency)}
- Total Transactions: ${formatNumber(data.validCount)}
- Average Amount: ${formatCurrency(data.averageAmount, currency)}

USER QUESTION: "${question}"

Respond in 1-2 clear, direct, simple, and professional sentences. Format key amounts, dates, or vendor names in bold. Do not use filler or robotic language.`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 200,
              },
            }),
          }
        );

        if (response.ok) {
          const result = await response.json();
          const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;
          if (generatedText && generatedText.trim().length > 0) {
            return NextResponse.json({
              answer: generatedText.trim(),
              highlights: deterministicResult.highlights,
              matchedRows: deterministicResult.matchedRows,
            });
          }
        }
      } catch (err) {
        console.warn('Gemini chat failed, using deterministic result:', err);
      }
    }

    return NextResponse.json(deterministicResult);
  } catch (error: unknown) {
    console.error('Error processing question:', error);
    return NextResponse.json({ error: 'Failed to process question' }, { status: 500 });
  }
}
