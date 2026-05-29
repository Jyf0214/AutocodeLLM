// AutocodeLLM UI 组件兼容层
// 基于 antd 组件库封装，提供统一的组件接口

'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import NextImage from 'next/image';
import {
  Button as AntdButton,
  Form as AntdForm,
  Input as AntdInput,
  Select as AntdSelect,
  Checkbox as AntdCheckbox,
  Radio as AntdRadio,
  Switch as AntdSwitch,
  Slider as AntdSlider,
  Avatar as AntdAvatar,
  Alert as AntdAlert,
  Modal as AntdModal,
  Drawer as AntdDrawer,
  Tooltip as AntdTooltip,
  Popover as AntdPopover,
  Dropdown as AntdDropdown,
  Tag as AntdTag,
  Empty as AntdEmpty,
  Spin as AntdSpin,
  Skeleton as AntdSkeleton,
  Segmented as AntdSegmented,
  Space as AntdSpace,
  Divider as AntdDivider,
  Collapse as AntdCollapse,
  InputNumber as AntdInputNumber,
} from 'antd';

const { TextArea: AntdTextArea } = AntdInput;

// ============================================================
// 直接导出 antd 组件（不重写）
// ============================================================

export const Button = AntdButton;
export const Form = AntdForm;
export const Input = AntdInput;
export const Select = AntdSelect;
export const Checkbox = AntdCheckbox;
export const Radio = AntdRadio;
export const Switch = AntdSwitch;
export const Slider = AntdSlider;
export const Alert = AntdAlert;
export const Modal = AntdModal;
export const Drawer = AntdDrawer;
export const Tooltip = AntdTooltip;
export const Popover = AntdPopover;
export const Dropdown = AntdDropdown;
export const Tag = AntdTag;
export const Empty = AntdEmpty;
export const Spin = AntdSpin;
export const Skeleton = AntdSkeleton;
export const Segmented = AntdSegmented;
export const Space = AntdSpace;
export const Divider = AntdDivider;
export const Collapse = AntdCollapse;
export const InputNumber = AntdInputNumber;

// 类型导出
export type { MenuProps as DropdownMenuProps } from 'antd';
export type { ItemType } from 'antd/es/menu/interface';
export type { SelectProps } from 'antd/es/select';
export type { InputProps } from 'antd/es/input';
export type { ButtonProps } from 'antd/es/button';
export type { ModalProps } from 'antd/es/modal';
export type { PopoverProps } from 'antd/es/popover';
export type { FormItemProps } from 'antd/es/form';
export type { SegmentedProps } from 'antd/es/segmented';
export type { SliderSingleProps } from 'antd/es/slider';
export type { CheckboxProps } from 'antd/es/checkbox';

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
// 布局组件
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
// 文本组件
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
// 图标组件
// ============================================================

export interface IconProps {
  icon?: React.ReactNode | React.ComponentType<any>;
  size?: number;
  onClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
  color?: string;
}

export const Icon: React.FC<IconProps> = ({ icon, size = 24, onClick, style, className, color }) => {
  // 支持 antd 图标组件引用（ForwardRefExoticComponent 等）和 ReactNode
  let renderedIcon: React.ReactNode = icon as React.ReactNode;
  if (icon && !React.isValidElement(icon)) {
    renderedIcon = React.createElement(icon as React.ComponentType<any>, { size, style: { color } });
  }

  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
        cursor: onClick ? 'pointer' : 'default',
        fontSize: size,
        lineHeight: 1,
        color,
        ...style,
      }}
    >
      {renderedIcon}
    </div>
  );
};

// ============================================================
// 操作图标按钮
// ============================================================

export interface ActionIconProps {
  icon?: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  size?: number;
  style?: React.CSSProperties;
  className?: string;
  active?: boolean;
  danger?: boolean;
  title?: string;
  type?: 'default' | 'primary' | 'ghost';
}

