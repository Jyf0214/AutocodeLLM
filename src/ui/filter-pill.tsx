'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface FilterPillProps {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

const baseStyles =
  'shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 active:scale-95 whitespace-nowrap';

export function FilterPill({ selected, onClick, children, icon, className = '' }: FilterPillProps) {
  const selectedStyles = 'bg-zinc-900 text-white shadow-sm';
  const unselectedStyles = 'bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-300 hover:text-zinc-700';

  return (
    <button type="button" className={cn(baseStyles, selected ? selectedStyles : unselectedStyles, className)} onClick={onClick}>
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}
