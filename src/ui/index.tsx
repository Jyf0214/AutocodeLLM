// AutocodeLLM UI 组件兼容层
// 包含 antd 重导出 + 自定义 Tailwind 组件

'use client';

import React from 'react';
import {
  Button as AntdButton,
  Form as AntdForm,
  Input as AntdInput,
  Avatar as AntdAvatar,
  Alert as AntdAlert,
  Modal as AntdModal,
  Empty as AntdEmpty,
  Segmented as AntdSegmented,
} from 'antd';

// ============================================================
// antd 直接重导出
// ============================================================

export const Button = AntdButton;
export const Form = AntdForm;
export const Input = AntdInput;
export const Alert = AntdAlert;
export const Modal = AntdModal;
export const Empty = AntdEmpty;

// ============================================================
// 自定义 Tailwind 组件
// ============================================================

export { Button as CustomButton } from '@/ui/button';
export type { ButtonProps as CustomButtonProps, ButtonVariant, ButtonSize, ButtonRounded } from '@/ui/button';
export { PageContainer as TailwindPageContainer } from '@/ui/page-container';
export { EmptyState } from '@/ui/empty-state';
export { FilterPill } from '@/ui/filter-pill';
export { ProCard } from '@/ui/pro-card';
export { Tag as StatusTag } from '@/ui/tag';

// ============================================================
// Avatar 组件（扩展 antd Avatar）
// ============================================================

export interface AvatarProps extends React.ComponentProps<typeof AntdAvatar> {
  avatar?: React.ReactNode;
  background?: string;
}

const LobeAvatar = React.forwardRef<HTMLSpanElement, AvatarProps>(
  ({ avatar, background, style, children, ...rest }, ref) => {
    return (
      <AntdAvatar
        ref={ref}
        style={{
          background,
          ...style,
        }}
        {...rest}
      >
        {avatar ?? children}
      </AntdAvatar>
    );
  },
);
LobeAvatar.displayName = 'LobeAvatar';
(LobeAvatar as any).Group = AntdAvatar.Group;

export const Avatar = LobeAvatar;

// ============================================================
// Flexbox 布局组件
// ============================================================

export interface FlexboxProps {
  children?: React.ReactNode;
  gap?: number | string;
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline' | 'flex-start' | 'flex-end';
  justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly' | 'flex-start' | 'flex-end';
  horizontal?: boolean;
  vertical?: boolean;
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse' | 'vertical' | 'horizontal';
  flex?: string | number | boolean;
  padding?: number | string;
  margin?: number | string;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
  id?: string;
  ref?: React.Ref<HTMLDivElement>;
  wrap?: boolean;
}

const alignMap: Record<string, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
  baseline: 'baseline',
  'flex-start': 'flex-start',
  'flex-end': 'flex-end',
};

const justifyMap: Record<string, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  'space-between': 'space-between',
  'space-around': 'space-around',
  'space-evenly': 'space-evenly',
  'flex-start': 'flex-start',
  'flex-end': 'flex-end',
};

export const Flexbox = React.forwardRef<HTMLDivElement, FlexboxProps>(
  (
    {
      children,
      gap,
      align,
      justify,
      horizontal,
      vertical,
      direction,
      flex,
      padding,
      margin,
      style,
      className,
      onClick,
      id,
      wrap,
    },
    ref,
  ) => {
    const resolveDirection = (d?: string): string => {
      if (d === 'vertical' || d === 'column') return 'column';
      if (d === 'horizontal' || d === 'row') return 'row';
      if (d === 'row-reverse') return 'row-reverse';
      if (d === 'column-reverse') return 'column-reverse';
      return '';
    };
    const flexDirection = resolveDirection(direction) || (vertical ? 'column' : horizontal ? 'row' : 'row');
    return (
      <div
        ref={ref}
        className={className}
        id={id}
        onClick={onClick}
        style={{
          display: 'flex',
          flexDirection: flexDirection as React.CSSProperties['flexDirection'],
          gap,
          alignItems: align ? alignMap[align] : undefined,
          justifyContent: justify ? justifyMap[justify] : undefined,
          flex: flex === true ? 1 : (flex as React.CSSProperties['flex']),
          padding,
          margin,
          flexWrap: wrap ? 'wrap' : undefined,
          ...style,
        }}
      >
        {children}
      </div>
    );
  },
);

