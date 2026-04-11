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

import { type KnowledgeItem } from '@lobechat/types';
import { type SWRResponse } from 'swr';

import { mutate, useClientDataSWR } from '@/libs/swr';
import { agentService } from '@/services/agent';
import { type StoreSetter } from '@/store/types';

import { type AgentStore } from '../../store';

const FETCH_AGENT_KNOWLEDGE_KEY = 'FETCH_AGENT_KNOWLEDGE';

/**
 * Knowledge Slice Actions
 * Handles knowledge base and file operations
 */

type Setter = StoreSetter<AgentStore>;
export const createKnowledgeSlice = (set: Setter, get: () => AgentStore, _api?: unknown) =>
  new KnowledgeSliceActionImpl(set, get, _api);

export class KnowledgeSliceActionImpl {
  readonly #get: () => AgentStore;

  constructor(set: Setter, get: () => AgentStore, _api?: unknown) {
    void _api;
    void set;
    this.#get = get;
  }

  addFilesToAgent = async (fileIds: string[], enabled?: boolean): Promise<void> => {
    const { activeAgentId, internal_refreshAgentConfig, internal_refreshAgentKnowledge } =
      this.#get();
    if (!activeAgentId) return;
    if (fileIds.length === 0) return;

    await agentService.createAgentFiles(activeAgentId, fileIds, enabled);
    await internal_refreshAgentConfig(activeAgentId);
    await internal_refreshAgentKnowledge();
  };

  addKnowledgeBaseToAgent = async (knowledgeBaseId: string): Promise<void> => {
    const { activeAgentId, internal_refreshAgentConfig, internal_refreshAgentKnowledge } =
      this.#get();
    if (!activeAgentId) return;

    await agentService.createAgentKnowledgeBase(activeAgentId, knowledgeBaseId, true);
    await internal_refreshAgentConfig(activeAgentId);
    await internal_refreshAgentKnowledge();
  };

  internal_refreshAgentKnowledge = async (): Promise<void> => {
    await mutate([FETCH_AGENT_KNOWLEDGE_KEY, this.#get().activeAgentId]);
  };

  removeFileFromAgent = async (fileId: string): Promise<void> => {
    const { activeAgentId, internal_refreshAgentConfig, internal_refreshAgentKnowledge } =
      this.#get();
    if (!activeAgentId) return;

    await agentService.deleteAgentFile(activeAgentId, fileId);
    await internal_refreshAgentConfig(activeAgentId);
    await internal_refreshAgentKnowledge();
  };

  removeKnowledgeBaseFromAgent = async (knowledgeBaseId: string): Promise<void> => {
    const { activeAgentId, internal_refreshAgentConfig, internal_refreshAgentKnowledge } =
      this.#get();
    if (!activeAgentId) return;

    await agentService.deleteAgentKnowledgeBase(activeAgentId, knowledgeBaseId);
    await internal_refreshAgentConfig(activeAgentId);
    await internal_refreshAgentKnowledge();
  };

  toggleFile = async (id: string, open?: boolean): Promise<void> => {
    const { activeAgentId, internal_refreshAgentConfig } = this.#get();
    if (!activeAgentId) return;

    await agentService.toggleFile(activeAgentId, id, open);
    await internal_refreshAgentConfig(activeAgentId);
  };

  toggleKnowledgeBase = async (id: string, open?: boolean): Promise<void> => {
    const { activeAgentId, internal_refreshAgentConfig } = this.#get();
    if (!activeAgentId) return;

    await agentService.toggleKnowledgeBase(activeAgentId, id, open);
    await internal_refreshAgentConfig(activeAgentId);
  };

  useFetchFilesAndKnowledgeBases = (agentId?: string): SWRResponse<KnowledgeItem[]> => {
    return useClientDataSWR<KnowledgeItem[]>(
      agentId ? [FETCH_AGENT_KNOWLEDGE_KEY, agentId] : null,
      ([, id]: string[]) => agentService.getFilesAndKnowledgeBases(id),
      {
        fallbackData: [],
      },
    );
  };
}

export type KnowledgeSliceAction = Pick<KnowledgeSliceActionImpl, keyof KnowledgeSliceActionImpl>;
