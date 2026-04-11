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

import { WebBrowsingApiName, WebBrowsingManifest } from '@lobechat/builtin-tool-web-browsing';
import { type ChatToolPayload, type CreateMessageParams, type SearchQuery } from '@lobechat/types';
import { nanoid } from '@lobechat/utils';

import { dbMessageSelectors } from '@/store/chat/selectors';
import { type ChatStore } from '@/store/chat/store';
import { type StoreSetter } from '@/store/types';

type Setter = StoreSetter<ChatStore>;
export const searchSlice = (set: Setter, get: () => ChatStore, _api?: unknown) =>
  new SearchActionImpl(set, get, _api);

export class SearchActionImpl {
  readonly #get: () => ChatStore;
  readonly #set: Setter;

  constructor(set: Setter, get: () => ChatStore, _api?: unknown) {
    void _api;
    this.#set = set;
    this.#get = get;
  }

  saveSearchResult = async (id: string): Promise<void> => {
    const message = dbMessageSelectors.getDbMessageById(id)(this.#get());
    if (!message || !message.plugin) return;

    const { optimisticAddToolToAssistantMessage, optimisticCreateMessage, openToolUI } =
      this.#get();

    // Get operationId from messageOperationMap
    const operationId = this.#get().messageOperationMap[id];
    const context = operationId ? { operationId } : undefined;

    // 1. Create a new tool call message
    const newToolCallId = `tool_call_${nanoid()}`;

    const toolMessage: CreateMessageParams = {
      agentId: message.agentId ?? this.#get().activeAgentId,
      content: message.content,
      id: undefined,
      parentId: message.parentId,
      plugin: message.plugin,
      pluginState: message.pluginState,
      role: 'tool',
      tool_call_id: newToolCallId,
      topicId: message.topicId !== undefined ? message.topicId : this.#get().activeTopicId,
    };

    const addToolItem = async () => {
      if (!message.parentId || !message.plugin) return;

      await optimisticAddToolToAssistantMessage(
        message.parentId,
        {
          id: newToolCallId,
          ...message.plugin,
        },
        context,
      );
    };

    const [result] = await Promise.all([
      // 1. Add tool message
      optimisticCreateMessage(toolMessage, context),
      // 2. Insert this tool call message into the AI message's tools array
      addToolItem(),
    ]);
    if (!result) return;

    // Activate the newly created tool message
    openToolUI(result.id, message.plugin.identifier);
  };

  togglePageContent = (url: string): void => {
    this.#set({ activePageContentUrl: url });
  };

  triggerSearchAgain = async (id: string, data: SearchQuery): Promise<void> => {
    const message = dbMessageSelectors.getDbMessageById(id)(this.#get());
    if (!message) return;

    // Get operationId from messageOperationMap to ensure proper context isolation
    const operationId = this.#get().messageOperationMap[id];
    const context = operationId ? { operationId } : undefined;

    // 1. Update plugin arguments
    await this.#get().optimisticUpdatePluginArguments(id, data, false, context);

    // 2. Call the Tool Store Executor via invokeBuiltinTool
    const payload = {
      apiName: WebBrowsingApiName.search,
      arguments: JSON.stringify(data),
      // Use tool_call_id from message, or generate one if not available
      id: message.tool_call_id,
      identifier: WebBrowsingManifest.identifier,
      type: 'builtin',
    } as ChatToolPayload;

    await this.#get().invokeBuiltinTool(id, payload);
  };
}

export type SearchAction = Pick<SearchActionImpl, keyof SearchActionImpl>;
