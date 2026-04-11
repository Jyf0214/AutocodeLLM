/**
 * 本文件是 AutocodeLLM 项目的原始实现
 *
 * AutocodeLLM 项目许可证：
 * Apache License, Version 2.0
 * Copyright (c) 2026 Jyf0214
 */

import type { StateCreator } from 'zustand';
import type { ChatStoreState, AgentInstance, AgentState, ModelConfig, ChatMessage } from '../../types';
import { simpleExecute, throttle } from '../../../lib/AgentExecutorAdapter';

export interface RunAgentParams {
  message: string;
  model: ModelConfig;
  parentId?: string;
}

export interface AgentSlice {
  runSingleAgent: (params: RunAgentParams) => Promise<void>;
  cancelAgentExecution: () => void;
  updateAgentStatus: (status: AgentState['status']) => void;
  setActiveAgents: (agents: AgentInstance[]) => void;
  addActiveAgent: (agent: AgentInstance) => void;
  removeActiveAgent: (agentId: string) => void;
  updateAgent: (agentId: string, updates: Partial<AgentInstance>) => void;
}

type C = StateCreator<ChatStoreState, [['zustand/devtools', never]], [], AgentSlice>;

export const createAgentSlice: C = (set, get) => ({
  agents: { activeAgents: [], status: 'idle' },

  runSingleAgent: async (params: RunAgentParams) => {
    const state = get();
    if (state.agents.status === 'running') return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: params.message,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      meta: { title: '用户', avatar: '👤' },
    };
    get().addMessage(userMessage);

    const assistantMessageId = `msg-${Date.now()}-assistant`;
    get().addMessage({
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      meta: { title: params.model ? `AI · ${params.model.name}` : 'AI', avatar: '🤖' },
      model: params.model.name,
      provider: params.model.provider,
    });

    set({
      agents: {
        activeAgents: [{ id: 'default', name: params.model.name, role: 'worker', status: 'running', task: '处理中' }],
        status: 'running',
        currentOperationId: `op-${Date.now()}`,
      },
      input: { ...state.input, isSending: false },
    });

    let finalContent = '';
    const throttledUpdate = throttle(16)((content: string) => {
      get().updateMessage(assistantMessageId, { content, updatedAt: Date.now() });
    });

    try {
      await simpleExecute({
        userInput: params.message,
        model: params.model,
        onContentUpdate: (content: string) => {
          finalContent = content;
          throttledUpdate(content);
        },
        onComplete: () => {
          get().updateMessage(assistantMessageId, { content: finalContent, updatedAt: Date.now() });
          set((s) => ({ agents: { ...s.agents, status: 'completed' as const } }));
          setTimeout(() => set((s) => ({ agents: { ...s.agents, status: 'idle' } })), 3000);
        },
        onError: (error: Error) => {
          get().updateMessage(assistantMessageId, { content: finalContent || '失败', error: { message: error.message, code: 'ERR' }, updatedAt: Date.now() });
          set((s) => ({ agents: { ...s.agents, status: 'error' as const } }));
        },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : '失败';
      get().updateMessage(assistantMessageId, { content: finalContent || '失败', error: { message: msg, code: 'ERR' }, updatedAt: Date.now() });
      set((s) => ({ agents: { ...s.agents, status: 'error' as const } }));
    }
  },

  cancelAgentExecution: () => set((s) => ({ agents: { ...s.agents, status: 'cancelled' as const } })),
  updateAgentStatus: (status: AgentState['status']) => set((s) => ({ agents: { ...s.agents, status } })),
  setActiveAgents: (agents: AgentInstance[]) => set((s) => ({ agents: { ...s.agents, activeAgents: agents } })),
  addActiveAgent: (agent: AgentInstance) => set((s) => ({ agents: { ...s.agents, activeAgents: [...s.agents.activeAgents, agent] } })),
  removeActiveAgent: (agentId: string) => set((s) => ({ agents: { ...s.agents, activeAgents: s.agents.activeAgents.filter((a) => a.id !== agentId) } })),
  updateAgent: (agentId: string, updates: Partial<AgentInstance>) => set((s) => ({ agents: { ...s.agents, activeAgents: s.agents.activeAgents.map((a) => (a.id === agentId ? { ...a, ...updates } : a)) } })),
});
