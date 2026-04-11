/**
 * 本文件是 AutocodeLLM 项目的原始实现
 *
 * AutocodeLLM 项目许可证：
 * Apache License, Version 2.0
 * Copyright (c) 2026 Jyf0214
 */

import type { StateCreator } from 'zustand/vanilla';
import type {
  ChatStoreState,
  AgentInstance,
  AgentState,
  ModelConfig,
  ChatMessage,
} from '../types';
import { simpleExecute, throttle } from '../../../lib/AgentExecutorAdapter';

/**
 * 运行Agent参数
 */
export interface RunAgentParams {
  message: string;
  model: ModelConfig;
  parentId?: string;
}

/**
 * Agent Slice - Agent调度和执行(优化版)
 * 包含节流优化和完整的错误处理
 */
export interface AgentSlice {
  // Actions
  runSingleAgent: (params: RunAgentParams) => Promise<void>;
  cancelAgentExecution: () => void;
  updateAgentStatus: (status: AgentState['status']) => void;
  setActiveAgents: (agents: AgentInstance[]) => void;
  addActiveAgent: (agent: AgentInstance) => void;
  removeActiveAgent: (agentId: string) => void;
  updateAgent: (agentId: string, updates: Partial<AgentInstance>) => void;
}

/**
 * 创建Agent Slice(优化版)
 */
export const createAgentSlice: StateCreator<
  ChatStoreState,
  [['zustand/devtools', never]],
  [],
  AgentSlice
> = (set, get) => ({
  // 初始状态
  agents: {
    activeAgents: [],
    status: 'idle',
  },

  // Actions
  runSingleAgent: async (params: RunAgentParams) => {
    const state = get();
    const { message, model } = params;

    // 检查是否正在运行
    if (state.agents.status === 'running') {
      console.warn('Agent is already running');
      return;
    }

    // 创建用户消息
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: message,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      meta: {
        title: '用户',
        avatar: '👤',
      },
    };

    // 添加用户消息
    get().addMessage(userMessage);

    // 创建Assistant占位消息
    const assistantMessageId = `msg-${Date.now()}-assistant`;
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      meta: {
        title: model ? `AI 助手 · ${model.name}` : 'AI 助手',
        avatar: '🤖',
      },
      model: model.name,
      provider: model.provider,
    };

    get().addMessage(assistantMessage);

    // 设置Agent状态为运行中
    set({
      agents: {
        activeAgents: [
          {
            id: 'default-agent',
            name: model.name,
            role: 'worker',
            status: 'running',
            task: '处理用户消息',
          },
        ],
        status: 'running',
        currentOperationId: `op-${Date.now()}`,
      },
      input: {
        ...state.input,
        isSending: false,
      },
    });

    // 创建节流版本的更新函数(16ms ≈ 60fps)
    const throttledUpdate = throttle(
      (content: string) => {
        get().updateMessage(assistantMessageId, {
          content,
          updatedAt: Date.now(),
        });
      },
      16 // 16ms节流,限制在60fps以内
    );

    let finalContent = '';

    try {
      // 使用simpleExecute执行真实的Agent
      await simpleExecute({
        userInput: message,
        model,
        onContentUpdate: (content: string) => {
          finalContent = content;
          // 使用节流更新,避免过于频繁的渲染
          throttledUpdate(content);
        },
        onComplete: () => {
          // 确保最终内容被更新
          get().updateMessage(assistantMessageId, {
            content: finalContent,
            updatedAt: Date.now(),
            usage: {
              inputTokens: message.length, // 估算
              outputTokens: finalContent.length,
              totalTokens: message.length + finalContent.length,
            },
          });

          // 完成执行
          set((state) => ({
            agents: {
              ...state.agents,
              status: 'completed',
              activeAgents: state.agents.activeAgents.map((agent) => ({
                ...agent,
                status: 'completed' as const,
                result: finalContent,
              })),
            },
          }));

          // 3秒后重置为idle
          setTimeout(() => {
            set((state) => ({
              agents: {
                ...state.agents,
                status: 'idle',
              },
            }));
          }, 3000);
        },
        onError: (error: Error) => {
          // 处理错误
          get().updateMessage(assistantMessageId, {
            content: finalContent || '回复生成失败',
            error: {
              message: error.message,
              code: 'AGENT_EXECUTION_FAILED',
            },
            updatedAt: Date.now(),
          });

          set((state) => ({
            agents: {
              ...state.agents,
              status: 'error',
              activeAgents: state.agents.activeAgents.map((agent) => ({
                ...agent,
                status: 'error' as const,
              })),
            },
          }));
        },
      });
    } catch (error) {
      // 处理未捕获的错误
      const errorMessage = error instanceof Error ? error.message : 'Agent执行失败';
      
      get().updateMessage(assistantMessageId, {
        content: finalContent || '回复生成失败',
        error: {
          message: errorMessage,
          code: 'AGENT_EXECUTION_FAILED',
        },
        updatedAt: Date.now(),
      });

      set((state) => ({
        agents: {
          ...state.agents,
          status: 'error',
          activeAgents: state.agents.activeAgents.map((agent) => ({
            ...agent,
            status: 'error' as const,
          })),
        },
      }));
    }
  },

  cancelAgentExecution: () => {
    const state = get();
    
    if (state.agents.status !== 'running') {
      return;
    }

    // TODO: 实际应该调用abortController.abort()
    set((state) => ({
      agents: {
        ...state.agents,
        status: 'cancelled',
        activeAgents: state.agents.activeAgents.map((agent) => ({
          ...agent,
          status: 'cancelled' as const,
        })),
      },
    }));
  },

  updateAgentStatus: (status: AgentState['status']) => {
    set((state) => ({
      agents: {
        ...state.agents,
        status,
      },
    }));
  },

  setActiveAgents: (agents: AgentInstance[]) => {
    set((state) => ({
      agents: {
        ...state.agents,
        activeAgents: agents,
      },
    }));
  },

  addActiveAgent: (agent: AgentInstance) => {
    set((state) => ({
      agents: {
        ...state.agents,
        activeAgents: [...state.agents.activeAgents, agent],
      },
    }));
  },

  removeActiveAgent: (agentId: string) => {
    set((state) => ({
      agents: {
        ...state.agents,
        activeAgents: state.agents.activeAgents.filter((a) => a.id !== agentId),
      },
    }));
  },

  updateAgent: (agentId: string, updates: Partial<AgentInstance>) => {
    set((state) => ({
      agents: {
        ...state.agents,
        activeAgents: state.agents.activeAgents.map((agent) =>
          agent.id === agentId ? { ...agent, ...updates } : agent
        ),
      },
    }));
  },
});
