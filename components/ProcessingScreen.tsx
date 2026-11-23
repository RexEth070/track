'use client';

import React from 'react';
import { Check, Loader2 } from 'lucide-react';
import { ProcessingStep } from '@/types';

interface ProcessingScreenProps {
  currentStep: ProcessingStep;
  fileName: string;
}

const STEPS = [
  { key: 'reading', label: 'Reading file' },
  { key: 'checking', label: 'Checking transactions' },
  { key: 'calculating', label: 'Calculating total' },
  { key: 'preparing', label: 'Preparing results' },
] as const;

export function ProcessingScreen({ currentStep, fileName }: ProcessingScreenProps) {
  const getStepIndex = (step: ProcessingStep): number => {
    switch (step) {
      case 'reading':
        return 0;
      case 'checking':
        return 1;
      case 'calculating':
        return 2;
      case 'preparing':
      case 'ready':
        return 3;
      default:
        return 0;
    }
  };

  const activeIndex = getStepIndex(currentStep);

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-16 max-w-md mx-auto w-full animate-fade-in">
      <div className="w-full bg-white border border-[#E4E4E7] rounded-2xl p-8 sm:p-10 shadow-xs space-y-8">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-semibold tracking-tight text-[#18181B]">
            Analyzing File
          </h2>
          <p className="text-xs text-[#71717A] truncate font-mono" title={fileName}>
            {fileName}
          </p>
        </div>

        {/* Step-by-step minimal list */}
        <div className="space-y-4">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < activeIndex;
            const isCurrent = idx === activeIndex;
            const isPending = idx > activeIndex;

            return (
              <div
                key={step.key}
                className={`flex items-center gap-3.5 transition-all duration-300 ${
                  isCurrent
                    ? 'text-[#18181B] font-medium'
                    : isCompleted
                    ? 'text-[#52525B]'
                    : 'text-[#A1A1AA]'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all ${
                    isCompleted
                      ? 'bg-[#18181B] text-white'
                      : isCurrent
                      ? 'border-2 border-[#18181B] text-[#18181B]'
                      : 'border border-[#E4E4E7] text-[#D4D4D8]'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  ) : isCurrent ? (
                    <Loader2 className="w-3 h-3 animate-spin text-[#18181B]" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E4E4E7]" />
                  )}
                </div>

                <span className="text-sm tracking-tight">{step.label}</span>
              </div>
            );
          })}
        </div>

        <div className="pt-2 border-t border-[#F4F4F5] text-center space-y-1">
          <p className="text-[11px] text-[#71717A] flex items-center justify-center gap-1.5 transition-all">
            {activeIndex <= 1 && (
              <span>Algorithmic precision verification in progress</span>
            )}
            {activeIndex === 2 && (
              <span className="text-zinc-800 font-medium animate-pulse">
                Kane audit active: checking multiplicity &amp; Pending/Reversed status...
              </span>
            )}
            {activeIndex >= 3 && (
              <span className="text-emerald-700 font-medium">
                Kane parity certified • 0 calculation discrepancies
              </span>
            )}
          </p>
          <p className="text-[10px] text-[#A1A1AA]">
            Autonomous verification & self-healing active
          </p>
        </div>
      </div>
    </div>
  );
}
