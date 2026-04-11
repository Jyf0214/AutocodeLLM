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

import { type NavigateFunction } from 'react-router-dom';

import { chatGroupService } from '@/services/chatGroup';
import { documentService } from '@/services/document';
import { getAgentStoreState } from '@/store/agent';
import { agentSelectors, builtinAgentSelectors } from '@/store/agent/selectors';
import { getChatGroupStoreState } from '@/store/agentGroup';
import { useChatStore } from '@/store/chat';
import { type HomeStore } from '@/store/home/store';
import { type StoreSetter } from '@/store/types';
import { setNamespace } from '@/utils/storeDebug';

import { type StarterMode } from './initialState';

const n = setNamespace('homeInput');

interface SendMessageWithEditorParams {
  editorData?: Record<string, any>;
  message: string;
}

type Setter = StoreSetter<HomeStore>;
export const createHomeInputSlice = (set: Setter, get: () => HomeStore, _api?: unknown) =>
  new HomeInputActionImpl(set, get, _api);

export class HomeInputActionImpl {
  readonly #get: () => HomeStore;
  readonly #set: Setter;

  constructor(set: Setter, get: () => HomeStore, _api?: unknown) {
    void _api;
    this.#set = set;
    this.#get = get;
  }

  clearInputMode = (): void => {
    this.#set({ inputActiveMode: null }, false, n('clearInputMode'));
  };

  sendAsAgent = async ({ editorData, message }: SendMessageWithEditorParams): Promise<string> => {
    this.#set({ homeInputLoading: true }, false, n('sendAsAgent/start'));

    try {
      const agentState = getAgentStoreState();

      // 1. Get model/provider config from inbox agent
      const inboxAgentId = builtinAgentSelectors.inboxAgentId(agentState);
      const inboxConfig = inboxAgentId
        ? agentSelectors.getAgentConfigById(inboxAgentId)(agentState)
        : null;
      const model = inboxConfig?.model;
      const provider = inboxConfig?.provider;

      // 2. Create new Agent with inherited model/provider
      const result = await agentState.createAgent({
        config: {
          model,
          provider,
          systemRole: message,
          title: message?.slice(0, 50) || 'New Agent',
        },
      });

      // 3. Navigate to Agent profile page
      const { navigate } = this.#get();
      if (navigate) {
        navigate(`/agent/${result.agentId}/profile`);
      }

      // 4. Refresh agent list
      this.#get().refreshAgentList();

      // 5. Update agentBuilder's model config and send initial message
      if (result.agentId) {
        const { sendMessage } = useChatStore.getState();
        const agentBuilderId = builtinAgentSelectors.agentBuilderId(agentState);

        // Update agentBuilder's model to match inbox selection
        if (agentBuilderId && model && provider) {
          await agentState.updateAgentConfigById(agentBuilderId, { model, provider });
        }

        await sendMessage({
          context: { agentId: agentBuilderId!, scope: 'agent_builder' },
          editorData,
          message,
        });
      }

      // 6. Clear mode
      this.#set({ inputActiveMode: null }, false, n('sendAsAgent/clearMode'));

      return result.agentId!;
    } finally {
      this.#set({ homeInputLoading: false }, false, n('sendAsAgent/end'));
    }
  };

  sendAsGroup = async ({ editorData, message }: SendMessageWithEditorParams): Promise<string> => {
    this.#set({ homeInputLoading: true }, false, n('sendAsGroup/start'));

    try {
      const agentState = getAgentStoreState();

      // 1. Get model/provider config from inbox agent
      const inboxAgentId = builtinAgentSelectors.inboxAgentId(agentState);
      const inboxConfig = inboxAgentId
        ? agentSelectors.getAgentConfigById(inboxAgentId)(agentState)
        : null;
      const model = inboxConfig?.model;
      const provider = inboxConfig?.provider;

      // 2. Create new Group with inherited model/provider for orchestrator
      const { group } = await chatGroupService.createGroup({
        config: {
          systemPrompt: message,
        },
        title: message?.slice(0, 50) || 'New Group',
      });

      // 3. Load groups and refresh
      const groupStore = getChatGroupStoreState();
      await groupStore.loadGroups();

      // 4. Refresh sidebar agent list
      this.#get().refreshAgentList();

      // 5. Navigate to Group profile page
      const { navigate } = this.#get();
      if (navigate) {
        navigate(`/group/${group.id}/profile`);
      }

      // 6. Update groupAgentBuilder's model config and send initial message
      const groupAgentBuilderId = builtinAgentSelectors.groupAgentBuilderId(agentState);

      if (groupAgentBuilderId) {
        // Update groupAgentBuilder's model to match inbox selection
        if (model && provider) {
          await agentState.updateAgentConfigById(groupAgentBuilderId, { model, provider });
        }

        const { sendMessage } = useChatStore.getState();
        await sendMessage({
          context: { agentId: groupAgentBuilderId, scope: 'group_agent_builder' },
          editorData,
          message,
        });
      }

      // 7. Clear mode
      this.#set({ inputActiveMode: null }, false, n('sendAsGroup/clearMode'));

      return group.id;
    } finally {
      this.#set({ homeInputLoading: false }, false, n('sendAsGroup/end'));
    }
  };

