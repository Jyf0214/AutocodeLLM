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

import type { ChatToolPayloadWithResult, ToolIntervention, UIChatMessage } from '@lobechat/types';

export interface PendingIntervention {
  apiName: string;
  assistantGroupId?: string;
  identifier: string;
  intervention: ToolIntervention & { status: 'pending' };
  requestArgs: string;
  toolCallId: string;
  toolMessageId: string;
}

export const getPendingInterventions = (
  displayMessages: UIChatMessage[],
): PendingIntervention[] => {
  const pending: PendingIntervention[] = [];

  for (const msg of displayMessages) {
    // Standalone tool messages with pluginIntervention pending
    if (
      msg.role === 'tool' &&
      msg.pluginIntervention?.status === 'pending' &&
      msg.plugin &&
      !msg.id.startsWith('tmp_')
    ) {
      pending.push({
        apiName: msg.plugin.apiName,
        identifier: msg.plugin.identifier,
        intervention: msg.pluginIntervention as ToolIntervention & { status: 'pending' },
        requestArgs: msg.plugin.arguments || '',
        toolCallId: msg.tool_call_id || msg.id,
        toolMessageId: msg.id,
      });
    }

    // Messages with children blocks containing tools (assistantGroup, assistant, etc.)
    if (msg.children) {
      for (const block of msg.children) {
        if (!block.tools) continue;
        collectPendingTools(block.tools, pending, msg.id);
      }
    }
  }

  return pending;
};

const collectPendingTools = (
  tools: ChatToolPayloadWithResult[],
  pending: PendingIntervention[],
  assistantGroupId?: string,
) => {
  for (const tool of tools) {
    if (
      tool.intervention?.status === 'pending' &&
      tool.result_msg_id &&
      !tool.result_msg_id.startsWith('tmp_')
    ) {
      pending.push({
        apiName: tool.apiName,
        assistantGroupId,
        identifier: tool.identifier,
        intervention: tool.intervention as ToolIntervention & { status: 'pending' },
        requestArgs: tool.arguments || '',
        toolCallId: tool.id,
        toolMessageId: tool.result_msg_id,
      });
    }
  }
};
