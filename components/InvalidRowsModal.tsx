'use client';

import React from 'react';
import { InvalidRow } from '@/types';
import { AlertCircle, X } from 'lucide-react';

interface InvalidRowsModalProps {
  invalidRows: InvalidRow[];
  onClose: () => void;
}

export function InvalidRowsModal({ invalidRows, onClose }: InvalidRowsModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white border border-[#E4E4E7] rounded-2xl max-w-2xl w-full shadow-lg overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-[#E4E4E7] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#18181B]">
                Skipped Invalid Rows ({invalidRows.length})
              </h3>
              <p className="text-xs text-[#71717A]">
                These rows could not be parsed as valid numeric amounts and were not added to the total.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#71717A] hover:text-[#18181B] p-1.5 rounded-lg hover:bg-[#F4F4F5] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="border border-[#E4E4E7] rounded-lg overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-[#FAFAF9] border-b border-[#E4E4E7] text-[#71717A] font-medium">
                <tr>
                  <th className="p-3 w-16">Row #</th>
                  <th className="p-3">Amount Value</th>
                  <th className="p-3">Reason Excluded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F4F5]">
                {invalidRows.map((inv, idx) => (
                  <tr key={idx} className="hover:bg-[#FAFAF9]">
                    <td className="p-3 font-mono font-medium text-[#71717A]">
                      #{inv.rowIndex}
                    </td>
                    <td className="p-3 font-mono text-amber-700 font-medium">
                      {inv.amountValue !== undefined && inv.amountValue !== null && String(inv.amountValue).trim() !== ''
                        ? String(inv.amountValue)
                        : '<blank>'}
                    </td>
                    <td className="p-3 text-[#52525B]">{inv.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-4 border-t border-[#E4E4E7] bg-[#FAFAF9] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium bg-[#18181B] hover:bg-[#27272A] text-white rounded-lg transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
