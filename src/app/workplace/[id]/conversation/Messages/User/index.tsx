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

import { Tag } from '@lobehub/ui';
import isEqual from 'fast-deep-equal';
import { type MouseEventHandler } from 'react';
import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { ChatItem } from '@/features/Conversation/ChatItem';
import { useUserAvatar } from '@/hooks/useUserAvatar';
import { useSessionStore } from '@/store/session';
import { sessionSelectors } from '@/store/session/selectors';
import { useUserStore } from '@/store/user';
import { userProfileSelectors } from '@/store/user/selectors';

import { useDoubleClickEdit } from '../../hooks/useDoubleClickEdit';
import { dataSelectors, messageStateSelectors, useConversationStore } from '../../store';
import {
  useSetMessageItemActionElementPortialContext,
  useSetMessageItemActionTypeContext,
} from '../Contexts/message-action-context';
import Actions from './Actions';
import UserMessageContent from './components/MessageContent';
import { UserMessageExtra } from './Extra';

interface UserMessageProps {
  disableEditing?: boolean;
  id: string;
  index: number;
}

const UserMessage = memo<UserMessageProps>(({ id, disableEditing, index }) => {
  const item = useConversationStore(dataSelectors.getDisplayMessageById(id), isEqual)!;
  const actionsConfig = useConversationStore((s) => s.actionsBar?.user);
  const { content, createdAt, error, role, extra, targetId } = item;

  const { t } = useTranslation('chat');
  const avatar = useUserAvatar();
  const title = useUserStore(userProfileSelectors.displayUserName);

  // Get editing and loading state from ConversationStore
  const editing = useConversationStore(messageStateSelectors.isMessageEditing(id));

  // Get target name for DM indicator
  const userName = useUserStore(userProfileSelectors.nickName) || 'User';
  const agents = useSessionStore(sessionSelectors.currentGroupAgents);

  const dmIndicator = useMemo(() => {
    if (!targetId) return undefined;

    const targetName =
      targetId === 'user'
        ? userName
        : agents?.find((agent) => agent.id === targetId)?.title || targetId;

    return <Tag>{t('dm.visibleTo', { target: targetName })}</Tag>;
  }, [targetId, userName, agents, t]);

  const onDoubleClick = useDoubleClickEdit({ disableEditing, error, id, role });

  const setMessageItemActionElementPortialContext = useSetMessageItemActionElementPortialContext();
  const setMessageItemActionTypeContext = useSetMessageItemActionTypeContext();

  const onMouseEnter: MouseEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      if (disableEditing) return;
      setMessageItemActionElementPortialContext(e.currentTarget);
      setMessageItemActionTypeContext({ id, index, type: 'user' });
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
      avatar={{ avatar, title }}
      editing={editing}
      id={id}
      message={content}
      messageExtra={<UserMessageExtra content={content} extra={extra} id={id} />}
      placement={'right'}
      showAvatar={false}
      showTitle={false}
      time={createdAt}
      titleAddon={dmIndicator}
      actions={
        <Actions
          actionsConfig={actionsConfig}
          data={item}
          disableEditing={disableEditing}
          id={id}
          index={index}
        />
      }
      onDoubleClick={onDoubleClick}
      onMouseEnter={onMouseEnter}
    >
      <UserMessageContent {...item} />
    </ChatItem>
  );
}, isEqual);

export default UserMessage;
