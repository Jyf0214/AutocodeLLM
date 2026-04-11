/**
 * 本文件是 AutocodeLLM 项目的原始实现
 *
 * AutocodeLLM 项目许可证：
 * Apache License, Version 2.0
 * Copyright (c) 2026 Jyf0214
 */

import type { StateCreator } from 'zustand';
import type {
  ChatStoreState,
  AgentInstance,
  AgentState,
  ModelConfig,
  ChatMessage,
} from '../types';

/**
 * 运行Agent参数
 */
export interface RunAgentParams {
  message: string;
  model: ModelConfig;
  parentId?: string;
}

/**
 * Agent Slice - Agent调度和执行
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
 * 创建Agent Slice
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

    try {
      // TODO: 集成实际的Agent执行器
      // 这里需要调用 createAgentExecutors 和 StreamingHandler
      // 目前先实现一个简单的模拟
      
      await simulateAgentExecution(assistantMessageId, message, model);
      
      // 完成执行
      set((state) => ({
        agents: {
          ...state.agents,
          status: 'completed',
          activeAgents: state.agents.activeAgents.map((agent) => ({
            ...agent,
            status: 'completed' as const,
          })),
        },
      }));
    } catch (error) {
      // 处理错误
      const errorMessage = error instanceof Error ? error.message : 'Agent执行失败';
      
      get().updateMessage(assistantMessageId, {
        error: {
          message: errorMessage,
          code: 'AGENT_EXECUTION_FAILED',
        },
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

/**
 * 模拟Agent执行（临时实现）
 * TODO: 替换为实际的Agent执行器调用
 */
async function simulateAgentExecution(
  messageId: string,
  _input: string,
  _model: ModelConfig
): Promise<void> {
  // 模拟流式输出
  const chunks = [
    '这是一个模拟的AI回复。',
    '\n\n',
    '在实际实现中，这里会调用 createAgentExecutors 和 StreamingHandler 来处理真实的Agent执行流程。',
    '\n\n',
    '```typescript\n',
    '// 示例代码\n',
    'const executor = createAgentExecutors(context);\n',
    'await executor.call_llm(instruction, state, runtimeContext);\n',
    '```\n',
    '\n',
    '敬请期待真实实现！',
  ];

  for (const chunk of chunks) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    
    // 更新消息内容
    const state = useChatStore.getState();
    const existingMessage = state.messageMap.get(messageId);
    
    if (existingMessage) {
      useChatStore.getState().updateMessage(messageId, {
        content: existingMessage.content + chunk,
        updatedAt: Date.now(),
      });
    }
  }
}

// 延迟导入，避免循环依赖
let useChatStore: any;
import('../..').then((mod) => {
  useChatStore = mod.useChatStore;
});
