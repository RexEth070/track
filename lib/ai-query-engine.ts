import { AnalysisResult, CurrencyCode, ValidTransaction } from '@/types';
import { formatCurrency, formatNumber } from './formatters';

export interface AnswerResponse {
  answer: string;
  highlights?: { label: string; value: string | number }[];
  matchedRows?: ValidTransaction[];
}

/**
 * Deterministically answers questions from the parsed transaction dataset
 * ensuring 100% mathematical precision and zero hallucinations.
 */
export function queryTransactionData(
  query: string,
  data: AnalysisResult,
  currency: CurrencyCode
): AnswerResponse {
  const q = query.trim().toLowerCase();

  // 1. Ordinal / Index Queries: e.g. "60th transaction", "70th transaction", "transaction #12", "row 5"
  const ordinalMatch = q.match(/(\d+)(?:st|nd|rd|th)?\s+(?:transaction|entry|payment|record)/i) ||
    q.match(/(?:transaction|entry|row|record)\s*(?:#|number\s+)?(\d+)/i);

  if (ordinalMatch) {
    const targetNum = parseInt(ordinalMatch[1], 10);
    // Find transaction by 1-based index or rowIndex
    const tx = data.transactions[targetNum - 1] || data.transactions.find((t) => t.rowIndex === targetNum);

    if (!tx) {
      return {
        answer: `Transaction #${targetNum} was not found. The dataset contains **${formatNumber(
          data.validCount
        )}** valid transactions (ranging from #1 to #${data.validCount}).`,
      };
    }

    // Inspect fields from transaction and rawRow
    const desc = tx.description || String(tx.rawRow['Description'] || tx.rawRow['Particulars'] || tx.rawRow['Name'] || 'Not specified');
    const date = tx.date || String(tx.rawRow['Transaction Date'] || tx.rawRow['Date'] || 'Not specified');
    const category = tx.rawRow['Category'] ? String(tx.rawRow['Category']) : undefined;
    const status = tx.rawRow['Status'] ? String(tx.rawRow['Status']) : undefined;
    const txnId = tx.rawRow['Transaction ID'] ? String(tx.rawRow['Transaction ID']) : undefined;
    const formattedAmt = formatCurrency(tx.amount, currency);

    // If user specifically asked for "date"
    if (q.includes('date') || q.includes('when') || q.includes('day')) {
      return {
        answer: `The **${targetNum}th transaction**${txnId ? ` (${txnId})` : ''} was recorded on **${date}** for **${formattedAmt}** (${desc}).`,
        highlights: [
          { label: 'Transaction Number', value: `#${targetNum}` },
          { label: 'Date', value: date },
          { label: 'Amount', value: formattedAmt },
          { label: 'Description', value: desc },
        ],
        matchedRows: [tx],
      };
    }

    // If user asked "what was it used for" or "category" or "purpose"
    if (q.includes('used for') || q.includes('purpose') || q.includes('category') || q.includes('for')) {
      const categoryText = category ? ` in the **${category}** category` : '';
      return {
        answer: `The **${targetNum}th transaction** was used for **${desc}**${categoryText}, with a total of **${formattedAmt}** on **${date}**.`,
        highlights: [
          { label: 'Transaction Number', value: `#${targetNum}` },
          { label: 'Used For', value: desc },
          ...(category ? [{ label: 'Category', value: category }] : []),
          { label: 'Amount', value: formattedAmt },
          { label: 'Date', value: date },
        ],
        matchedRows: [tx],
      };
    }

    // If user asked "who was it sent to" or "recipient" or "payee" or "merchant"
    if (q.includes('who') || q.includes('sent to') || q.includes('recipient') || q.includes('merchant') || q.includes('payee') || q.includes('vendor')) {
      return {
        answer: `The **${targetNum}th transaction** was sent to / from **${desc}** on **${date}** for **${formattedAmt}**.`,
        highlights: [
          { label: 'Transaction Number', value: `#${targetNum}` },
          { label: 'Party / Description', value: desc },
          { label: 'Amount', value: formattedAmt },
          { label: 'Date', value: date },
        ],
        matchedRows: [tx],
      };
    }

    // General transaction lookup
    return {
      answer: `The **${targetNum}th transaction** was on **${date}** for **${desc}** totaling **${formattedAmt}**${category ? ` (${category})` : ''}.`,
      highlights: [
        { label: 'Transaction Number', value: `#${targetNum}` },
        { label: 'Amount', value: formattedAmt },
        { label: 'Description', value: desc },
        { label: 'Date', value: date },
      ],
      matchedRows: [tx],
    };
  }

  // 2. Specific Merchant / Vendor / Keyword Search: e.g. "how much did we pay AWS?", "Slack", "payroll"
  // Extract potential keyword from query
  const searchKeywords = ['aws', 'slack', 'google', 'payroll', 'wework', 'stripe', 'acme', 'refund', 'laptop', 'hardware', 'travel', 'legal', 'meta', 'advertising'];
  const matchedKeyword = searchKeywords.find((kw) => q.includes(kw));

  if (matchedKeyword) {
    const matches = data.transactions.filter((tx) => {
      const desc = (tx.description || '').toLowerCase();
      const rawText = JSON.stringify(tx.rawRow).toLowerCase();
      return desc.includes(matchedKeyword) || rawText.includes(matchedKeyword);
    });

    if (matches.length > 0) {
      const sum = matches.reduce((acc, t) => acc + t.amount, 0);
      return {
        answer: `Found **${matches.length}** transaction${
          matches.length === 1 ? '' : 's'
        } related to **"${matchedKeyword.toUpperCase()}"**, totaling **${formatCurrency(
          sum,
          currency
        )}**.`,
        highlights: [
          { label: 'Keyword', value: matchedKeyword.toUpperCase() },
          { label: 'Transactions Found', value: matches.length },
          { label: 'Total Volume', value: formatCurrency(sum, currency) },
        ],
        matchedRows: matches.slice(0, 10),
      };
    }
  }

  // 3. First / Last transaction
  if (q.includes('first transaction') || q.includes('earliest transaction')) {
    const first = data.transactions[0];
    if (first) {
      return {
        answer: `The first transaction in this file is dated **${first.date || 'unknown'}** for **${first.description || 'unspecified'}** totaling **${formatCurrency(first.amount, currency)}**.`,
        highlights: [
          { label: 'Row', value: `#${first.rowIndex}` },
          { label: 'Amount', value: formatCurrency(first.amount, currency) },
          { label: 'Date', value: first.date || 'N/A' },
        ],
        matchedRows: [first],
      };
    }
  }

  if (q.includes('last transaction') || q.includes('latest transaction')) {
    const last = data.transactions[data.transactions.length - 1];
    if (last) {
      return {
        answer: `The last transaction in this file is dated **${last.date || 'unknown'}** for **${last.description || 'unspecified'}** totaling **${formatCurrency(last.amount, currency)}**.`,
        highlights: [
          { label: 'Row', value: `#${last.rowIndex}` },
          { label: 'Amount', value: formatCurrency(last.amount, currency) },
          { label: 'Date', value: last.date || 'N/A' },
        ],
        matchedRows: [last],
      };
    }
  }

  // 4. Largest / Highest / Maximum transaction
  if (
    q.includes('largest') ||
    q.includes('highest') ||
    q.includes('maximum') ||
    q.includes('biggest') ||
    q.includes('max')
  ) {
    const sorted = [...data.transactions].sort((a, b) => b.amount - a.amount);
    const top = sorted[0];
    if (!top) {
      return { answer: 'There are no valid transactions recorded.' };
    }

    const desc = top.description ? ` (${top.description})` : '';
    const date = top.date ? ` on ${top.date}` : '';
    return {
      answer: `The largest transaction was **${formatCurrency(
        top.amount,
        currency
      )}**${desc}${date} at row #${top.rowIndex}.`,
      highlights: [
        { label: 'Largest Transaction', value: formatCurrency(top.amount, currency) },
        { label: 'Row Number', value: `#${top.rowIndex}` },
        ...(top.description ? [{ label: 'Description', value: top.description }] : []),
      ],
      matchedRows: sorted.slice(0, 5),
    };
  }

  // 5. Smallest / Lowest / Minimum transaction
  if (
    q.includes('smallest') ||
    q.includes('lowest') ||
    q.includes('minimum') ||
    q.includes('min')
  ) {
    const sorted = [...data.transactions].sort((a, b) => a.amount - b.amount);
    const lowest = sorted[0];
    if (!lowest) {
      return { answer: 'There are no valid transactions recorded.' };
    }

    const desc = lowest.description ? ` (${lowest.description})` : '';
    const date = lowest.date ? ` on ${lowest.date}` : '';
    return {
      answer: `The lowest transaction was **${formatCurrency(
        lowest.amount,
        currency
      )}**${desc}${date} at row #${lowest.rowIndex}.`,
      highlights: [
        { label: 'Lowest Transaction', value: formatCurrency(lowest.amount, currency) },
        { label: 'Row Number', value: `#${lowest.rowIndex}` },
        ...(lowest.description ? [{ label: 'Description', value: lowest.description }] : []),
      ],
      matchedRows: sorted.slice(0, 5),
    };
  }

  // 6. Filtering: "above X", "greater than X", "more than X", "> X"
  const aboveMatch = q.match(/(?:above|greater than|more than|>|over)\s*[$₦£€]?\s*([\d,]+(?:\.\d+)?)/i);
  if (aboveMatch) {
    const threshold = parseFloat(aboveMatch[1].replace(/,/g, ''));
    if (!isNaN(threshold)) {
      const matches = data.transactions.filter((tx) => tx.amount > threshold);
      const subTotal = matches.reduce((sum, tx) => sum + tx.amount, 0);

      if (matches.length === 0) {
        return {
          answer: `No transactions were found above **${formatCurrency(
            threshold,
            currency
          )}**. The highest single transaction in this file is ${formatCurrency(
            data.highestAmount,
            currency
          )}.`,
          highlights: [{ label: 'Matching Transactions', value: 0 }],
        };
      }

      return {
        answer: `Found **${matches.length}** transaction${
          matches.length === 1 ? '' : 's'
        } above **${formatCurrency(threshold, currency)}**, totaling **${formatCurrency(
          subTotal,
          currency
        )}** (representing ${((subTotal / (data.totalAmount || 1)) * 100).toFixed(
          1
        )}% of total volume).`,
        highlights: [
          { label: 'Count', value: matches.length },
          { label: 'Subtotal', value: formatCurrency(subTotal, currency) },
          { label: 'Threshold', value: formatCurrency(threshold, currency) },
        ],
        matchedRows: matches.slice(0, 10),
      };
    }
  }

  // 7. Filtering: "below X", "less than X", "< X", "under X"
  const belowMatch = q.match(/(?:below|less than|under|<)\s*[$₦£€]?\s*([\d,]+(?:\.\d+)?)/i);
  if (belowMatch) {
    const threshold = parseFloat(belowMatch[1].replace(/,/g, ''));
    if (!isNaN(threshold)) {
      const matches = data.transactions.filter((tx) => tx.amount < threshold);
      const subTotal = matches.reduce((sum, tx) => sum + tx.amount, 0);

      return {
        answer: `Found **${matches.length}** transaction${
          matches.length === 1 ? '' : 's'
        } below **${formatCurrency(threshold, currency)}**, totaling **${formatCurrency(
          subTotal,
          currency
        )}**.`,
        highlights: [
          { label: 'Count', value: matches.length },
          { label: 'Subtotal', value: formatCurrency(subTotal, currency) },
          { label: 'Threshold', value: formatCurrency(threshold, currency) },
        ],
        matchedRows: matches.slice(0, 10),
      };
    }
  }

  // 8. Total amount / Gross vs Net
  if (
    q.includes('total amount') ||
    q.includes('total value') ||
    q.includes('total sum') ||
    q.includes('what is the total') ||
    q.includes('overall sum') ||
    q.includes('gross') ||
    q.includes('net') ||
    q === 'total'
  ) {
    const gross = data.grossVolume || Math.round((data.positiveTotal + Math.abs(data.negativeTotal)) * 100) / 100;
    if (data.negativeCount > 0) {
      return {
        answer: `The **Total Transaction Value (Gross Volume)** across all transactions is **${formatCurrency(
          gross,
          currency
        )}** (combining both incoming payments and expenses). The **Net Balance** after expenses is **${formatCurrency(
          data.totalAmount,
          currency
        )}**.`,
        highlights: [
          { label: 'Gross Total Volume', value: formatCurrency(gross, currency) },
          { label: 'Net Balance', value: formatCurrency(data.totalAmount, currency) },
          { label: 'Incoming Inflows', value: formatCurrency(data.positiveTotal, currency) },
          { label: 'Outgoing Expenses', value: formatCurrency(data.negativeTotal, currency) },
        ],
      };
    }
    return {
      answer: `The total transaction amount is **${formatCurrency(
        data.totalAmount,
        currency
      )}** calculated across **${formatNumber(data.validCount)}** valid transactions.`,
      highlights: [
        { label: 'Total Amount', value: formatCurrency(data.totalAmount, currency) },
        { label: 'Processed Transactions', value: formatNumber(data.validCount) },
      ],
    };
  }

  // 9. Count / How many transactions
  if (
    q.includes('how many') ||
    q.includes('count') ||
    q.includes('number of transactions') ||
    q.includes('transactions processed')
  ) {
    return {
      answer: `**${formatNumber(
        data.validCount
      )}** valid transactions were successfully processed from ${
        data.fileName
      }.${
        data.invalidCount > 0
          ? ` Additionally, ${data.invalidCount} invalid row${
              data.invalidCount === 1 ? '' : 's were'
            } flagged and excluded.`
          : ' Zero invalid rows were encountered.'
      }${
        data.emptyRowsSkipped > 0
          ? ` (${data.emptyRowsSkipped} empty row${
              data.emptyRowsSkipped === 1 ? '' : 's'
            } ignored).`
          : ''
      }`,
      highlights: [
        { label: 'Valid Transactions', value: formatNumber(data.validCount) },
        { label: 'Invalid / Skipped Rows', value: formatNumber(data.invalidCount) },
        { label: 'Empty Rows Ignored', value: formatNumber(data.emptyRowsSkipped) },
      ],
    };
  }

  // 10. Average transaction
  if (
    q.includes('average') ||
    q.includes('mean') ||
    q.includes('avg')
  ) {
    return {
      answer: `The average transaction amount is **${formatCurrency(
        data.averageAmount,
        currency
      )}** across ${formatNumber(data.validCount)} valid entries.`,
      highlights: [
        { label: 'Average Amount', value: formatCurrency(data.averageAmount, currency) },
        { label: 'Total Volume', value: formatCurrency(data.totalAmount, currency) },
      ],
    };
  }

  // 11. Negative / Outflow / Refunds / Deductions
  if (
    q.includes('negative') ||
    q.includes('refund') ||
    q.includes('debit') ||
    q.includes('deduction') ||
    q.includes('expense')
  ) {
    if (data.negativeCount === 0) {
      return {
        answer: 'There are no negative transactions in this file. All amounts are positive or zero.',
        highlights: [{ label: 'Negative Transactions', value: 0 }],
      };
    }
    return {
      answer: `There are **${data.negativeCount}** negative transactions totaling **${formatCurrency(
        data.negativeTotal,
        currency
      )}**.`,
      highlights: [
        { label: 'Negative Count', value: data.negativeCount },
        { label: 'Negative Total', value: formatCurrency(data.negativeTotal, currency) },
      ],
      matchedRows: data.transactions.filter((tx) => tx.amount < 0).slice(0, 5),
    };
  }

  // 12. Positive / Inflow / Credits
  if (
    q.includes('positive') ||
    q.includes('credit') ||
    q.includes('income') ||
    q.includes('revenue')
  ) {
    return {
      answer: `There are **${data.positiveCount}** positive transactions totaling **${formatCurrency(
        data.positiveTotal,
        currency
      )}**.`,
      highlights: [
        { label: 'Positive Count', value: data.positiveCount },
        { label: 'Positive Total', value: formatCurrency(data.positiveTotal, currency) },
      ],
    };
  }

  // 13. Invalid rows / skipped data
  if (
    q.includes('invalid') ||
    q.includes('skipped') ||
    q.includes('error') ||
    q.includes('failed')
  ) {
    if (data.invalidCount === 0) {
      return {
        answer: 'All non-empty rows in this file were valid. No rows were skipped due to invalid amounts.',
        highlights: [{ label: 'Invalid Rows', value: 0 }],
      };
    }

    const reasons = data.invalidRows.slice(0, 3).map((r) => `Row #${r.rowIndex}: ${r.reason}`).join('; ');
    return {
      answer: `**${data.invalidCount}** row${
        data.invalidCount === 1 ? ' was' : 's were'
      } skipped due to invalid or unparseable amounts. Examples: ${reasons}.`,
      highlights: [
        { label: 'Invalid Rows', value: data.invalidCount },
        { label: 'Valid Rows', value: data.validCount },
      ],
    };
  }

  // Default fallback: clear comprehensive overview
  return {
    answer: `Based on **${data.fileName}**: The total value is **${formatCurrency(
      data.totalAmount,
      currency
    )}** across **${formatNumber(data.validCount)}** transactions. The average amount is **${formatCurrency(
      data.averageAmount,
      currency
    )}**, ranging from **${formatCurrency(
      data.lowestAmount,
      currency
    )}** to **${formatCurrency(data.highestAmount, currency)}**.`,
    highlights: [
      { label: 'Total', value: formatCurrency(data.totalAmount, currency) },
      { label: 'Count', value: formatNumber(data.validCount) },
      { label: 'Average', value: formatCurrency(data.averageAmount, currency) },
      { label: 'Peak', value: formatCurrency(data.highestAmount, currency) },
    ],
  };
}

/**
 * Generate a concise, plain-English summary of the file
 */
export function generateExecutiveSummary(
  data: AnalysisResult,
  currency: CurrencyCode
): string {
  const parts: string[] = [];

  parts.push(
    `We counted **${formatNumber(data.validCount)}** valid transactions in **${data.fileName}**, giving a total of **${formatCurrency(
      data.totalAmount,
      currency
    )}**.`
  );

  if (data.positiveCount > 0 && data.negativeCount > 0) {
    parts.push(
      `This includes ${formatNumber(data.positiveCount)} incoming payments (${formatCurrency(
        data.positiveTotal,
        currency
      )}) and ${formatNumber(data.negativeCount)} expenses (${formatCurrency(
        data.negativeTotal,
        currency
      )}).`
    );
  }

  parts.push(
    `The average transaction was **${formatCurrency(
      data.averageAmount,
      currency
    )}**. Your largest payment was **${formatCurrency(
      data.highestAmount,
      currency
    )}** and your biggest expense was **${formatCurrency(data.lowestAmount, currency)}**.`
  );

  if (data.invalidCount > 0) {
    parts.push(
      `⚠️ **${data.invalidCount}** row${
        data.invalidCount === 1 ? ' had an unreadable amount and was' : 's had unreadable amounts and were'
      } skipped so your total stays accurate.`
    );
  } else {
    parts.push(`Every row had a clean, readable amount.`);
  }

  return parts.join(' ');
}
