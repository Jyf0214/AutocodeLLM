import React from 'react';
import { cn } from '@/lib/cn';

interface ProCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
  hover?: boolean;
}

export function ProCard({ children, className, padding = true, hover = false }: ProCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-zinc-200 shadow-sm',
        padding && 'p-5',
        hover && 'hover:shadow-md hover:border-zinc-300 transition-all duration-200',
        className,
      )}
    >
      {children}
    </div>
  );
}
