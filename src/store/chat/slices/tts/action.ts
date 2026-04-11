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

import { type ChatTTS } from '@lobechat/types';

import { messageService } from '@/services/message';
import { type ChatStore } from '@/store/chat/store';
import { type StoreSetter } from '@/store/types';

/**
 * enhance chat action like translate,tts
 */

type Setter = StoreSetter<ChatStore>;
export const chatTTS = (set: Setter, get: () => ChatStore, _api?: unknown) =>
  new ChatTTSActionImpl(set, get, _api);

export class ChatTTSActionImpl {
  readonly #get: () => ChatStore;

  constructor(set: Setter, get: () => ChatStore, _api?: unknown) {
    void _api;
    void set;
    this.#get = get;
  }

  clearTTS = async (id: string): Promise<void> => {
    await this.#get().updateMessageTTS(id, false);
  };

  ttsMessage = async (
    id: string,
    state: { contentMd5?: string; file?: string; voice?: string } = {},
  ): Promise<void> => {
    await this.#get().updateMessageTTS(id, state);
  };

  updateMessageTTS = async (id: string, data: Partial<ChatTTS> | false): Promise<void> => {
    // Optimistic update
    this.#get().internal_dispatchMessage({
      id,
      key: 'tts',
      type: 'updateMessageExtra',
      value: data === false ? undefined : data,
    });

    // Persist to database
    await messageService.updateMessageTTS(id, data);
  };
}

export type ChatTTSAction = Pick<ChatTTSActionImpl, keyof ChatTTSActionImpl>;