export const ActionIcon: React.FC<ActionIconProps> = ({
  icon,
  onClick,
  size = 24,
  style,
  className,
  active,
  danger,
  title,
}) => {
  return (
    <button
      className={className}
      onClick={onClick}
      title={title}
      style={{
        width: size,
        height: size,
        border: 'none',
        background: active ? 'var(--ant-color-bg-text-hover)' : 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 4,
        fontSize: size * 0.6,
        lineHeight: 1,
        transition: 'background 0.2s',
        color: danger ? 'var(--ant-color-error)' : undefined,
        ...style,
      }}
    >
      {icon}
    </button>
  );
};

// ============================================================
// 块级容器
// ============================================================

export const Block: React.FC<{ children?: React.ReactNode; style?: React.CSSProperties; className?: string }> = ({
  children,
  style,
  className,
}) => <div className={className} style={style}>{children}</div>;

// ============================================================
// 居中容器
// ============================================================

export const Center: React.FC<{ children?: React.ReactNode; style?: React.CSSProperties; className?: string }> = ({
  children,
  style,
  className,
}) => (
  <div className={className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}>
    {children}
  </div>
);

// ============================================================
// 主题提供者
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
// Emoji 选择器
// ============================================================

export interface EmojiPickerProps {
  onChange?: (emoji: string) => void;
  shape?: 'square' | 'round';
}

const EMOJI_SETS = [
  { label: '表情', items: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🥰', '😍', '🤩', '😘', '😋', '🤪', '😎', '🤗', '🤔', '😐', '😏'] },
  { label: '手势', items: ['👍', '👎', '👏', '🙌', '🤝', '✌️', '🤞', '🤙', '💪', '🫶', '👋', '🤘', '✊', '👊', '🤛', '🤜', '☝️', '👆', '👇', '👈'] },
  { label: '符号', items: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '💝', '🔥', '⭐', '🌟', '💫', '✨', '⚡', '💎', '🏆', '🎯', '🚀'] },
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onChange, shape = 'square' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => { setOpen(!open); }}
        style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 20, borderRadius: shape === 'round' ? '50%' : 4, padding: 4, lineHeight: 1 }}
      >
        😊
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 1000, background: 'var(--ant-color-bg-container, #fff)', border: '1px solid var(--ant-color-border, #d9d9d9)', borderRadius: 8, padding: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', width: 280, maxHeight: 240, overflowY: 'auto' }}>
          {EMOJI_SETS.map((set) => (
            <div key={set.label} style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 11, color: '#999', marginBottom: 2 }}>{set.label}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {set.items.map((emoji) => (
                  <button key={emoji} onClick={() => { onChange?.(emoji); setOpen(false); }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, padding: 4, borderRadius: 4, lineHeight: 1 }}>
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================
// 快捷键显示
// ============================================================

export interface HotKeyProps { keys?: string[]; children?: React.ReactNode }

export const Hotkey: React.FC<HotKeyProps> = ({ keys, children }) => {
  if (keys && keys.length > 0) {
    return (
      <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
        {keys.map((key, i) => (
          <kbd key={i} style={{ padding: '2px 6px', fontSize: 11, fontFamily: 'monospace', background: 'var(--ant-color-bg-container)', border: '1px solid var(--ant-color-border)', borderRadius: 4 }}>
            {key}
          </kbd>
        ))}
      </span>
    );
  }
  return <>{children}</>;
};

// ============================================================
// 文本高亮
// ============================================================

export interface HighlighterProps { children?: React.ReactNode; highlight?: string }

export const Highlighter: React.FC<HighlighterProps> = ({ children, highlight }) => {
  if (!highlight || typeof children !== 'string') return <>{children}</>;
  const parts = children.split(new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark key={i} style={{ background: 'var(--ant-color-warning-bg)', padding: '0 2px', borderRadius: 2 }}>{part}</mark>
        ) : (<span key={i}>{part}</span>),
      )}
    </span>
  );
};

// ============================================================
// 可排序列表
// ============================================================

