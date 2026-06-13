import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant =
  | 'primary'
  | 'default'
  | 'secondary'
  | 'danger'
  | 'dangerGhost'
  | 'ghost'
  | 'link'
  | 'success'
  | 'warning'
  | 'filled';

export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonRounded = 'sm' | 'md' | 'lg' | 'full' | 'none';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  rounded?: ButtonRounded;
  loading?: boolean;
  /** 自动加载动画（默认开启）：点击后自动进入轻加载状态 */
  autoLoading?: boolean;
  icon?: ReactNode;
  iconOnly?: boolean;
  block?: boolean;
}
