// AutocodeLLM UI 组件兼容层
// 参考源库组件 (优先) + antd 别名导出 (避免命名冲突)

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
} from 'antd';

// ============================================================
// 参考源库组件 (来自 reference-exports.ts)
// 这些是经过验证可以正常工作的组件
// ============================================================
export {
  Button,
  Input,
  Textarea,
  Select,
  Tag,
  ProCard,
  PageContainer,
  EmptyState,
  FilterPill,
  ConfigSection,
  FormField,
  ToggleField,
  StatusCard,
  ButtonGroup,
  GitHubStatus,
  HeroBanner,
  AccessControlSection,
  SiteConfigForm,
  BackgroundConfig,
  LoadingAnimationConfig,
} from './reference-exports';

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