export interface SortableListProps { items?: any[]; children?: React.ReactNode; onChange?: (items: any[]) => void }
export const SortableList: React.FC<SortableListProps> = ({ children }) => <>{children}</>;

// ============================================================
// 带输入的滑块
// ============================================================

export interface SliderWithInputProps { value?: number; onChange?: (value: number) => void; min?: number; max?: number; step?: number }

export const SliderWithInput: React.FC<SliderWithInputProps> = ({ value, onChange, min = 0, max = 100, step = 0.1 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
    <AntdSlider min={min} max={max} step={step} value={value} onChange={(v) => onChange?.(v)} style={{ flex: 1 }} />
    <AntdInputNumber min={min} max={max} step={step} value={value} onChange={(v) => onChange?.(v ?? 0)} style={{ width: 70 }} size="small" />
  </div>
);

// ============================================================
// Markdown 渲染
// ============================================================

const LazyReactMarkdown = React.lazy(() => import('react-markdown'));

export interface MarkdownProps { children?: string; style?: React.CSSProperties; className?: string }

export const Markdown: React.FC<MarkdownProps> = ({ children, style, className }) => {
  return (
    <div className={className} style={{ lineHeight: 1.6, ...style }}>
      <React.Suspense fallback={<div>{children}</div>}>
        <LazyReactMarkdown>{children ?? ''}</LazyReactMarkdown>
      </React.Suspense>
    </div>
  );
};

// ============================================================
// Fluent Emoji
// ============================================================

export const FluentEmoji: React.FC<{ emoji?: string; size?: number }> = ({ emoji, size = 24 }) => (
  <span style={{ fontSize: size, lineHeight: 1, display: 'inline-block' }}>{emoji}</span>
);

// ============================================================
// 文件类型图标
// ============================================================

const fileTypeEmojiMap: Record<string, string> = { image: '🖼️', pdf: '📄', code: '💻', text: '📝', video: '🎬', audio: '🎵', archive: '📦', spreadsheet: '📊', presentation: '📽️', document: '📃' };

export const FileTypeIcon: React.FC<{ type?: string; size?: number }> = ({ type, size = 24 }) => (
  <span style={{ fontSize: size, lineHeight: 1, display: 'inline-block' }}>{(type && fileTypeEmojiMap[type]) ?? '📄'}</span>
);

export const MaterialFileTypeIcon: React.FC<{ type?: string; size?: number }> = ({ type, size = 24 }) => <FileTypeIcon type={type} size={size} />;

// ============================================================
// 图片组件
// ============================================================

export interface ImageProps { src?: string; alt?: string; width?: number | string; height?: number | string; style?: React.CSSProperties; onClick?: () => void; preview?: boolean }

export const Image: React.FC<ImageProps> = ({ src, alt, width, height, style, onClick, preview: _preview }) => {
  const isExternal = src?.startsWith('http');
  const numericWidth = typeof width === 'number' ? width : parseInt(String(width), 10);
  const numericHeight = typeof height === 'number' ? height : parseInt(String(height), 10);

  if (isExternal || !numericWidth || !numericHeight) {
    return (
      <span
        role="img"
        aria-label={alt}
        onClick={onClick}
        style={{
          display: 'inline-block',
          maxWidth: '100%',
          width: numericWidth || 'auto',
          height: numericHeight || 'auto',
          backgroundImage: src ? `url(${src})` : 'none',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          objectFit: 'contain',
          cursor: onClick ? 'pointer' : undefined,
          ...style,
        }}
      />
    );
  }
  return <NextImage src={src || ''} alt={alt || ''} width={numericWidth} height={numericHeight} onClick={onClick} style={{ maxWidth: '100%', objectFit: 'contain', cursor: onClick ? 'pointer' : undefined, ...style }} />;
};

// ============================================================
// 折叠面板
// ============================================================

export const Accordion: React.FC<{ items?: any[]; children?: React.ReactNode; activeKey?: string | string[]; onChange?: (key: string | string[]) => void }> = ({ children, activeKey, onChange }) => (
  <AntdCollapse activeKey={activeKey} onChange={onChange}>{children}</AntdCollapse>
);

export const AccordionItem: React.FC<{ children?: React.ReactNode; title?: string; key?: string }> = ({ children, title, key: itemKey }) => (
  <AntdCollapse.Panel header={title} key={itemKey ?? title ?? 'item'}>{children}</AntdCollapse.Panel>
);

// ============================================================
// 密码输入框
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
// 模态框上下文 Hook
// ============================================================

export interface useModalContextReturn { close?: () => void }
const ModalContext = createContext<useModalContextReturn>({ close: () => { /* no-op */ } });
export const useModalContext = (): useModalContextReturn => useContext(ModalContext);

// ============================================================
// 滚动阴影容器
// ============================================================

export interface ScrollShadowProps { children?: React.ReactNode; style?: React.CSSProperties; className?: string; size?: number }

export const ScrollShadow: React.FC<ScrollShadowProps> = ({ children, style, className, size = 64 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [showTop, setShowTop] = useState(false);
  const [showBottom, setShowBottom] = useState(false);

  const updateShadows = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setShowTop(el.scrollTop > 0);
    setShowBottom(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    updateShadows();
    el.addEventListener('scroll', updateShadows);
    const observer = new ResizeObserver(updateShadows);
    observer.observe(el);
    return () => { el.removeEventListener('scroll', updateShadows); observer.disconnect(); };
  }, [updateShadows]);

  return (
    <div style={{ position: 'relative', overflow: 'hidden', ...style }} className={className}>
      {showTop && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: size, background: 'linear-gradient(to bottom, var(--ant-color-bg-container), transparent)', pointerEvents: 'none', zIndex: 1 }} />}
      <div ref={ref} style={{ overflow: 'auto', height: '100%', position: 'relative' }}>{children}</div>
      {showBottom && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: size, background: 'linear-gradient(to top, var(--ant-color-bg-container), transparent)', pointerEvents: 'none', zIndex: 1 }} />}
    </div>
  );
};

