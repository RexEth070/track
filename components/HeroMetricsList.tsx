'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AnalysisResult, CurrencyCode } from '@/types';
import { formatCurrency, formatNumber } from '@/lib/formatters';

interface MetricItem {
  id: string;
  name: string;
  value: string;
  description: string;
  icon: string;
  color: string;
  valueColor: string;
}

interface HeroMetricsListProps {
  data: AnalysisResult;
  currency: CurrencyCode;
}

export function HeroMetricsList({ data, currency }: HeroMetricsListProps) {
  const isMixed = data.negativeCount > 0 && data.positiveCount > 0;

  const items: MetricItem[] = isMixed
    ? [
        {
          id: 'net-balance',
          name: 'Net Balance',
          value: formatCurrency(data.totalAmount, currency),
          description: 'Cash balance after expenses',
          icon: '⚖️',
          color: '#18181B',
          valueColor: data.totalAmount < 0 ? 'text-rose-600' : 'text-[#18181B]',
        },
        {
          id: 'incoming',
          name: `Incoming (${formatNumber(data.positiveCount)})`,
          value: `+${formatCurrency(data.positiveTotal, currency)}`,
          description: 'Money in from payments',
          icon: '💸',
          color: '#059669',
          valueColor: 'text-emerald-700',
        },
        {
          id: 'expenses',
          name: `Expenses (${formatNumber(data.negativeCount)})`,
          value: formatCurrency(data.negativeTotal, currency),
          description: 'Money out from deductions',
          icon: '📉',
          color: '#E11D48',
          valueColor: 'text-rose-700',
        },
        {
          id: 'average',
          name: 'Average Amount',
          value: formatCurrency(data.averageAmount, currency),
          description: `Across ${formatNumber(data.validCount)} entries`,
          icon: '📊',
          color: '#4F46E5',
          valueColor: 'text-[#18181B]',
        },
        {
          id: 'largest',
          name: 'Largest Payment',
          value: formatCurrency(data.highestAmount, currency),
          description: 'Peak inflow recorded',
          icon: '🏆',
          color: '#D97706',
          valueColor: 'text-emerald-700',
        },
      ]
    : [
        {
          id: 'average',
          name: 'Average Amount',
          value: formatCurrency(data.averageAmount, currency),
          description: `Across ${formatNumber(data.validCount)} entries`,
          icon: '📊',
          color: '#18181B',
          valueColor: 'text-[#18181B]',
        },
        {
          id: 'largest',
          name: 'Largest Record',
          value: formatCurrency(data.highestAmount, currency),
          description: 'Peak amount recorded',
          icon: '🏆',
          color: '#D97706',
          valueColor: 'text-emerald-700',
        },
        {
          id: 'smallest',
          name: 'Smallest Record',
          value: formatCurrency(data.lowestAmount, currency),
          description: 'Lowest amount recorded',
          icon: '🏷️',
          color: '#71717A',
          valueColor: 'text-[#18181B]',
        },
      ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused || items.length <= 1) return;

    // Changes every 2 seconds
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [items.length, isPaused]);

  const currentItem = items[currentIndex] || items[0];

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="w-full max-w-[320px] flex flex-col justify-center select-none"
    >
      <div className="relative h-[52px] w-full flex items-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentItem.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-full"
          >
            <div className="flex items-center justify-between gap-3 px-1 py-1 bg-transparent transition-colors">
              <div className="flex items-center gap-2.5 truncate">
                <div
                  className="flex size-7 items-center justify-center rounded-md shrink-0 text-white shadow-2xs"
                  style={{ backgroundColor: currentItem.color }}
                >
                  <span className="text-xs">{currentItem.icon}</span>
                </div>

                <div className="flex flex-col overflow-hidden text-left leading-tight">
                  <span className="text-xs font-semibold text-[#18181B] truncate">
                    {currentItem.name}
                  </span>
                  <span className="text-[10px] text-[#71717A] truncate">
                    {currentItem.description}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span
                  className={cn(
                    'text-xs sm:text-sm font-bold font-mono tracking-tight',
                    currentItem.valueColor
                  )}
                >
                  {currentItem.value}
                </span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Clean tiny step dots */}
      <div className="flex items-center justify-end gap-1 pt-1.5 pr-1">
        {items.map((_, idx) => (
          <span
            key={idx}
            className={cn(
              'h-1 rounded-full transition-all duration-300',
              idx === currentIndex ? 'w-3.5 bg-[#18181B]' : 'w-1 bg-[#E4E4E7]'
            )}
          />
        ))}
      </div>
    </div>
  );
}
