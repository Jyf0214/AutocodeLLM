// UI 组件库兼容层 - 替代 @lobehub/ui
// 直接导出 antd 组件

export {
  Button,
  Form,
  Input,
  Select,
  Checkbox,
  Radio,
  Switch,
  Slider,
  Avatar,
  Alert,
  Modal,
  Drawer,
  Tooltip,
  Popover,
  Dropdown,
  Tag,
  Empty,
  Spin,
  Skeleton,
  Segmented,
  Space,
  Divider,
} from 'antd';

// 自定义组件包装
import { CSSProperties, ReactNode } from 'react';

export interface FlexboxProps {
  children?: ReactNode;
  gap?: number | string;
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
  horizontal?: boolean;
  vertical?: boolean;
  flex?: string | number | boolean;
  padding?: number | string;
  margin?: number | string;
  style?: CSSProperties;
  className?: string;
  onClick?: () => void;
}

export const Flexbox: React.FC<FlexboxProps> = ({
  children,
  gap,
  align,
  justify,
  horizontal,
  vertical,
  flex,
  padding,
  margin,
  style,
  className,
  onClick,
}) => {
  const flexDirection = vertical ? 'column' : horizontal ? 'row' : 'row';
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection,
        gap,
        alignItems: align,
        justifyContent: justify,
        flex: flex === true ? 1 : flex,
        padding,
        margin,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export interface TextProps {
  children?: ReactNode;
  size?: number;
  type?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  strong?: boolean;
  code?: boolean;
  style?: CSSProperties;
  className?: string;
}

export const Text: React.FC<TextProps> = ({ children, size, type, strong, code, style, className }) => {
  return (
    <span
      className={className}
      style={{
        fontSize: size,
        fontWeight: strong ? 'bold' : 'normal',
        fontFamily: code ? 'monospace' : 'inherit',
        ...style,
      }}
    >
      {children}
    </span>
  );
};

export interface IconProps {
  icon?: ReactNode;
  size?: number;
  onClick?: () => void;
  style?: CSSProperties;
}

export const Icon: React.FC<IconProps> = ({ icon, size = 24, onClick, style }) => {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'inline-flex',
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {icon}
    </div>
  );
};

export interface ActionIconProps {
  icon?: ReactNode;
  onClick?: () => void;
  size?: number;
  style?: CSSProperties;
}

export const ActionIcon: React.FC<ActionIconProps> = ({ icon, onClick, size = 24, style }) => {
  return (
    <button
      onClick={onClick}
      style={{
        width: size,
        height: size,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      {icon}
    </button>
  );
};

export interface BlockProps {
  children?: ReactNode;
  style?: CSSProperties;
  className?: string;
}

export const Block: React.FC<BlockProps> = ({ children, style, className }) => {
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
};

export interface CenterProps {
  children?: ReactNode;
  style?: CSSProperties;
  className?: string;
}

export const Center: React.FC<CenterProps> = ({ children, style, className }) => {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// 导出常用工具函数
export const stopPropagation = (e: any) => {
  e?.stopPropagation();
};

export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

// 类型导出
export type { MenuProps as DropdownMenuProps } from 'antd';

// 占位组件
export interface ThemeProviderProps {
  children?: ReactNode;
  theme?: 'light' | 'dark';
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  return <>{children}</>;
};

// 其他导出
export interface EmojiPickerProps {
  onChange?: (emoji: string) => void;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onChange }) => {
  return <div>Emoji Picker</div>;
};

export interface DropdownMenuProps {
  items?: any[];
  children?: ReactNode;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ children }) => {
  return <>{children}</>;
};

export interface HotKeyProps {
  keys?: string[];
  children?: ReactNode;
}

export const Hotkey: React.FC<HotKeyProps> = ({ children }) => {
  return <>{children}</>;
};

export interface HighlighterProps {
  children?: ReactNode;
  highlight?: string;
}

export const Highlighter: React.FC<HighlighterProps> = ({ children }) => {
  return <>{children}</>;
};

export interface SortableListProps {
  items?: any[];
  children?: ReactNode;
}

export const SortableList: React.FC<SortableListProps> = ({ children }) => {
  return <>{children}</>;
};

export interface SliderWithInputProps {
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
}

export const SliderWithInput: React.FC<SliderWithInputProps> = ({ value, onChange, min = 0, max = 100 }) => {
  return <input type="range" min={min} max={max} value={value || 0} onChange={(e) => onChange?.(Number(e.target.value))} />;
};

export interface MarkdownProps {
  children?: string;
}

export const Markdown: React.FC<MarkdownProps> = ({ children }) => {
  return <div>{children}</div>;
};

export interface FluentEmojiProps {
  emoji?: string;
  size?: number;
}

export const FluentEmoji: React.FC<FluentEmojiProps> = ({ emoji }) => {
  return <span>{emoji}</span>;
};

export interface FileTypeIconProps {
  type?: string;
  size?: number;
}

export const FileTypeIcon: React.FC<FileTypeIconProps> = ({ type }) => {
  return <span>📄</span>;
};

export const MaterialFileTypeIcon: React.FC<FileTypeIconProps> = ({ type }) => {
  return <span>📄</span>;
};

export interface ImageProps {
  src?: string;
  alt?: string;
}

export const Image: React.FC<ImageProps> = ({ src, alt }) => {
  return <img src={src} alt={alt} />;
};

export interface AccordionProps {
  items?: any[];
  children?: ReactNode;
}

export const Accordion: React.FC<AccordionProps> = ({ children }) => {
  return <>{children}</>;
};

export interface AccordionItemProps {
  children?: ReactNode;
  title?: string;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({ children }) => {
  return <>{children}</>;
};

export interface InputPasswordProps {
  value?: string;
  onChange?: (value: string) => void;
}

export const InputPassword: React.FC<InputPasswordProps> = ({ value, onChange }) => {
  return <input type="password" value={value} onChange={(e) => onChange?.(e.target.value)} />;
};

export interface useModalContextReturn {
  close?: () => void;
}

export const useModalContext = (): useModalContextReturn => {
  return { close: () => {} };
};

export interface ItemType {
  key?: string;
  label?: ReactNode;
  icon?: ReactNode;
}

export type { ItemType };
