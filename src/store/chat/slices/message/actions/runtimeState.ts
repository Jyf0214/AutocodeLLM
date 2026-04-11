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

import { type ChatStore } from '@/store/chat/store';
import { type StoreSetter } from '@/store/types';
import { type Action } from '@/utils/storeDebug';

import { type ChatStoreState } from '../../../initialState';
import { preventLeavingFn, toggleBooleanList } from '../../../utils';

/**
 * Runtime state management for message-related states
 * Handles loading states, active session tracking, etc.
 */

type Setter = StoreSetter<ChatStore>;
export const messageRuntimeState = (set: Setter, get: () => ChatStore, _api?: unknown) =>
  new MessageRuntimeStateActionImpl(set, get, _api);

export class MessageRuntimeStateActionImpl {
  readonly #get: () => ChatStore;
  readonly #set: Setter;

  constructor(set: Setter, get: () => ChatStore, _api?: unknown) {
    void _api;
    this.#set = set;
    this.#get = get;
  }

  internal_toggleLoadingArrays = (
    key: keyof ChatStoreState,
    loading: boolean,
    id?: string,
    action?: Action,
  ): AbortController | undefined => {
    const abortControllerKey = `${key}AbortController`;
    if (loading) {
      window.addEventListener('beforeunload', preventLeavingFn);

      const abortController = new AbortController();
      this.#set(
        {
          [abortControllerKey]: abortController,
          [key]: toggleBooleanList(this.#get()[key] as string[], id!, loading),
        },
        false,
        action,
      );

      return abortController;
    } else {
      if (!id) {
        this.#set({ [abortControllerKey]: undefined, [key]: [] }, false, action);
      } else
        this.#set(
          {
            [abortControllerKey]: undefined,
            [key]: toggleBooleanList(this.#get()[key] as string[], id, loading),
          },
          false,
          action,
        );

      window.removeEventListener('beforeunload', preventLeavingFn);
    }
  };

  internal_toggleMessageLoading = (loading: boolean, id: string): void => {
    this.#set(
      {
        messageLoadingIds: toggleBooleanList(this.#get().messageLoadingIds, id, loading),
      },
      false,
      `internal_toggleMessageLoading/${loading ? 'start' : 'end'}`,
    );
  };
}

export type MessageRuntimeStateAction = Pick<
  MessageRuntimeStateActionImpl,
  keyof MessageRuntimeStateActionImpl
>;
