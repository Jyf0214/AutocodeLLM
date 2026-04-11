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

import { type ChatToolPayload, type RuntimeStepContext, type UIChatMessage } from '@lobechat/types';
import i18n from 'i18next';

import { type ChatStore } from '@/store/chat/store';
import { type StoreSetter } from '@/store/types';

import { type OptimisticUpdateContext } from '../../message/actions/optimisticUpdate';
import { displayMessageSelectors } from '../../message/selectors';

/**
 * Public API for plugin operations
 * These methods are called by UI components or other business scenarios
 */

type Setter = StoreSetter<ChatStore>;
export const pluginPublicApi = (set: Setter, get: () => ChatStore, _api?: unknown) =>
  new PluginPublicApiActionImpl(set, get, _api);

export class PluginPublicApiActionImpl {
  readonly #get: () => ChatStore;

  constructor(set: Setter, get: () => ChatStore, _api?: unknown) {
    void _api;
    void set;
    this.#get = get;
  }

  fillPluginMessageContent = async (
    id: string,
    content: string,
    triggerAiMessage?: boolean,
    context?: OptimisticUpdateContext,
  ): Promise<void> => {
    const { triggerAIMessage, optimisticUpdateMessageContent } = this.#get();

    await optimisticUpdateMessageContent(id, content, undefined, context);

    if (triggerAiMessage) await triggerAIMessage({ parentId: id });
  };

  reInvokeToolMessage = async (id: string): Promise<void> => {
    const message = displayMessageSelectors.getDisplayMessageById(id)(this.#get());
    if (!message || message.role !== 'tool' || !message.plugin) return;

    // Get operationId from messageOperationMap
    const operationId = this.#get().messageOperationMap[id];
    const context = operationId ? { operationId } : undefined;

    // if there is error content, then clear the error
    if (!!message.pluginError) {
      this.#get().optimisticUpdateMessagePluginError(id, null, context);
    }

    const payload: ChatToolPayload = { ...message.plugin, id: message.tool_call_id! };

    await this.#get().internal_invokeDifferentTypePlugin(id, payload);
  };

  summaryPluginContent = async (id: string): Promise<void> => {
    const message = displayMessageSelectors.getDisplayMessageById(id)(this.#get());
    if (!message || message.role !== 'tool') return;

    const { activeAgentId, activeTopicId, activeThreadId } = this.#get();

    await this.#get().internal_execAgentRuntime({
      context: {
        agentId: activeAgentId,
        topicId: activeTopicId,
        threadId: activeThreadId ?? undefined,
      },
      messages: [
        {
          role: 'assistant',
          content: i18n.t('prompts.summaryExpert', { ns: 'chat' }),
        },
        {
          ...message,
          content: message.content,
          role: 'assistant',
          name: undefined,
          tool_call_id: undefined,
        },
      ] as UIChatMessage[],
      parentMessageId: message.id,
      parentMessageType: 'assistant',
    });
  };

  internal_invokeDifferentTypePlugin = async (
    id: string,
    payload: ChatToolPayload,
    stepContext?: RuntimeStepContext,
  ): Promise<any> => {
    switch (payload.type) {
      // @ts-ignore
      case 'mcp': {
        return await this.#get().invokeMCPTypePlugin(id, payload);
      }

      case 'builtin':
      default: {
        // Pass stepContext to builtin tools for dynamic state access
        return await this.#get().invokeBuiltinTool(id, payload, stepContext);
      }
    }
  };
}

export type PluginPublicApiAction = Pick<
  PluginPublicApiActionImpl,
  keyof PluginPublicApiActionImpl
>;