Flexbox.displayName = 'Flexbox';

// ============================================================
// Text 文本组件
// ============================================================

export interface TextProps {
  children?: React.ReactNode;
  size?: number;
  type?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  strong?: boolean;
  code?: boolean;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
}

const typeColorMap: Record<string, string> = {
  primary: 'var(--ant-color-text)',
  secondary: 'var(--ant-color-text-secondary)',
  success: 'var(--ant-color-success)',
  warning: 'var(--ant-color-warning)',
  danger: 'var(--ant-color-error)',
};

export const Text: React.FC<TextProps> = ({
  children,
  size,
  type,
  strong,
  code,
  style,
  className,
  onClick,
}) => {
  return (
    <span
      className={className}
      onClick={onClick}
      style={{
        fontSize: size,
        fontWeight: strong ? 'bold' : 'normal',
        fontFamily: code ? 'monospace' : 'inherit',
        color: type ? typeColorMap[type] : undefined,
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
    >
      {children}
    </span>
  );
};

// ============================================================
// ThemeProvider 主题提供者
// ============================================================

export interface ThemeProviderProps {
  children?: React.ReactNode;
  themeMode?: 'light' | 'dark';
  theme?: 'light' | 'dark';
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, themeMode = 'light', theme }) => {
  const mode = theme ?? themeMode;
  return (
    <div data-theme={mode} style={{ colorScheme: mode, minHeight: '100%' }}>
      {children}
    </div>
  );
};

// ============================================================
// ThemeSwitch 主题切换
// ============================================================

export interface ThemeSwitchProps {
  themeMode?: 'auto' | 'light' | 'dark';
  onThemeSwitch?: (mode: 'auto' | 'light' | 'dark') => void;
  labels?: { auto?: string; dark?: string; light?: string };
}

export const ThemeSwitch: React.FC<ThemeSwitchProps> = ({ themeMode = 'auto', onThemeSwitch, labels }) => (
  <AntdSegmented
    size="small"
    value={themeMode}
    onChange={(v) => onThemeSwitch?.(v as 'auto' | 'light' | 'dark')}
    options={[
      { label: labels?.light ?? '☀️', value: 'light' },
      { label: labels?.auto ?? '🔄', value: 'auto' },
      { label: labels?.dark ?? '🌙', value: 'dark' },
    ]}
  />
);

// ============================================================
// InputPassword 密码输入框
// ============================================================

export interface InputPasswordProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  size?: 'large' | 'middle' | 'small';
  style?: React.CSSProperties;
  prefix?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export const InputPassword: React.FC<InputPasswordProps> = ({ value, onChange, placeholder, size, style, prefix, disabled, className }) => (
  <AntdInput.Password value={value} onChange={(e) => onChange?.(e.target.value)} placeholder={placeholder} size={size} style={style} prefix={prefix} disabled={disabled} className={className} />
);

// ============================================================
// PageContainer 统一页面容器（黑白极简风）
// ============================================================

const maxWidthPresets = {
  lg: 1200,
  md: 900,
  sm: 720,
  full: '100%',
} as const;

const paddingPresets = {
  default: '32px 16px 32px',
  compact: '24px 16px 24px',
} as const;

export interface PageContainerProps {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  extra?: React.ReactNode;
  /** maxWidth preset: 'lg' (1200px), 'md' (900px), 'sm' (720px), 'full' (100%), or a custom number */
  maxWidth?: 'lg' | 'md' | 'sm' | 'full' | number;
  /** padding preset: 'default' (32px 16px 32px) or 'compact' (24px 16px 24px) */
  padding?: 'default' | 'compact';
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  title,
  subtitle,
  extra,
  maxWidth = 'lg',
  padding = 'default',
}) => {
  const resolvedMaxWidth = typeof maxWidth === 'number' ? maxWidth : maxWidthPresets[maxWidth];
  const resolvedPadding = paddingPresets[padding];
  return (
  <div style={{ maxWidth: resolvedMaxWidth, margin: '0 auto', padding: resolvedPadding }}>
    {(title ?? extra) && (
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          {title && (
            <h1
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              {title}
            </h1>
          )}
          {subtitle && (
            <p
              style={{
                fontSize: 14,
                color: 'var(--text-tertiary)',
                margin: '4px 0 0',
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {extra && <div>{extra}</div>}
      </div>
    )}
    {children}
  </div>
  );
};
