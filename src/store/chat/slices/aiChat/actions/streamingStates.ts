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

import isEqual from 'fast-deep-equal';
import { produce } from 'immer';

import { type ChatStore } from '@/store/chat/store';
import { type StoreSetter } from '@/store/types';

/**
 * Manages loading states during streaming operations
 */

type Setter = StoreSetter<ChatStore>;
export const streamingStates = (set: Setter, get: () => ChatStore, _api?: unknown) =>
  new StreamingStatesActionImpl(set, get, _api);

export class StreamingStatesActionImpl {
  readonly #get: () => ChatStore;
  readonly #set: Setter;

  constructor(set: Setter, get: () => ChatStore, _api?: unknown) {
    void _api;
    this.#set = set;
    this.#get = get;
  }

  internal_toggleSearchWorkflow = (loading: boolean, id?: string): void => {
    this.#get().internal_toggleLoadingArrays('searchWorkflowLoadingIds', loading, id);
  };

  internal_toggleToolCallingStreaming = (id: string, streaming: boolean[] | undefined): void => {
    const previous = this.#get().toolCallingStreamIds;
    const next = produce(previous, (draft) => {
      if (!!streaming) {
        draft[id] = streaming;
      } else {
        delete draft[id];
      }
    });

    if (isEqual(previous, next)) return;

    this.#set(
      { toolCallingStreamIds: next },

      false,
      `toggleToolCallingStreaming/${!!streaming ? 'start' : 'end'}`,
    );
  };
}

export type StreamingStatesAction = Pick<
  StreamingStatesActionImpl,
  keyof StreamingStatesActionImpl
>;
