/**
 * 本代码来源于 LobeChat 项目（https://github.com/lobehub/lobe-chat）
 *
 * LobeChat 许可证信息：
 * LobeHub Community License（基于 Apache License 2.0）
 * Copyright (c) 2024-2026 LobeHub LLC. All rights reserved.
 * 详细信息：http://www.apache.org/licenses/LICENSE-2.0
 *
 * 修改声明：
 * 本文件已从 LobeChat 源代码进行修改以适配 AutocodeLLM 项目。
 * 修改内容包括：目录结构调整、依赖适配、API 接口兼容等。
 *
 * AutocodeLLM 项目许可证：
 * Apache License, Version 2.0
 * Copyright (c) 2026 Jyf0214
 *
 * 双重许可：本文件同时受上述两个许可证约束。
 * 商业使用需分别获得对应授权。
 */

import { type AlertProps, type AvatarProps, type DivProps, type FlexboxProps } from '@lobehub/ui';
import { type EditableMessageProps, type MetaData } from '@lobehub/ui/chat';
import { type ReactNode } from 'react';

export interface ChatItemProps extends Omit<FlexboxProps, 'children' | 'onChange'> {
  aboveMessage?: ReactNode;
  actions?: ReactNode;
  actionsWrapWidth?: number;
  avatar: MetaData;
  avatarProps?: AvatarProps;
  belowMessage?: ReactNode;
  children?: ReactNode;
  customAvatarRender?: (avatar: MetaData, node: ReactNode) => ReactNode;
  customErrorRender?: (error: AlertProps) => ReactNode;
  /**
   * @description Whether the chat item is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * @description Whether the chat item is in editing mode
   */
  editing?: boolean;
  /**
   * @description Props for Error render
   */
  error?: AlertProps;
  fontSize?: number;
  /**
   * @description Whether the chat item is in loading state
   */
  loading?: boolean;
  /**
   * @description The message content of the chat item
   */
  message?: ReactNode;
  messageExtra?: ReactNode;
  /**
   * Avatar click handler
   */
  onAvatarClick?: () => void;
  onDoubleClick?: DivProps['onDoubleClick'];
  /**
   * @default "..."
   */
  placeholderMessage?: string;
  /**
   * @description The placement of the chat item
   * @default 'left'
   */
  placement?: 'left' | 'right';
  /**
   * @description Whether to hide the avatar
   * @default false
   */
  showAvatar?: boolean;
  /**
   * @description Whether to show the title of the chat item
   */
  showTitle?: boolean;
  text?: EditableMessageProps['text'];
  /**
   * @description The timestamp of the chat item
   */
  time?: number;
  titleAddon?: ReactNode;
}
