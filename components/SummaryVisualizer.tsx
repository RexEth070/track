'use client';

import React, { useState } from 'react';
import { AnalysisResult, CurrencyCode } from '@/types';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';

interface SummaryVisualizerProps {
  data: AnalysisResult;
  currency: CurrencyCode;
}

export function SummaryVisualizer({ data, currency }: SummaryVisualizerProps) {
  const [activeTab, setActiveTab] = useState<'flow' | 'tiers'>('flow');

  // 1. Cash Flow Data
  const flowChartData = [
    {
      category: 'Incoming',
      amount: data.positiveTotal,
      count: data.positiveCount,
      fill: '#10B981', // subtle emerald
      label: 'Money In',
    },
    {
      category: 'Expenses',
      amount: Math.abs(data.negativeTotal),
      count: data.negativeCount,
      fill: '#F43F5E', // subtle rose
      label: 'Money Out',
    },
    {
      category: 'Net Total',
      amount: Math.max(0, data.totalAmount),
      count: data.validCount,
      fill: '#18181B', // obsidian charcoal
      label: 'Net Balance',
    },
  ];

  const flowConfig: ChartConfig = {
    amount: {
      label: 'Total Value',
      color: '#18181B',
    },
    Incoming: {
      label: 'Incoming Payments',
      color: '#10B981',
    },
    Expenses: {
      label: 'Outgoing Expenses',
      color: '#F43F5E',
    },
    'Net Total': {
      label: 'Net Total',
      color: '#18181B',
    },
  };

  // 2. Transaction Size Tier Breakdown
  const tiers = [
    { name: '< $1k', min: -Infinity, max: 1000, count: 0, sum: 0 },
    { name: '$1k - $10k', min: 1000, max: 10000, count: 0, sum: 0 },
    { name: '$10k - $50k', min: 10000, max: 50000, count: 0, sum: 0 },
    { name: '> $50k', min: 50000, max: Infinity, count: 0, sum: 0 },
  ];

  data.transactions.forEach((tx) => {
    const absVal = Math.abs(tx.amount);
    const tier = tiers.find((t) => absVal >= t.min && absVal < t.max);
    if (tier) {
      tier.count++;
      tier.sum += tx.amount;
    }
  });

  const tierChartData = tiers.map((t) => ({
    tier: t.name,
    count: t.count,
    volume: Math.round(t.sum * 100) / 100,
    fill: '#27272A',
  }));

  const tierConfig: ChartConfig = {
    count: {
      label: 'Transactions',
      color: '#27272A',
    },
    volume: {
      label: 'Volume',
      color: '#71717A',
    },
  };

  return (
    <div className="pt-4 border-t border-[#F4F4F5] space-y-3">
      {/* Visualizer header & tabs */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#71717A] flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[#A1A1AA]" />
          Visual Summary Breakdown
        </span>

        <div className="flex items-center bg-[#F4F4F5] p-0.5 rounded-lg text-[11px] font-medium text-[#71717A]">
          <button
            onClick={() => setActiveTab('flow')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              activeTab === 'flow'
                ? 'bg-white text-[#18181B] shadow-2xs font-semibold'
                : 'hover:text-[#18181B]'
            }`}
          >
            Cash Flow
          </button>
          <button
            onClick={() => setActiveTab('tiers')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              activeTab === 'tiers'
                ? 'bg-white text-[#18181B] shadow-2xs font-semibold'
                : 'hover:text-[#18181B]'
            }`}
          >
            Size Tiers
          </button>
        </div>
      </div>

      {/* Chart Canvas with ChartTooltip and ChartTooltipContent */}
      {activeTab === 'flow' ? (
        <div className="bg-[#FAFAF9] border border-[#E4E4E7] rounded-xl p-3">
          <ChartContainer config={flowConfig} className="h-32 w-full">
            <BarChart
              data={flowChartData}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
            >
              <XAxis type="number" hide />
              <YAxis
                dataKey="category"
                type="category"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#71717A' }}
                width={70}
              />
              <ChartTooltip
                cursor={{ fill: 'rgba(0, 0, 0, 0.04)' }}
                content={
                  <ChartTooltipContent
                    formatter={(val: any, _name: any, item: any) => {
                      const row = item?.payload || {};
                      return (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-3 text-xs">
                            <span className="text-[#71717A]">{row.label}:</span>
                            <span className="font-semibold text-[#18181B] font-mono">
                              {formatCurrency(Number(val), currency)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3 text-[11px] text-[#A1A1AA]">
                            <span>Transactions:</span>
                            <span className="font-medium text-[#71717A]">
                              {formatNumber(row.count)} entries
                            </span>
                          </div>
                        </div>
                      );
                    }}
                  />
                }
              />
              <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                {flowChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>

          {/* Quick Flow Legend */}
          <div className="flex items-center justify-between pt-2 px-2 text-[11px] text-[#71717A] border-t border-[#E4E4E7]/50 mt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Incoming: {formatCurrency(data.positiveTotal, currency)}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Expenses: {formatCurrency(data.negativeTotal, currency)}
            </span>
            <span className="flex items-center gap-1.5 font-medium text-[#18181B]">
              <span className="w-2 h-2 rounded-full bg-[#18181B]" />
              Net: {formatCurrency(data.totalAmount, currency)}
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-[#FAFAF9] border border-[#E4E4E7] rounded-xl p-3">
          <ChartContainer config={tierConfig} className="h-32 w-full">
            <BarChart
              data={tierChartData}
              margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
            >
              <XAxis
                dataKey="tier"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#71717A' }}
              />
              <YAxis hide />
              <ChartTooltip
                cursor={{ fill: 'rgba(0, 0, 0, 0.04)' }}
                content={
                  <ChartTooltipContent
                    formatter={(val: any, _name: any, item: any) => {
                      const row = item?.payload || {};
                      return (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-3 text-xs">
                            <span className="text-[#71717A]">Tier Range:</span>
                            <span className="font-semibold text-[#18181B] font-mono">
                              {row.tier}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3 text-xs">
                            <span className="text-[#71717A]">Count:</span>
                            <span className="font-semibold text-[#18181B]">
                              {formatNumber(row.count)} transactions
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3 text-xs text-[#71717A]">
                            <span>Subtotal:</span>
                            <span className="font-mono text-[#18181B]">
                              {formatCurrency(row.volume, currency)}
                            </span>
                          </div>
                        </div>
                      );
                    }}
                  />
                }
              />
              <Bar dataKey="count" fill="#18181B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>

          <div className="text-[11px] text-[#A1A1AA] text-center pt-2 border-t border-[#E4E4E7]/50 mt-1">
            Hover over any tier to inspect exact volume and transaction concentration
          </div>
        </div>
      )}
    </div>
  );
}
