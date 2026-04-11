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

import { LOADING_FLAT } from '@lobechat/const';
import isEqual from 'fast-deep-equal';
import { type MouseEventHandler } from 'react';
import { memo, useCallback } from 'react';

import { MESSAGE_ACTION_BAR_PORTAL_ATTRIBUTES } from '@/const/messageActionPortal';
import { ChatItem } from '@/features/Conversation/ChatItem';
import { useUserStore } from '@/store/user';
import { userGeneralSettingsSelectors } from '@/store/user/selectors';

import ErrorMessageExtra, { useErrorContent } from '../../Error';
import { useAgentMeta, useDoubleClickEdit } from '../../hooks';
import { dataSelectors, messageStateSelectors, useConversationStore } from '../../store';
import { normalizeThinkTags, processWithArtifact } from '../../utils/markdown';
import MessageBranch from '../components/MessageBranch';
import {
  useSetMessageItemActionElementPortialContext,
  useSetMessageItemActionTypeContext,
} from '../Contexts/message-action-context';
import InterruptedHint from './components/InterruptedHint';
import MessageContent from './components/MessageContent';
import { AssistantMessageExtra } from './Extra';

const actionBarHolder = (
  <div {...{ [MESSAGE_ACTION_BAR_PORTAL_ATTRIBUTES.assistant]: '' }} style={{ height: '28px' }} />
);

interface AssistantMessageProps {
  disableEditing?: boolean;
  id: string;
  index: number;
  isLatestItem?: boolean;
}

const AssistantMessage = memo<AssistantMessageProps>(({ id, index, disableEditing }) => {
  // Get message and actionsConfig from ConversationStore
  const item = useConversationStore(dataSelectors.getDisplayMessageById(id), isEqual)!;

  const {
    agentId,
    branch,
    error,
    role,
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

  // Get editing, generating, and interrupted state from ConversationStore
  const editing = useConversationStore(messageStateSelectors.isMessageEditing(id));
  const generating = useConversationStore(messageStateSelectors.isMessageGenerating(id));
  const interrupted = useConversationStore(messageStateSelectors.isMessageInterrupted(id));

  const errorContent = useErrorContent(error);

  const shouldForceShowError =
    error?.type === 'ProviderBizError' &&
    (error?.body as any)?.provider === 'google' &&
    !!(
      (error?.body as any)?.context?.promptFeedback?.blockReason ||
      (error?.body as any)?.context?.finishReason
    );

  // remove line breaks in artifact tag to make the ast transform easier
  const message = !editing ? normalizeThinkTags(processWithArtifact(content)) : content;

  const onDoubleClick = useDoubleClickEdit({ disableEditing, error, id, role });
  const setMessageItemActionElementPortialContext = useSetMessageItemActionElementPortialContext();
  const setMessageItemActionTypeContext = useSetMessageItemActionTypeContext();

  const isDevMode = useUserStore((s) => userGeneralSettingsSelectors.config(s).isDevMode);

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
      avatar={avatar}
      customErrorRender={(error) => <ErrorMessageExtra data={item} error={error} />}
      editing={editing}
      id={id}
      loading={generating}
      message={message}
      placement={'left'}
      time={createdAt}
      actions={
        <>
          {isDevMode && branch && (
            <MessageBranch
              activeBranchIndex={branch.activeBranchIndex}
              count={branch.count}
              messageId={id}
            />
          )}
          {actionBarHolder}
        </>
      }
      error={
        errorContent && error && (message === LOADING_FLAT || !message || shouldForceShowError)
          ? errorContent
          : undefined
      }
      messageExtra={
        <>
          {interrupted && <InterruptedHint />}
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
        </>
      }
      onDoubleClick={onDoubleClick}
      onMouseEnter={onMouseEnter}
    >
      <MessageContent {...item} />
    </ChatItem>
  );
}, isEqual);

AssistantMessage.displayName = 'AssistantMessage';

export default AssistantMessage;