  sendAsResearch = async (message: string): Promise<void> => {
    this.#set({ homeInputLoading: true }, false, n('sendAsResearch/start'));

    try {
      const agentState = getAgentStoreState();

      // 1. Get model/provider config from inbox agent
      const inboxAgentId = builtinAgentSelectors.inboxAgentId(agentState);
      const inboxConfig = inboxAgentId
        ? agentSelectors.getAgentConfigById(inboxAgentId)(agentState)
        : null;
      const model = inboxConfig?.model;
      const provider = inboxConfig?.provider;

      // 2. Create new Agent with research capabilities
      const result = await agentState.createAgent({
        config: {
          model,
          provider,
          systemRole: `你是一个深度研究助手。请对以下主题进行深入研究和分析：${message}`,
          title: message?.slice(0, 50) || 'Research Task',
        },
      });

      // 3. Navigate to Agent profile page
      const { navigate } = this.#get();
      if (navigate) {
        navigate(`/agent/${result.agentId}/profile`);
      }

      // 4. Refresh agent list
      this.#get().refreshAgentList();

      // 5. Send message with research context
      if (result.agentId) {
        const { sendMessage } = useChatStore.getState();
        const agentBuilderId = builtinAgentSelectors.agentBuilderId(agentState);

        if (agentBuilderId && model && provider) {
          await agentState.updateAgentConfigById(agentBuilderId, { model, provider });
        }

        await sendMessage({
          context: { agentId: agentBuilderId!, scope: 'agent_builder' },
          editorData: message,
          message,
        });
      }

      // 6. Clear mode
      this.#set({ inputActiveMode: null }, false, n('sendAsResearch/clearMode'));
    } finally {
      this.#set({ homeInputLoading: false }, false, n('sendAsResearch/end'));
    }
  };

  sendAsWrite = async ({ editorData, message }: SendMessageWithEditorParams): Promise<string> => {
    this.#set({ homeInputLoading: true }, false, n('sendAsWrite/start'));

    try {
      const agentState = getAgentStoreState();

      // 1. Get model/provider config from inbox agent
      const inboxAgentId = builtinAgentSelectors.inboxAgentId(agentState);
      const inboxConfig = inboxAgentId
        ? agentSelectors.getAgentConfigById(inboxAgentId)(agentState)
        : null;
      const model = inboxConfig?.model;
      const provider = inboxConfig?.provider;

      // 2. Create new Document
      const newDoc = await documentService.createDocument({
        editorData: '{}',
        fileType: 'custom/document',
        title: message?.slice(0, 50) || 'Untitled',
      });

      // 3. Navigate to Page
      const { navigate } = this.#get();
      if (navigate) {
        navigate(`/page/${newDoc.id}`);
      }

      // 4. Update pageAgent's model config and send initial message
      const pageAgentId = builtinAgentSelectors.pageAgentId(agentState);

      if (pageAgentId) {
        // Update pageAgent's model to match inbox selection
        if (model && provider) {
          await agentState.updateAgentConfigById(pageAgentId, { model, provider });
        }

        const { sendMessage } = useChatStore.getState();
        await sendMessage({
          context: { agentId: pageAgentId, scope: 'page' },
          editorData,
          message,
        });
      }

      // 5. Clear mode
      this.#set({ inputActiveMode: null }, false, n('sendAsWrite/clearMode'));

      return newDoc.id;
    } finally {
      this.#set({ homeInputLoading: false }, false, n('sendAsWrite/end'));
    }
  };

  setInputActiveMode = (mode: StarterMode): void => {
    this.#set({ inputActiveMode: mode }, false, n('setInputActiveMode', mode));
  };

  setNavigate = (navigate: NavigateFunction): void => {
    this.#set({ navigate }, false, n('setNavigate'));
  };
}

export type HomeInputAction = Pick<HomeInputActionImpl, keyof HomeInputActionImpl>;
