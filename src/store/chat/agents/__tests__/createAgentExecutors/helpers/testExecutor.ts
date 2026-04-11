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

import type { AgentInstruction, AgentState } from '@lobechat/agent-runtime';
import type { MessageMapScope } from '@lobechat/types';

import { DEFAULT_AGENT_CHAT_CONFIG, DEFAULT_AGENT_CONFIG } from '@/const/settings';
import { type ResolvedAgentConfig } from '@/services/chat/mecha';
import { createAgentExecutors } from '@/store/chat/agents/createAgentExecutors';
import { type OperationType } from '@/store/chat/slices/operation/types';
import { type ChatStore } from '@/store/chat/store';

/**
 * Create a mock ResolvedAgentConfig for testing
 */
const createMockResolvedAgentConfig = (): ResolvedAgentConfig => ({
  agentConfig: { ...DEFAULT_AGENT_CONFIG },
  chatConfig: { ...DEFAULT_AGENT_CHAT_CONFIG },
  isBuiltinAgent: false,
  plugins: [],
});

/**
 * Execute an executor with mock context
 *
 * @example
 * const result = await executeWithMockContext({
 *   executor: 'call_llm',
 *   instruction: createCallLLMInstruction(),
 *   state: createInitialState(),
 *   mockStore,
 *   context: { operationId: 'op_123', messageKey: 'session_topic', parentId: 'msg_456' }
 * });
 */
export const executeWithMockContext = async ({
  executor,
  instruction,
  state,
  mockStore,
  context,
  skipCreateFirstMessage = false,
}: {
  context: {
    agentId?: string;
    groupId?: string;
    messageKey: string;
    operationId: string;
    parentId: string;
    scope?: MessageMapScope;
    subAgentId?: string;
    topicId?: string | null;
  };
  executor: AgentInstruction['type'];
  instruction: AgentInstruction;
  mockStore: ChatStore;
  skipCreateFirstMessage?: boolean;
  state: AgentState;
}) => {
  // Ensure operation exists in store
  if (!mockStore.operations[context.operationId]) {
    mockStore.operations[context.operationId] = {
      abortController: new AbortController(),
      childOperationIds: [],
      context: {
        agentId: context.agentId || 'test-session',
        groupId: context.groupId,
        messageId: context.parentId,
        scope: context.scope,
        subAgentId: context.subAgentId,
        topicId: context.topicId !== undefined ? context.topicId : 'test-topic',
      },
      id: context.operationId,
      metadata: { startTime: Date.now() },
      status: 'running',
      type: 'execAgentRuntime' as OperationType,
    };
  }

  // Create executors with mock context
  const executors = createAgentExecutors({
    agentConfig: createMockResolvedAgentConfig(),
    get: () => mockStore,
    messageKey: context.messageKey,
    operationId: context.operationId,
    parentId: context.parentId,
    skipCreateFirstMessage,
  });

  const executorFn = executors[executor];
  if (!executorFn) {
    throw new Error(`Executor ${executor} not found`);
  }

  // Execute
  const result = await executorFn(instruction, state);

  return result;
};

/**
 * Create initial agent runtime state for testing
 */
export const createInitialState = (overrides: Partial<AgentState> = {}): AgentState => {
  const defaultState: any = {
    lastModified: new Date().toISOString(),
    messages: [],
    sessionId: 'test-session',
    status: 'running',
    stepCount: 1,
    usage: {
      humanInteraction: {
        approvalRequests: 0,
        promptRequests: 0,
        selectRequests: 0,
        totalWaitingTimeMs: 0,
      },
      llm: {
        apiCalls: 0,
        processingTimeMs: 0,
        tokens: {
          input: 0,
          output: 0,
          total: 0,
        },
      },
      tools: {
        byTool: [],
        totalCalls: 0,
        totalTimeMs: 0,
      },
    },
  };

  return {
    ...defaultState,
    ...overrides,
  } as AgentState;
};

/**
 * Create a test context object for executor
 */
export const createTestContext = (
  overrides: {
    agentId?: string;
    groupId?: string;
    messageKey?: string;
    operationId?: string;
    parentId?: string;
    scope?: MessageMapScope;
    subAgentId?: string;
    topicId?: string | null;
  } = {},
) => {
  return {
    agentId: overrides.agentId || 'test-session',
    groupId: overrides.groupId,
    messageKey:
      overrides.messageKey ||
      `${overrides.agentId || 'test-session'}_${overrides.topicId !== undefined ? overrides.topicId : 'test-topic'}`,
    operationId: overrides.operationId || 'op_test',
    parentId: overrides.parentId || 'msg_parent',
    scope: overrides.scope,
    subAgentId: overrides.subAgentId,
    topicId: overrides.topicId !== undefined ? overrides.topicId : 'test-topic',
  };
};