// ============================================================
// 搜索栏
// ============================================================

export interface SearchBarProps { value?: string; onChange?: (value: string) => void; onSearch?: (value: string) => void; placeholder?: string; style?: React.CSSProperties; allowClear?: boolean }

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, onSearch, placeholder, style, allowClear = true }) => (
  <AntdInput.Search value={value} onChange={(e) => onChange?.(e.target.value)} onSearch={onSearch} placeholder={placeholder} allowClear={allowClear} style={style} />
);

// ============================================================
// 预览组
// ============================================================

export const PreviewGroup: React.FC<{ children?: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => <div style={style}>{children}</div>;

// ============================================================
// 颜色色板
// ============================================================

export const primaryColors: Record<string, string> = {
  red: '#f5222d', volcano: '#fa541c', orange: '#fa8c16', gold: '#faad14', yellow: '#fadb14',
  lime: '#a0d911', green: '#52c41a', cyan: '#13c2c2', blue: '#333333', geekblue: '#2f54eb',
  purple: '#722ed1', magenta: '#eb2f96',
};

export interface ColorSwatchesProps { colors?: { color: string; title?: string }[]; value?: string; onChange?: (color: string) => void; size?: number }

export const ColorSwatches: React.FC<ColorSwatchesProps> = ({ colors = [], value, onChange, size = 24 }) => (
  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
    {colors.map((item, i) => (
      <div key={i} onClick={() => onChange?.(item.color)} title={item.title ?? item.color} style={{ width: size, height: size, borderRadius: '50%', background: item.color, cursor: 'pointer', border: value === item.color ? '2px solid var(--ant-color-primary)' : '2px solid transparent', transition: 'border-color 0.2s' }} />
    ))}
  </div>
);

// ============================================================
// 代码编辑器
// ============================================================

export interface CodeEditorProps { value?: string; onChange?: (value: string) => void; language?: string; readOnly?: boolean; style?: React.CSSProperties; height?: number | string }

export const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, language: _language, readOnly, style, height = 200 }) => (
  <AntdTextArea value={value} onChange={(e) => onChange?.(e.target.value)} readOnly={readOnly} style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: 1.5, height, resize: 'vertical', ...style }} />
);

