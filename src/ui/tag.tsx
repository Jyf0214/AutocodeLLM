import { type ReactNode, memo } from 'react';
import { cn } from '@/lib/cn';

type TagVariant = 'light' | 'dark' | 'outline' | 'emerald' | 'amber' | 'danger' | 'success' | 'warning';
type TagSize = 'xs' | 'sm' | 'md' | 'lg';

const variantStyles: Record<TagVariant, string> = {
  light: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  dark: 'bg-zinc-900 text-white border-zinc-800',
  outline: 'bg-white text-zinc-500 border-zinc-200',
  emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-100 text-amber-700 border-amber-200',
  danger: 'bg-red-100 text-red-700 border-red-200',
  success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
};

const sizeStyles: Record<TagSize, string> = {
  xs: 'px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full',
  sm: 'px-2 py-0.5 text-xs rounded',
  md: 'px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full',
  lg: 'px-4 py-1.5 text-sm font-medium rounded-full',
};

/** 旧版 color → variant 映射 */
const colorToVariant: Record<string, TagVariant> = {
  default: 'light',
  success: 'success',
  error: 'danger',
  danger: 'danger',
  warning: 'warning',
  info: 'light',
  processing: 'emerald',
  green: 'success',
  red: 'danger',
};

export interface TagProps {
  children: ReactNode;
  variant?: TagVariant;
  /** @deprecated 改用 variant */
  color?: string;
  size?: TagSize;
  className?: string;
  onClick?: () => void;
}

/**
 * 自定义标签组件 — 支持 8 种变体、4 种尺寸
 * - variant: light/dark/outline/emerald/amber/danger/success/warning
 * - color: 兼容旧版 (default/success/error/warning/info → 自动映射)
 */
export const Tag = memo<TagProps>(({ children, variant, color, size = 'md', className, onClick }) => {
  const resolvedVariant = variant ?? (color ? (colorToVariant[color] ?? 'light') : 'light');
  return (
    <span
      className={cn(
        'inline-block border',
        variantStyles[resolvedVariant],
        sizeStyles[size],
        onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
        className,
      )}
      onClick={onClick}
    >
      {children}
    </span>
  );
});

Tag.displayName = 'Tag';
export default Tag;
