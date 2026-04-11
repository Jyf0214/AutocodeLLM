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

import { type ReactNode } from 'react';
import { memo, useCallback } from 'react';

import { useFetchAgentDocuments } from '@/hooks/useFetchAgentDocuments';
import { useFetchTopicMemories } from '@/hooks/useFetchMemoryForTopic';
import { useFetchNotebookDocuments } from '@/hooks/useFetchNotebookDocuments';
import { useChatStore } from '@/store/chat';
import { useUserStore } from '@/store/user';
import { settingsSelectors } from '@/store/user/selectors';

import WideScreenContainer from '../../WideScreenContainer';
import SkeletonList from '../components/SkeletonList';
import MessageItem from '../Messages';
import { MessageActionProvider } from '../Messages/Contexts/MessageActionProvider';
import { dataSelectors, useConversationStore } from '../store';
import VirtualizedList from './components/VirtualizedList';

export interface ChatListProps {
  /**
   * Disable the actions bar for all messages (e.g., in share page)
   */
  disableActionsBar?: boolean;
  /**
   * Custom item renderer. If not provided, uses default ChatItem.
   */
  itemContent?: (index: number, id: string) => ReactNode;
  /**
   * Welcome component to display when there are no messages
   */
  welcome?: ReactNode;
}
/**
 * ChatList component for Conversation
 *
 * Uses ConversationStore for message data and fetching.
 */
const ChatList = memo<ChatListProps>(({ disableActionsBar, welcome, itemContent }) => {
  // Fetch messages (SWR key is null when skipFetch is true)
  const context = useConversationStore((s) => s.context);
  const enableUserMemories = useUserStore(settingsSelectors.memoryEnabled);
  const [skipFetch, useFetchMessages] = useConversationStore((s) => [
    dataSelectors.skipFetch(s),
    s.useFetchMessages,
  ]);
  const activeAgentId = useChatStore((s) => s.activeAgentId);
  useFetchMessages(context, skipFetch);

  // Skip fetching notebook and memories for share pages (they require authentication)
  const isSharePage = !!context.topicShareId;

  // Fetch notebook documents when topic is selected (skip for share pages)
  useFetchAgentDocuments(isSharePage ? undefined : activeAgentId);
  useFetchNotebookDocuments(isSharePage ? undefined : context.topicId!);
  useFetchTopicMemories(enableUserMemories && !isSharePage ? context.topicId : undefined);

  // Use selectors for data

  const displayMessageIds = useConversationStore(dataSelectors.displayMessageIds);

  const defaultItemContent = useCallback(
    (index: number, id: string) => {
      const isLatestItem = displayMessageIds.length === index + 1;
      return <MessageItem id={id} index={index} isLatestItem={isLatestItem} />;
    },
    [displayMessageIds.length],
  );
  const messagesInit = useConversationStore(dataSelectors.messagesInit);

  // When topicId is null (new conversation), show welcome directly without waiting for fetch
  // because there's no server data to fetch - only local optimistic updates exist
  const isNewConversation = !context.topicId;

  if (!messagesInit && !isNewConversation) {
    return <SkeletonList />;
  }

  if (displayMessageIds.length === 0) {
    return (
      <WideScreenContainer
        style={{
          height: '100%',
        }}
        wrapperStyle={{
          minHeight: '100%',
          overflowY: 'auto',
        }}
      >
        {welcome}
      </WideScreenContainer>
    );
  }

  return (
    <MessageActionProvider withSingletonActionsBar={!disableActionsBar}>
      <VirtualizedList
        dataSource={displayMessageIds}
        itemContent={itemContent ?? defaultItemContent}
      />
    </MessageActionProvider>
  );
});

ChatList.displayName = 'ConversationChatList';

export default ChatList;