// ============================================================
// 复制按钮
// ============================================================

export interface CopyButtonProps { content?: string; onClick?: () => void; style?: React.CSSProperties }

export const CopyButton: React.FC<CopyButtonProps> = ({ content, onClick, style }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    if (content) navigator.clipboard.writeText(content).then(() => { setCopied(true); setTimeout(() => { setCopied(false); }, 2000); });
    onClick?.();
  }, [content, onClick]);
  return <AntdButton size="small" type="text" onClick={handleCopy} style={style}>{copied ? '✓' : '📋'}</AntdButton>;
};

// ============================================================
// 提示组
// ============================================================

export const TooltipGroup: React.FC<{ children?: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ display: 'flex', gap: 4, alignItems: 'center', ...style }}>{children}</div>
);

// ============================================================
// 模态框创建工具
// ============================================================

export interface ModalInstance { destroy: () => void; update: (props: Record<string, any>) => void }

export function createModal(options: { content?: React.ReactNode; title?: React.ReactNode; width?: number; footer?: React.ReactNode; onOk?: () => void; onCancel?: () => void }): ModalInstance {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  let currentProps = { ...options };
  const destroy = () => { root.unmount(); container.remove(); };
  const update = (newProps: Record<string, any>) => { currentProps = { ...currentProps, ...newProps }; render(currentProps); };
  const render = (props: typeof options) => {
    root.render(<AntdModal open title={props.title} width={props.width} footer={props.footer} onOk={props.onOk} onCancel={() => { props.onCancel?.(); destroy(); }} destroyOnHidden>{props.content}</AntdModal>);
  };
  render(currentProps);
  return { destroy, update };
}

export function createRawModal(Component: React.ComponentType<any>, props: Record<string, any> = {}): ModalInstance {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const destroy = () => { root.unmount(); container.remove(); };
  const update = (newProps: Record<string, any>) => { props = { ...props, ...newProps }; render(); };
  const render = () => { root.render(<Component {...props} />); };
  render();
  return { destroy, update };
}

// ============================================================
// Popover 上下文 Hook
// ============================================================

const PopoverContext = createContext<{ close?: () => void }>({});
export const usePopoverContext = () => useContext(PopoverContext);

// ============================================================
// TextArea 组件
// ============================================================

export interface TextAreaProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  style?: React.CSSProperties;
  [key: string]: unknown;
}

export const TextArea: React.FC<TextAreaProps> = (props) => <AntdTextArea {...props} />;

// ============================================================
// 内联图标组件
// ============================================================

export const BrainOffIcon = () => <span>🧠✕</span>;
export const GlobeOffIcon = () => <span>🌐✕</span>;
export const SkillsIcon = () => <span>⚡</span>;

// ============================================================
// 主题常量
// ============================================================

export const LOBE_THEME_APP_ID = 'autocodellm-app';

// ============================================================
// 快捷键组合
// ============================================================

export enum KeyEnum {
  Mod = '⌘',
  Alt = '⌥',
  Shift = '⇧',
  Ctrl = '⌃',
  Enter = '↵',
  Backspace = '⌫',
  Tab = '⇥',
  Escape = '⎋',
}

export function combineKeys(keys: string[]): string { return keys.join(''); }

// ============================================================
// 样式工具
// ============================================================

export const lobeStaticStylish = {
  noScrollbar: { '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' } as React.CSSProperties,
};

// ============================================================
// 工具函数
// ============================================================

