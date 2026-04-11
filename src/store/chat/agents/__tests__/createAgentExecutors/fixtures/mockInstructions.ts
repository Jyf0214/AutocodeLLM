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

import {
  type AgentInstruction,
  type AgentInstructionCallLlm,
  type AgentInstructionCallTool,
  type AgentInstructionExecTask,
  type AgentInstructionExecTasks,
  type ExecTaskItem,
  type GeneralAgentCallingToolInstructionPayload,
  type GeneralAgentCallLLMInstructionPayload,
} from '@lobechat/agent-runtime';
import { type ChatToolPayload } from '@lobechat/types';
import { nanoid } from '@lobechat/utils';

/**
 * Create a mock call_llm instruction
 */
export const createCallLLMInstruction = (
  payload: Partial<GeneralAgentCallLLMInstructionPayload> = {},
): AgentInstructionCallLlm => {
  return {
    payload: {
      messages: [],
      model: 'gpt-4',
      parentMessageId: `msg_${nanoid()}`,
      provider: 'openai',
      ...payload,
    } as GeneralAgentCallLLMInstructionPayload,
    type: 'call_llm',
  };
};

/**
 * Create a mock call_tool instruction
 */
export const createCallToolInstruction = (
  toolCall: Partial<ChatToolPayload> = {},
  options: {
    parentMessageId?: string;
    skipCreateToolMessage?: boolean;
  } = {},
): AgentInstructionCallTool => {
  const toolPayload: ChatToolPayload = {
    apiName: 'search',
    arguments: JSON.stringify({ query: 'test' }),
    id: `tool_call_${nanoid()}`,
    identifier: 'lobe-web-browsing',
    type: 'default',
    ...toolCall,
  };

  return {
    payload: {
      parentMessageId: options.parentMessageId || `msg_${nanoid()}`,
      skipCreateToolMessage: options.skipCreateToolMessage || false,
      toolCalling: toolPayload,
    } as GeneralAgentCallingToolInstructionPayload,
    type: 'call_tool',
  };
};

/**
 * Create a mock request_human_approve instruction
 */
export const createRequestHumanApproveInstruction = (
  pendingTools: ChatToolPayload[] = [],
  options: {
    reason?: string;
    skipCreateToolMessage?: boolean;
  } = {},
): AgentInstruction => {
  const pendingToolsCalling = pendingTools.length
    ? pendingTools
    : [
        {
          apiName: 'search',
          arguments: JSON.stringify({ query: 'test' }),
          id: `tool_call_${nanoid()}`,
          identifier: 'lobe-web-browsing',
          type: 'default',
        },
      ];

  return {
    pendingToolsCalling,
    reason: options.reason,
    skipCreateToolMessage: options.skipCreateToolMessage || false,
    type: 'request_human_approve',
  } as AgentInstruction;
};

/**
 * Create a mock resolve_aborted_tools instruction
 */
export const createResolveAbortedToolsInstruction = (
  toolsCalling: ChatToolPayload[] = [],
  parentMessageId?: string,
): AgentInstruction => {
  return {
    payload: {
      parentMessageId: parentMessageId || `msg_${nanoid()}`,
      toolsCalling: toolsCalling.length
        ? toolsCalling
        : [
            {
              apiName: 'search',
              arguments: JSON.stringify({ query: 'test' }),
              id: `tool_call_${nanoid()}`,
              identifier: 'lobe-web-browsing',
              type: 'default',
            },
          ],
    },
    type: 'resolve_aborted_tools',
  } as AgentInstruction;
};

/**
 * Create a mock finish instruction
 */
export const createFinishInstruction = (
  reason: string = 'completed',
  reasonDetail?: string,
): AgentInstruction => {
  return {
    reason,
    reasonDetail,
    type: 'finish',
  } as AgentInstruction;
};

/**
 * Create a mock exec_task instruction (single task)
 */
export const createExecTaskInstruction = (
  task?: Partial<ExecTaskItem>,
  parentMessageId?: string,
): AgentInstructionExecTask => {
  const defaultTask: ExecTaskItem = {
    description: 'Test task',
    instruction: 'Execute test task',
    ...task,
  };

  return {
    payload: {
      parentMessageId: parentMessageId || `msg_${nanoid()}`,
      task: defaultTask,
    },
    type: 'exec_task',
  };
};

/**
 * Create a mock exec_tasks instruction (multiple tasks)
 */
export const createExecTasksInstruction = (
  tasks: ExecTaskItem[] = [],
  parentMessageId?: string,
): AgentInstructionExecTasks => {
  const defaultTasks: ExecTaskItem[] = tasks.length
    ? tasks
    : [
        {
          description: 'Test task',
          instruction: 'Execute test task',
        },
      ];

  return {
    payload: {
      parentMessageId: parentMessageId || `msg_${nanoid()}`,
      tasks: defaultTasks,
    },
    type: 'exec_tasks',
  };
};
