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
import debug from 'debug';
import isEqual from 'fast-deep-equal';
import { type ReactNode } from 'react';
import { memo, useMemo } from 'react';

import { messageMapKey } from '@/store/chat/utils/messageMapKey';

import { createStore, Provider } from './store';
import StoreUpdater from './StoreUpdater';
import {
  type ActionsBarConfig,
  type ConversationContext,
  type ConversationHooks,
  type OperationState,
} from './types';

const log = debug('lobe-render:features:Conversation');

export interface ConversationProviderProps {
  /**
   * Actions bar configuration by message type
   */
  actionsBar?: ActionsBarConfig;
  children: ReactNode;
  /**
   * Conversation context (data coordinates)
   */
  context: ConversationContext;
  /**
   * Whether external messages have been initialized
   * When false, ChatList will show skeleton loading state
   */
  hasInitMessages?: boolean;
  /**
   * Lifecycle hooks for external behavior injection
   */
  hooks?: ConversationHooks;
  /**
   * External messages to sync into the store
   * When provided, these messages will be used as the source of truth
   */
  messages?: UIChatMessage[];
  /**
   * Callback when messages are fetched or changed internally
   * Use this to sync messages back to external state (e.g., ChatStore)
   *
   * @param messages - The updated messages array
   * @param context - The context that this data belongs to (prevents race conditions)
   */
  onMessagesChange?: (messages: UIChatMessage[], context: ConversationContext) => void;
  /**
   * External operation state (from ChatStore)
   *
   * This state is managed by the global ChatStore and passed down for reactivity.
   * Operations are kept global to support multiple agents/topics running in parallel.
   *
   * When provided, this will be synced into the store for reactive updates.
   */
  operationState?: OperationState;
  skipFetch?: boolean;
}

/**
 * ConversationProvider
 *
 * Creates an isolated ConversationStore instance for a specific conversation context.
 * This enables multiple independent conversations to run simultaneously.
 */
export const ConversationProvider = memo<ConversationProviderProps>(
  ({
    actionsBar,
    children,
    context,
    hooks = {},
    hasInitMessages,
    messages,
    onMessagesChange,
    operationState,
    skipFetch,
  }) => {
    const contextKey = useMemo(() => messageMapKey(context), [context]);

    log(
      '[Provider] render | contextKey=%s | messagesCount=%d | hasInitMessages=%s | skipFetch=%s',
      contextKey,
      messages?.length ?? 0,
      hasInitMessages,
      skipFetch,
    );

    return (
      <Provider createStore={() => createStore({ context, hooks, skipFetch })}>
        <StoreUpdater
          actionsBar={actionsBar}
          context={context}
          hasInitMessages={hasInitMessages}
          hooks={hooks}
          messages={messages}
          operationState={operationState}
          skipFetch={skipFetch}
          onMessagesChange={onMessagesChange}
        />
        {children}
      </Provider>
    );
  },
  isEqual,
);

ConversationProvider.displayName = 'ConversationProvider';
