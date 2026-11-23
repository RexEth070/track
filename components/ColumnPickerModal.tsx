'use client';

import React, { useState } from 'react';
import { ColumnDetectionResult, RawRow } from '@/types';
import { Check, HelpCircle, Columns } from 'lucide-react';

interface ColumnPickerModalProps {
  detection: ColumnDetectionResult;
  sampleRows: RawRow[];
  onConfirm: (amountCol: string, dateCol?: string, descCol?: string) => void;
  onCancel: () => void;
}

export function ColumnPickerModal({
  detection,
  sampleRows,
  onConfirm,
  onCancel,
}: ColumnPickerModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<string>(
    detection.candidateAmountColumns[0] || detection.availableColumns[0] || ''
  );
  const [selectedDate, setSelectedDate] = useState<string>(detection.dateColumn || '');
  const [selectedDesc, setSelectedDesc] = useState<string>(detection.descriptionColumn || '');

  const handleConfirm = () => {
    if (!selectedAmount) return;
    onConfirm(selectedAmount, selectedDate || undefined, selectedDesc || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white border border-[#E4E4E7] rounded-2xl max-w-xl w-full shadow-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-[#E4E4E7]">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-lg bg-[#F4F4F5] border border-[#E4E4E7] flex items-center justify-center text-[#18181B]">
              <Columns className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-semibold text-[#18181B] tracking-tight">
              Select Transaction Columns
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-[#71717A]">
            Please confirm which column represents the transaction amount to ensure an accurate calculation.
          </p>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Amount Column Picker */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#18181B] mb-2">
              Transaction Amount Column <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {detection.availableColumns.map((col) => {
                const isSelected = selectedAmount === col;
                const isCandidate = detection.candidateAmountColumns.includes(col);
                return (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setSelectedAmount(col)}
                    className={`flex items-center justify-between p-3 rounded-lg border text-left text-xs sm:text-sm transition-all ${
                      isSelected
                        ? 'border-[#18181B] bg-[#F4F4F5] font-semibold text-[#18181B]'
                        : 'border-[#E4E4E7] text-[#52525B] hover:border-[#A1A1AA] hover:bg-[#FAFAF9]'
                    }`}
                  >
                    <span className="truncate pr-2">{col}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isCandidate && !isSelected && (
                        <span className="text-[10px] bg-neutral-100 text-[#71717A] px-1.5 py-0.5 rounded">
                          Candidate
                        </span>
                      )}
                      {isSelected && (
                        <Check className="w-4 h-4 text-[#18181B] stroke-[2.5]" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Date & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#F4F4F5]">
            <div>
              <label className="block text-xs font-medium text-[#71717A] mb-1.5">
                Date Column (Optional)
              </label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-white border border-[#E4E4E7] rounded-lg px-3 py-2 text-xs text-[#18181B] focus:outline-hidden focus:border-[#18181B]"
              >
                <option value="">None / Auto</option>
                {detection.availableColumns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#71717A] mb-1.5">
                Description Column (Optional)
              </label>
              <select
                value={selectedDesc}
                onChange={(e) => setSelectedDesc(e.target.value)}
                className="w-full bg-white border border-[#E4E4E7] rounded-lg px-3 py-2 text-xs text-[#18181B] focus:outline-hidden focus:border-[#18181B]"
              >
                <option value="">None / Auto</option>
                {detection.availableColumns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Data Preview */}
          {sampleRows.length > 0 && selectedAmount && (
            <div className="pt-2 border-t border-[#F4F4F5]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[#71717A]">
                  Previewing first {Math.min(3, sampleRows.length)} rows:
                </span>
              </div>
              <div className="border border-[#E4E4E7] rounded-lg overflow-x-auto text-[11px]">
                <table className="w-full text-left">
                  <thead className="bg-[#FAFAF9] border-b border-[#E4E4E7] text-[#71717A]">
                    <tr>
                      <th className="p-2 border-r border-[#E4E4E7]">#</th>
                      {detection.availableColumns.slice(0, 4).map((col) => (
                        <th
                          key={col}
                          className={`p-2 border-r border-[#E4E4E7] last:border-r-0 ${
                            col === selectedAmount ? 'bg-[#F4F4F5] text-[#18181B] font-semibold' : ''
                          }`}
                        >
                          {col} {col === selectedAmount && '(Amount)'}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sampleRows.slice(0, 3).map((row, i) => (
                      <tr key={i} className="border-b border-[#F4F4F5] last:border-b-0">
                        <td className="p-2 text-[#A1A1AA] border-r border-[#E4E4E7]">{i + 1}</td>
                        {detection.availableColumns.slice(0, 4).map((col) => (
                          <td
                            key={col}
                            className={`p-2 border-r border-[#E4E4E7] last:border-r-0 font-mono text-[#52525B] ${
                              col === selectedAmount ? 'bg-[#F4F4F5]/60 font-semibold text-[#18181B]' : ''
                            }`}
                          >
                            {String(row[col] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 border-t border-[#E4E4E7] bg-[#FAFAF9] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-[#71717A] hover:text-[#18181B] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedAmount}
            className="px-5 py-2 text-xs sm:text-sm font-medium bg-[#18181B] hover:bg-[#27272A] text-white rounded-lg shadow-xs transition-all disabled:opacity-50"
          >
            Confirm & Calculate Total
          </button>
        </div>
      </div>
    </div>
  );
}