export const stopPropagation = (e: any) => { e?.stopPropagation(); };
export const copyToClipboard = async (text: string): Promise<boolean> => { try { await navigator.clipboard.writeText(text); return true; } catch { return false; } };

// ============================================================
// 布局组件（替代 @lobehub/ui 的 SideNav/Header/Menu/ThemeSwitch/Layout/LayoutMain）
// ============================================================
import { Layout as AntdLayout, Menu as AntdMenu } from 'antd';

const { Sider, Header: AntdHeader, Content } = AntdLayout;

export interface SideNavProps {
  avatar?: React.ReactNode;
  bottomActions?: React.ReactNode;
  children?: React.ReactNode;
}

export const SideNav: React.FC<SideNavProps> = ({ avatar, bottomActions, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '16px 0' }}>
    {avatar && <div style={{ padding: '0 16px 16px', textAlign: 'center' }}>{avatar}</div>}
    <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
    {bottomActions && <div style={{ padding: '16px', borderTop: '1px solid var(--ant-color-border)' }}>{bottomActions}</div>}
  </div>
);

export interface HeaderProps {
  logo?: React.ReactNode;
  actions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ logo, actions }) => (
  <AntdHeader style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: 56, background: 'var(--ant-color-bg-container)', borderBottom: '1px solid var(--ant-color-border)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{logo}</div>
    <div>{actions}</div>
  </AntdHeader>
);

export interface MenuProps {
  items?: { key: string; icon?: React.ReactNode; label: string }[];
  selectedKeys?: string[];
  onClick?: (info: { key: string }) => void;
  variant?: 'borderless' | 'filled';
  style?: React.CSSProperties;
}

export const Menu: React.FC<MenuProps> = ({ items, selectedKeys, onClick, variant: _variant, style }) => (
  <AntdMenu
    mode="inline"
    items={items}
    selectedKeys={selectedKeys}
    onClick={onClick}
    style={{ borderInlineEnd: 'none', ...style }}
  />
);

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

export interface LayoutProps {
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ sidebar, header, children }) => (
  <AntdLayout style={{ minHeight: '100vh' }}>
    {sidebar && (
      <Sider width={220} style={{ background: 'var(--ant-color-bg-container)', borderRight: '1px solid var(--ant-color-border)' }}>
        {sidebar}
      </Sider>
    )}
    <AntdLayout>
      {header}
      <Content style={{ background: 'var(--ant-color-bg-layout)' }}>
        {children}
      </Content>
    </AntdLayout>
  </AntdLayout>
);

export interface LayoutMainProps {
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export const LayoutMain: React.FC<LayoutMainProps> = ({ children, style }) => (
  <div style={{ height: '100%', ...style }}>{children}</div>
);

// ============================================================
// 统一页面容器（黑白极简风）
// ============================================================

export interface PageContainerProps {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  extra?: React.ReactNode;
  maxWidth?: number;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  title,
  subtitle,
  extra,
  maxWidth = 1200,
}) => (
  <div style={{ maxWidth, margin: '0 auto', padding: '32px 16px' }}>
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

export interface PageCardProps {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
  hover?: boolean;
}

export const PageCard: React.FC<PageCardProps> = ({
  children,
  style,
  onClick,
  hover = true,
}) => (
  <div
    onClick={onClick}
    style={{
      background: 'var(--bg-primary)',
      border: '1px solid var(--border-primary)',
      borderRadius: 8,
      padding: 20,
      cursor: onClick ? 'pointer' : 'default',
      transition: hover ? 'all 0.2s ease' : undefined,
      ...style,
    }}
    onMouseEnter={
      hover && onClick
        ? (e) => {
            e.currentTarget.style.borderColor = 'var(--text-primary)';
            e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
          }
        : undefined
    }
    onMouseLeave={
      hover && onClick
        ? (e) => {
            e.currentTarget.style.borderColor = 'var(--border-primary)';
            e.currentTarget.style.boxShadow = 'none';
          }
        : undefined
    }
  >
    {children}
  </div>
);
