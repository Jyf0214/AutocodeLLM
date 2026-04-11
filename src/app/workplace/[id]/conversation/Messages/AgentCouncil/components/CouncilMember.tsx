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

import isEqual from 'fast-deep-equal';
import { type MouseEventHandler } from 'react';
import { memo, useCallback } from 'react';

import { LOADING_FLAT } from '@/const/message';
import { MESSAGE_ACTION_BAR_PORTAL_ATTRIBUTES } from '@/const/messageActionPortal';
import { ChatItem } from '@/features/Conversation/ChatItem';
import ErrorMessageExtra, { useErrorContent } from '@/features/Conversation/Error';
import { AssistantMessageExtra } from '@/features/Conversation/Messages/Assistant/Extra';
import { normalizeThinkTags, processWithArtifact } from '@/features/Conversation/utils/markdown';
import { type UIChatMessage } from '@/types/index';

import { useAgentMeta } from '../../../hooks';
import { messageStateSelectors, useConversationStore } from '../../../store';
import MessageContent from '../../Assistant/components/MessageContent';
import {
  useSetMessageItemActionElementPortialContext,
  useSetMessageItemActionTypeContext,
} from '../../Contexts/message-action-context';
import AutoScrollShadow from './AutoScrollShadow';

const actionBarHolder = (
  <div {...{ [MESSAGE_ACTION_BAR_PORTAL_ATTRIBUTES.assistant]: '' }} style={{ height: '28px' }} />
);

interface CouncilMemberProps {
  index: number;
  item: UIChatMessage;
}

const CouncilMember = memo<CouncilMemberProps>(({ item, index }) => {
  const {
    id,
    agentId,
    error,
    content,
    createdAt,
    tools,
    extra,
    model,
    provider,
    performance,
    usage,
    metadata,
  } = item;
  const avatar = useAgentMeta(agentId);

  const editing = useConversationStore(messageStateSelectors.isMessageEditing(id));
  const generating = useConversationStore(messageStateSelectors.isMessageGenerating(id));
  const errorContent = useErrorContent(error);
  const message = !editing ? normalizeThinkTags(processWithArtifact(content)) : content;

  const setMessageItemActionElementPortialContext = useSetMessageItemActionElementPortialContext();
  const setMessageItemActionTypeContext = useSetMessageItemActionTypeContext();

  const onMouseEnter: MouseEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      setMessageItemActionElementPortialContext(e.currentTarget);
      setMessageItemActionTypeContext({ id, index, type: 'assistant' });
    },
    [id, index, setMessageItemActionElementPortialContext, setMessageItemActionTypeContext],
  );

  return (
    <ChatItem
      showTitle
      aboveMessage={null}
      actions={actionBarHolder}
      avatar={avatar}
      customErrorRender={(error) => <ErrorMessageExtra data={item} error={error} />}
      editing={editing}
      id={id}
      loading={generating}
      message={message}
      placement={'left'}
      time={createdAt}
      error={
        errorContent && error && (message === LOADING_FLAT || !message) ? errorContent : undefined
      }
      messageExtra={
        <AssistantMessageExtra
          content={content}
          extra={extra}
          id={id}
          model={model!}
          performance={performance! || metadata}
          provider={provider!}
          tools={tools}
          usage={usage! || metadata}
        />
      }
      onMouseEnter={onMouseEnter}
    >
      <AutoScrollShadow content={content} streaming={generating}>
        <MessageContent {...item} />
      </AutoScrollShadow>
    </ChatItem>
  );
}, isEqual);

CouncilMember.displayName = 'CouncilMember';

export default CouncilMember;
