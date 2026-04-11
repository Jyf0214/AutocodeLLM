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

import { chainLangDetect, chainTranslate } from '@lobechat/prompts';
import { type ChatTranslate, type TracePayload } from '@lobechat/types';
import { TraceNameMap } from '@lobechat/types';
import { merge } from '@lobechat/utils';

import { supportLocales } from '@/locales/resources';
import { chatService } from '@/services/chat';
import { messageService } from '@/services/message';
import { dbMessageSelectors } from '@/store/chat/selectors';
import { type ChatStore } from '@/store/chat/store';
import { type StoreSetter } from '@/store/types';
import { useUserStore } from '@/store/user';
import { systemAgentSelectors } from '@/store/user/selectors';

/**
 * chat translate
 */

type Setter = StoreSetter<ChatStore>;
export const chatTranslate = (set: Setter, get: () => ChatStore, _api?: unknown) =>
  new ChatTranslateActionImpl(set, get, _api);

export class ChatTranslateActionImpl {
  readonly #get: () => ChatStore;

  constructor(set: Setter, get: () => ChatStore, _api?: unknown) {
    void _api;
    void set;
    this.#get = get;
  }

  clearTranslate = async (id: string): Promise<void> => {
    await this.#get().updateMessageTranslate(id, false);
  };

  getCurrentTracePayload = (data: Partial<TracePayload>): TracePayload => {
    return {
      sessionId: this.#get().activeAgentId,
      topicId: this.#get().activeTopicId,
      ...data,
    };
  };

  translateMessage = async (id: string, targetLang: string): Promise<void> => {
    const { updateMessageTranslate, internal_dispatchMessage } = this.#get();

    const message = dbMessageSelectors.getDbMessageById(id)(this.#get());
    if (!message) return;

    // Get current agent for translation
    const translationSetting = systemAgentSelectors.translation(useUserStore.getState());

    // create translate extra
    await updateMessageTranslate(id, { content: '', from: '', to: targetLang });

    // Create translate operation
    const { operationId } = this.#get().startOperation({
      context: {
        agentId: message.agentId,
        messageId: id,
        sessionId: message.sessionId,
        topicId: message.topicId,
      },
      label: 'Translating message',
      type: 'translate',
    });

    // Associate message with operation
    this.#get().associateMessageWithOperation(id, operationId);

    try {
      let content = '';
      let from = '';

      // detect from language
      chatService.fetchPresetTaskResult({
        onFinish: async (data) => {
          if (data && supportLocales.includes(data)) from = data;

          await updateMessageTranslate(id, { content, from, to: targetLang });
        },
        params: merge(translationSetting, chainLangDetect(message.content)),
        trace: this.#get().getCurrentTracePayload({ traceName: TraceNameMap.LanguageDetect }),
      });

      // translate to target language
      await chatService.fetchPresetTaskResult({
        onFinish: async (translatedContent) => {
          await updateMessageTranslate(id, { content: translatedContent, from, to: targetLang });
          this.#get().completeOperation(operationId);
        },
        onMessageHandle: (chunk) => {
          switch (chunk.type) {
            case 'text': {
              content += chunk.text;
              internal_dispatchMessage(
                {
                  id,
                  key: 'translate',
                  type: 'updateMessageExtra',
                  value: { content, from, to: targetLang },
                },
                { operationId },
              );
              break;
            }
          }
        },
        params: merge(translationSetting, chainTranslate(message.content, targetLang)),
        trace: this.#get().getCurrentTracePayload({ traceName: TraceNameMap.Translator }),
      });
    } catch (error) {
      this.#get().failOperation(operationId, {
        message: error instanceof Error ? error.message : String(error),
        type: 'TranslateError',
      });
      throw error;
    }
  };

  updateMessageTranslate = async (
    id: string,
    data: Partial<ChatTranslate> | false,
  ): Promise<void> => {
    // Optimistic update
    this.#get().internal_dispatchMessage({
      id,
      key: 'translate',
      type: 'updateMessageExtra',
      value: data === false ? undefined : data,
    });

    // Persist to database
    await messageService.updateMessageTranslate(id, data);
  };
}

export type ChatTranslateAction = Pick<ChatTranslateActionImpl, keyof ChatTranslateActionImpl>;
