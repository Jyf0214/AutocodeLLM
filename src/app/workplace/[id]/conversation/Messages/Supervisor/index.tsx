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

import type { EmojiReaction } from '@lobechat/types';
import { Tag } from '@lobehub/ui';
import isEqual from 'fast-deep-equal';
import { type MouseEventHandler } from 'react';
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { MESSAGE_ACTION_BAR_PORTAL_ATTRIBUTES } from '@/const/messageActionPortal';
import AgentGroupAvatar from '@/features/AgentGroupAvatar';
import { ChatItem } from '@/features/Conversation/ChatItem';
import { useAgentGroupStore } from '@/store/agentGroup';
import { agentGroupSelectors } from '@/store/agentGroup/selectors';
import { useUserStore } from '@/store/user';
import { userGeneralSettingsSelectors, userProfileSelectors } from '@/store/user/selectors';

import { ReactionDisplay } from '../../components/Reaction';
import { useAgentMeta } from '../../hooks';
import { dataSelectors, useConversationStore } from '../../store';
import Usage from '../components/Extras/Usage';
import MessageBranch from '../components/MessageBranch';
import {
  useSetMessageItemActionElementPortialContext,
  useSetMessageItemActionTypeContext,
} from '../Contexts/message-action-context';
import Group from './components/Group';

const actionBarHolder = (
  <div
    {...{ [MESSAGE_ACTION_BAR_PORTAL_ATTRIBUTES.assistantGroup]: '' }}
    style={{ height: '28px' }}
  />
);
interface GroupMessageProps {
  disableEditing?: boolean;
  id: string;
  index: number;
  isLatestItem?: boolean;
}

const GroupMessage = memo<GroupMessageProps>(({ id, index, disableEditing }) => {
  const { t } = useTranslation('chat');

  // Get message and actionsConfig from ConversationStore
  const item = useConversationStore(dataSelectors.getDisplayMessageById(id), isEqual)!;

  const { agentId, usage, createdAt, children, performance, model, provider, branch, metadata } =
    item;
  const avatar = useAgentMeta(agentId);

  // Get group member avatars for GroupAvatar
  const memberAvatars = useAgentGroupStore(
    (s) => agentGroupSelectors.currentGroupMemberAvatars(s),
    isEqual,
  );

  // Get group meta for title
  const groupMeta = useAgentGroupStore(agentGroupSelectors.currentGroupMeta);

  // Get editing state from ConversationStore
  const isDevMode = useUserStore((s) => userGeneralSettingsSelectors.config(s).isDevMode);
  const addReaction = useConversationStore((s) => s.addReaction);
  const removeReaction = useConversationStore((s) => s.removeReaction);
  const userId = useUserStore(userProfileSelectors.userId)!;
  const reactions: EmojiReaction[] = metadata?.reactions || [];

  const handleReactionClick = useCallback(
    (emoji: string) => {
      const existing = reactions.find((r) => r.emoji === emoji);
      if (existing && existing.users.includes(userId)) {
        removeReaction(id, emoji);
      } else {
        addReaction(id, emoji);
      }
    },
    [id, reactions, addReaction, removeReaction],
  );

  const isReactionActive = useCallback(
    (emoji: string) => {
      const reaction = reactions.find((r) => r.emoji === emoji);
      return !!reaction && reaction.users.includes(userId);
    },
    [reactions],
  );

  const setMessageItemActionElementPortialContext = useSetMessageItemActionElementPortialContext();
  const setMessageItemActionTypeContext = useSetMessageItemActionTypeContext();

  const onMouseEnter: MouseEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      if (disableEditing) return;
      setMessageItemActionElementPortialContext(e.currentTarget);
      setMessageItemActionTypeContext({ id, index, type: 'assistantGroup' });
    },
    [
      disableEditing,
      id,
      index,
      setMessageItemActionElementPortialContext,
      setMessageItemActionTypeContext,
    ],
  );

  return (
    <ChatItem
      showTitle
      avatar={{ ...avatar, title: groupMeta.title }}
      placement={'left'}
      time={createdAt}
      titleAddon={<Tag>{t('supervisor.label')}</Tag>}
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
      customAvatarRender={() => (
        <AgentGroupAvatar
          avatar={groupMeta.avatar}
          backgroundColor={groupMeta.backgroundColor}
          memberAvatars={memberAvatars}
        />
      )}
      onMouseEnter={onMouseEnter}
    >
      {children && children.length > 0 && (
        <Group
          blocks={children}
          content={item.content}
          disableEditing={disableEditing}
          id={id}
          messageIndex={index}
        />
      )}
      {isDevMode && model && (
        <Usage model={model} performance={performance} provider={provider!} usage={usage} />
      )}
      {reactions.length > 0 && (
        <ReactionDisplay
          isActive={isReactionActive}
          messageId={id}
          reactions={reactions}
          onReactionClick={handleReactionClick}
        />
      )}
    </ChatItem>
  );
}, isEqual);

export default GroupMessage;
