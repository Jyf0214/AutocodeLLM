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
import { memo, useEffect, useLayoutEffect, useRef } from 'react';
import { createStoreUpdater } from 'zustand-utils';

import { messageMapKey } from '@/store/chat/utils/messageMapKey';

import { useConversationStoreApi } from './store';
import {
  type ActionsBarConfig,
  type ConversationContext,
  type ConversationHooks,
  type OperationState,
} from './types';

const log = debug('lobe-render:features:Conversation');

export interface StoreUpdaterProps {
  /**
   * Actions bar configuration by message type
   */
  actionsBar?: ActionsBarConfig;
  context: ConversationContext;
  /**
   * Whether external messages have been initialized
   */
  hasInitMessages?: boolean;
  hooks?: ConversationHooks;
  /**
   * External messages to sync into the store
   */
  messages?: UIChatMessage[];
  /**
   * Callback when messages are fetched or changed internally
   */
  onMessagesChange?: (messages: UIChatMessage[], context: ConversationContext) => void;
  /**
   * External operation state (from ChatStore)
   */
  operationState?: OperationState;
  /**
   * Skip internal message fetching (when external messages are provided)
   */
  skipFetch?: boolean;
}

const StoreUpdater = memo<StoreUpdaterProps>(
  ({
    actionsBar,
    context,
    hasInitMessages,
    hooks,
    messages,
    onMessagesChange,
    operationState,
    skipFetch,
  }) => {
    const storeApi = useConversationStoreApi();
    const useStoreUpdater = createStoreUpdater(storeApi);
    const prevMessagesRef = useRef<UIChatMessage[] | undefined>(undefined);
    const contextKey = messageMapKey(context);

    useStoreUpdater('actionsBar', actionsBar);
    useStoreUpdater('context', context);
    useStoreUpdater('hooks', hooks!);
    useStoreUpdater('onMessagesChange', onMessagesChange);
    useStoreUpdater('operationState', operationState!);
    useStoreUpdater('skipFetch', skipFetch!);

    // When external messages are provided, mark as initialized
    useStoreUpdater('messagesInit', skipFetch ? true : (hasInitMessages ?? false));

    // Reset store state before paint when context changes.
    // useLayoutEffect fires after commit but before browser paint, and React processes
    // store updates triggered here synchronously — so subscribers re-render before paint.
    const prevContextKeyRef = useRef(contextKey);
    useLayoutEffect(() => {
      if (prevContextKeyRef.current !== contextKey) {
        prevContextKeyRef.current = contextKey;
        prevMessagesRef.current = undefined;

        // Update context first so replaceMessages uses the correct context
        // when calling onMessagesChange (otherwise writes to the old topic key)
        storeApi.setState({
          context,
          dbMessages: messages ?? [],
          displayMessages: [],
          messagesInit: false,
        });

        // If messages are already available, sync them immediately
        if (messages) {
          storeApi.getState().replaceMessages(messages);
          storeApi.setState({ messagesInit: true });
        }
      }
    }, [contextKey]); // eslint-disable-line react-hooks/exhaustive-deps

    // Sync external messages into store
    useEffect(() => {
      if (messages) {
        const prevMessages = prevMessagesRef.current;
        const prevCount = prevMessages?.length ?? 0;
        const newCount = messages.length;
        const isSameReference = prevMessages === messages;
        const storeMessages = storeApi.getState().dbMessages;

        log(
          '[StoreUpdater] messages effect | contextKey=%s | prevCount=%d | newCount=%d | sameRef=%s | storeCount=%d | messageIds=%o',
          contextKey,
          prevCount,
          newCount,
          isSameReference,
          storeMessages.length,
          messages.slice(0, 5).map((m) => m.id),
        );

        prevMessagesRef.current = messages;
        storeApi.getState().replaceMessages(messages);
      }
    }, [messages, storeApi, contextKey]);

    return null;
  },
);

StoreUpdater.displayName = 'ConversationStoreUpdater';

export default StoreUpdater;
