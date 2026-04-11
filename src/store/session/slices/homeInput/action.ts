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

import { documentService } from '@/services/document';
import { useChatStore } from '@/store/chat';
import { useGlobalStore } from '@/store/global';
import { type SessionStore } from '@/store/session/store';
import { type StoreSetter } from '@/store/types';
import { setNamespace } from '@/utils/storeDebug';

import { type StarterMode } from './initialState';

const n = setNamespace('homeInput');

interface SendMessageWithEditorParams {
  editorData?: Record<string, any>;
  message: string;
}

type Setter = StoreSetter<SessionStore>;
export const createHomeInputSlice = (set: Setter, get: () => SessionStore, _api?: unknown) =>
  new HomeInputActionImpl(set, get, _api);

export class HomeInputActionImpl {
  readonly #get: () => SessionStore;
  readonly #set: Setter;

  constructor(set: Setter, get: () => SessionStore, _api?: unknown) {
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
      // 1. Create new Agent using existing createSession action
      const newAgentId = await this.#get().createSession(
        {
          config: { systemRole: message },
          meta: { title: message?.slice(0, 50) || 'New Agent' },
        },
        false, // Don't switch session, we'll navigate manually
      );

      // 2. Navigate to Agent profile page
      const navigate = useGlobalStore.getState().navigate;
      if (navigate) {
        navigate(`/agent/${newAgentId}/profile`);
      }

      // 3. Send initial message with agentId context
      const { sendMessage } = useChatStore.getState();
      await sendMessage({
        context: { agentId: newAgentId, scope: 'agent_builder' },
        editorData,
        message,
      });

      // 4. Clear mode
      this.#set({ inputActiveMode: null }, false, n('sendAsAgent/clearMode'));

      return newAgentId;
    } finally {
      this.#set({ homeInputLoading: false }, false, n('sendAsAgent/end'));
    }
  };

  sendAsImage = (): void => {
    // Navigate to /image page
    const navigate = useGlobalStore.getState().navigate;
    if (navigate) {
      navigate('/image');
    }

    // Clear mode
    this.#set({ inputActiveMode: null }, false, n('sendAsImage'));
  };

  sendAsResearch = async (message: string): Promise<void> => {
    // TODO: Implement DeepResearch mode
    console.info('sendAsResearch:', message);

    // Clear mode
    this.#set({ inputActiveMode: null }, false, n('sendAsResearch'));
  };

  sendAsWrite = async ({ editorData, message }: SendMessageWithEditorParams): Promise<string> => {
    this.#set({ homeInputLoading: true }, false, n('sendAsWrite/start'));

    try {
      // 1. Create new Document
      const newDoc = await documentService.createDocument({
        editorData: '',
        title: message?.slice(0, 50) || 'Untitled',
      });

      // 2. Navigate to Page
      const navigate = useGlobalStore.getState().navigate;
      if (navigate) {
        navigate(`/page/${newDoc.id}`);
      }

      // 3. Send message with document scope context
      const { sendMessage } = useChatStore.getState();
      await sendMessage({
        context: {
          agentId: newDoc.id,
          scope: 'page',
        },
        editorData,
        message,
      });

      // 4. Clear mode
      this.#set({ inputActiveMode: null }, false, n('sendAsWrite/clearMode'));

      return newDoc.id;
    } finally {
      this.#set({ homeInputLoading: false }, false, n('sendAsWrite/end'));
    }
  };

  setInputActiveMode = (mode: StarterMode): void => {
    this.#set({ inputActiveMode: mode }, false, n('setInputActiveMode', mode));
  };
}

export type HomeInputAction = Pick<HomeInputActionImpl, keyof HomeInputActionImpl>;
