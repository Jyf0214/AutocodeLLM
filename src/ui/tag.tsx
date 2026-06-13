import React from 'react';
import { cn } from '@/lib/cn';

interface TagProps {
  children: React.ReactNode;
  color?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

const tagColors: Record<string, string> = {
  default: 'bg-zinc-100 text-zinc-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  error: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
};

export function Tag({ children, color = 'default', className }: TagProps) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', tagColors[color], className)}>
      {children}
    </span>
  );
}
