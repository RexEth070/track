'use client';

import React, { useRef, useState } from 'react';
import { Logo } from './Logo';
import { UploadCloud, FileSpreadsheet, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { createSampleCsvFile } from '@/lib/sample-data';

interface MainUploadScreenProps {
  onFileSelected: (file: File) => void;
  isLoading?: boolean;
}

export function MainUploadScreen({
  onFileSelected,
  isLoading = false,
}: MainUploadScreenProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndHandleFile = (file: File) => {
    setErrorMessage(null);
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const fileNameLower = file.name.toLowerCase();
    const isValid = validExtensions.some((ext) => fileNameLower.endsWith(ext));

    if (!isValid) {
      setErrorMessage('Please upload a valid CSV or Excel file (.csv, .xlsx, .xls).');
      return;
    }

    if (file.size === 0) {
      setErrorMessage('The selected file is empty.');
      return;
    }

    onFileSelected(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndHandleFile(droppedFile);
    }
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndHandleFile(e.target.files[0]);
    }
  };

  const handleLoadSample = () => {
    const sample = createSampleCsvFile();
    onFileSelected(sample);
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 py-12 max-w-4xl mx-auto w-full animate-fade-in">
      <div className="w-full max-w-2xl text-center space-y-3 mb-8">
        <div className="flex justify-center mb-4">
          <Logo size="lg" />
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-[44px] font-bold tracking-tight text-[#18181B] leading-tight">
          Your transactions. Calculated.
        </h1>

        <p className="text-base sm:text-lg text-[#71717A] max-w-lg mx-auto font-normal">
          Upload your monthly transaction file to get the total in seconds.
        </p>
      </div>

      {/* Main Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
        className={`w-full max-w-2xl border-2 border-dashed rounded-2xl p-8 sm:p-14 text-center cursor-pointer transition-all duration-200 select-none group relative bg-white ${
          isDragOver
            ? 'border-[#18181B] bg-[#F4F4F5]/60 scale-[1.008]'
            : 'border-[#E4E4E7] hover:border-[#A1A1AA] hover:bg-[#FAFAF9]'
        } ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          onChange={handleInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#F4F4F5] border border-[#E4E4E7] flex items-center justify-center text-[#18181B] transition-transform group-hover:scale-105">
            <UploadCloud className="w-6 h-6 stroke-[1.8]" />
          </div>

          <div className="space-y-1.5">
            <p className="text-base sm:text-lg font-medium text-[#18181B]">
              Drop your transaction file here, or{' '}
              <span className="text-[#18181B] underline underline-offset-4 font-semibold group-hover:text-black">
                browse files
              </span>
            </p>
            <p className="text-xs sm:text-sm text-[#71717A]">
              Supports CSV, XLSX, and XLS formats (up to 50MB)
            </p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleBrowseClick();
            }}
            className="mt-2 inline-flex items-center gap-2 bg-[#18181B] hover:bg-[#27272A] text-white text-sm font-medium px-5 py-2.5 rounded-lg shadow-xs transition-all active:scale-[0.98]"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Browse Files
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg max-w-md text-center">
          {errorMessage}
        </div>
      )}

      {/* Instant Sample File Loader */}
      <div className="mt-6 flex items-center justify-center gap-2">
        <button
          onClick={handleLoadSample}
          className="inline-flex items-center gap-1.5 text-xs text-[#52525B] hover:text-[#18181B] px-3 py-1.5 rounded-full border border-[#E4E4E7] bg-white hover:bg-[#F4F4F5] transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#71717A]" />
          <span>Try with sample business transactions</span>
          <ArrowRight className="w-3 h-3 text-[#71717A]" />
        </button>
      </div>

      {/* Privacy note */}
      <div className="mt-10 flex items-center justify-center gap-2 text-xs text-[#71717A] max-w-sm text-center">
        <Lock className="w-3.5 h-3.5 shrink-0 text-[#A1A1AA]" />
        <span>Files are processed securely. Your financial data stays private.</span>
      </div>
    </div>
  );
}
