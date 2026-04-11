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

'use client';

import { type UIChatMessage } from '@lobechat/types';
import { Avatar, Flexbox } from '@lobehub/ui';
import { memo } from 'react';

import { useUserAvatar } from '@/hooks/useUserAvatar';

import { useAgentMeta } from '../../hooks';
import ContentBlock from '../AssistantGroup/components/ContentBlock';
import UserMessageContent from '../User/components/MessageContent';

interface CompressedMessageItemProps {
  message: UIChatMessage;
}

/**
 * Renders a single message within a compressed group
 * Reuses existing User and Assistant content components for consistency
 */
const CompressedMessageItem = memo<CompressedMessageItemProps>(({ message }) => {
  const userAvatar = useUserAvatar();
  const agentAvatar = useAgentMeta(message.agentId);
  const { role, children } = message;

  // Render user message
  if (role === 'user') {
    return (
      <Flexbox horizontal gap={8} paddingBlock={4}>
        <Avatar avatar={userAvatar} size={28} />
        <Flexbox flex={1} style={{ overflow: 'hidden' }}>
          <UserMessageContent {...message} />
        </Flexbox>
      </Flexbox>
    );
  }

  // Render assistant message (standalone without tools)
  if (role === 'assistant') {
    return (
      <Flexbox horizontal gap={8} paddingBlock={4}>
        <Avatar {...agentAvatar} size={28} />
        <Flexbox flex={1} style={{ overflow: 'hidden' }}>
          <ContentBlock
            disableEditing
            assistantId={message.id}
            content={message.content}
            id={message.id}
          />
        </Flexbox>
      </Flexbox>
    );
  }

  // Render assistantGroup (assistant message with tool calls)
  if (role === 'assistantGroup' && children) {
    return (
      <Flexbox horizontal gap={8} paddingBlock={4}>
        <Avatar {...agentAvatar} size={28} />
        <Flexbox flex={1} gap={8} style={{ overflow: 'hidden' }}>
          {children.map((block) => (
            <ContentBlock {...block} disableEditing assistantId={message.id} key={block.id} />
          ))}
        </Flexbox>
      </Flexbox>
    );
  }

  // Skip other roles (tool, system, etc.)
  return null;
});

CompressedMessageItem.displayName = 'CompressedMessageItem';

export default CompressedMessageItem;
