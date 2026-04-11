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

export interface RunAgentParams { message: string; model: ModelConfig; parentId?: string; }
export interface AgentSlice {
  runSingleAgent: (p: RunAgentParams) => Promise<void>;
  cancelAgentExecution: () => void;
  updateAgentStatus: (s: AgentState['status']) => void;
  setActiveAgents: (a: AgentInstance[]) => void;
  addActiveAgent: (a: AgentInstance) => void;
  removeActiveAgent: (id: string) => void;
  updateAgent: (id: string, u: Partial<AgentInstance>) => void;
}

export const createAgentSlice: StateCreator<ChatStoreState, [], [], AgentSlice> = (set, get) => ({
  agents: { activeAgents: [], status: 'idle' },
  runSingleAgent: async (p) => {
    const s = get();
    if (s.agents.status === 'running') return;
    get().addMessage({ id: `u-${Date.now()}`, role: 'user', content: p.message, createdAt: Date.now(), updatedAt: Date.now(), meta: { title: '用户', avatar: '👤' } });
    const aid = `a-${Date.now()}`;
    get().addMessage({ id: aid, role: 'assistant', content: '', createdAt: Date.now(), updatedAt: Date.now(), meta: { title: p.model ? `AI · ${p.model.name}` : 'AI', avatar: '🤖' }, model: p.model.name, provider: p.model.provider });
    set({ agents: { activeAgents: [{ id: 'd', name: p.model.name, role: 'worker', status: 'running', task: '处理中' }], status: 'running', currentOperationId: `o-${Date.now()}` }, input: { ...s.input, isSending: false } });
    let fc = '';
    const tu = throttle(16)((c: string) => get().updateMessage(aid, { content: c, updatedAt: Date.now() }));
    try {
      await simpleExecute({ userInput: p.message, model: p.model, onContentUpdate: (c) => { fc = c; tu(c); }, onComplete: () => { get().updateMessage(aid, { content: fc, updatedAt: Date.now() }); set((st) => ({ agents: { ...st.agents, status: 'completed' as const } })); setTimeout(() => set((st) => ({ agents: { ...st.agents, status: 'idle' } })), 3000); }, onError: (e) => { get().updateMessage(aid, { content: fc || '失败', error: { message: e.message, code: 'ERR' }, updatedAt: Date.now() }); set((st) => ({ agents: { ...st.agents, status: 'error' as const } })); } });
    } catch (error) { const m = error instanceof Error ? error.message : '失败'; get().updateMessage(aid, { content: fc || '失败', error: { message: m, code: 'ERR' }, updatedAt: Date.now() }); set((st) => ({ agents: { ...st.agents, status: 'error' as const } })); }
  },
  cancelAgentExecution: () => set((s) => ({ agents: { ...s.agents, status: 'cancelled' as const } })),
  updateAgentStatus: (status) => set((s) => ({ agents: { ...s.agents, status } })),
  setActiveAgents: (agents) => set((s) => ({ agents: { ...s.agents, activeAgents: agents } })),
  addActiveAgent: (agent) => set((s) => ({ agents: { ...s.agents, activeAgents: [...s.agents.activeAgents, agent] } })),
  removeActiveAgent: (id) => set((s) => ({ agents: { ...s.agents, activeAgents: s.agents.activeAgents.filter((a) => a.id !== id) } })),
  updateAgent: (id, u) => set((s) => ({ agents: { ...s.agents, activeAgents: s.agents.activeAgents.map((a) => (a.id === id ? { ...a, ...u } : a)) } })),
});
