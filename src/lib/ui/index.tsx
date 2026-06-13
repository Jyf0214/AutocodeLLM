/**
 * UI 组件兼容层
 * 重新导出所有 UI 组件
 */

'use client';

import { Flex, Typography } from 'antd';

// CSS 工具函数（参考项目兼容导入路径）
export { cn } from '@/lib/cn';

import {
  Tag,
  Button,
  Input,
  Textarea,
  Select,
  ProCard,
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
  PageTransition,
  AnimatedList,
  ScrollReveal,
  Form,
  Alert,
  Empty,
  ButtonAntd,
  InputAntd,
  ModalAntd,
  AvatarAntd,
} from '@/ui';

// 参考源库组件
export { Button, Input, Textarea, Select, Tag, ProCard, EmptyState, FilterPill };
export { ConfigSection, FormField, ToggleField, StatusCard, ButtonGroup, GitHubStatus, HeroBanner };
export { AccessControlSection, SiteConfigForm };

// 动画组件
export { PageTransition, AnimatedList, ScrollReveal };

// antd 别名
export { Form, Alert, Empty, ButtonAntd, InputAntd, ModalAntd, AvatarAntd };

// 兼容旧名映射
export const StatusTag = Tag;
export const CustomButton = Button;
export const InputPassword = Input;

// 向后兼容: 从 antd 直接导出版本 (用于旧页面)
export const Flexbox = Flex;
export const Text = Typography.Text;
export const Avatar = AvatarAntd;
export const ThemeProvider = null;
export const ThemeSwitch = null;

// 向后兼容: 旧版 PageContainer (title/subtitle/extra)
export { PageContainer } from '@/ui/page-container-legacy';
