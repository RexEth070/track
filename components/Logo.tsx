import React from 'react';
import { Calculator } from 'lucide-react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
}

export function Logo({ className = '', size = 'md' }: LogoProps) {
  const boxClasses =
    size === 'sm'
      ? 'size-7 rounded-md'
      : size === 'lg'
      ? 'size-10 rounded-xl'
      : 'size-9 rounded-lg';

  const iconClasses =
    size === 'sm' ? 'size-4' : size === 'lg' ? 'size-5' : 'size-5';

  const textClasses =
    size === 'sm'
      ? 'text-lg'
      : size === 'lg'
      ? 'text-3xl'
      : 'text-2xl';

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      <span
        className={`grid place-items-center bg-[#131922] text-[#F2EEE6] transition-transform hover:scale-[1.03] ${boxClasses}`}
      >
        <Calculator className={iconClasses} strokeWidth={2} />
      </span>
      <span className={`font-display font-bold tracking-tight text-[#11161F] ${textClasses}`}>
        track
      </span>
    </div>
  );
}
