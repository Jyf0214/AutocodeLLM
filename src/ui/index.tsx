'use client';

import {
  Button as AntdButton,
  Form as AntdForm,
  Input as AntdInput,
  Avatar as AntdAvatar,
  Alert as AntdAlert,
  Modal as AntdModal,
  Empty as AntdEmpty,
} from 'antd';

// ============================================================
// 自定义组件 — 直接导出，不再经过 reference-exports.ts
// ============================================================
export { default as ConfigSection, type ConfigSectionProps } from './ConfigSection';
export { default as FormField, type FormFieldProps } from './FormField';
export { default as ToggleField, type ToggleFieldProps } from './ToggleField';
export { StatusCard, type StatusCardProps, type StatusType } from './StatusCard';
export { ButtonGroup, type ButtonGroupProps } from './ButtonGroup';
export { default as SiteConfigForm } from './SiteConfigForm';
export { default as LoadingAnimationConfig } from './LoadingAnimationConfig';
export { default as AccessControlSection } from './AccessControlSection';
export { default as BackgroundConfig } from './BackgroundConfig';
export { default as GitHubStatus } from './GitHubStatus';
export { ProCard, type ProCardProps } from './ProCard';
export { PageContainer } from './PageContainer';
export { EmptyState } from './EmptyState';
export { HeroBanner, type HeroBannerProps, type HeroButton } from './HeroBanner';
export { Button, type ButtonProps } from './Button';
export { Input, type InputProps, type InputSize, type InputRounded, type InputRing } from './Input';
export { Textarea, type TextareaProps, type TextareaSize, type TextareaRounded, type TextareaRing } from './Textarea';
export { Select, type SelectProps, type SelectSize, type SelectRounded, type SelectRing } from './Select';
export { Tag, type TagProps } from './Tag';
export { FilterPill, type FilterPillProps } from './FilterPill';

// TOC
export { TOC } from './TOC';

// 动画组件
export { PageTransition } from '@/ui/page-transition';
export { AnimatedList } from '@/ui/animated-list';
export { ScrollReveal } from '@/ui/scroll-reveal';

// ============================================================
// antd 组件 (别名导出, 仅在需要 antd 特有交互时使用)
// ============================================================
export const Form = AntdForm;
export const Alert = AntdAlert;
export const Empty = AntdEmpty;
export const ButtonAntd = AntdButton;
export const InputAntd = AntdInput;
export const ModalAntd = AntdModal;
export const AvatarAntd = AntdAvatar;
