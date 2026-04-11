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

import type { CommandType } from '@/features/ChatInput/InputEditor/ActionTag/types';

import type { SendMessageWithContextParams } from '../conversationLifecycle';
import { compactHandler, newTopicHandler } from './handlers';
import { parseCommandsFromEditorData } from './parseCommands';
import type { CommandHandlerContext, CommandRegistry, CommandSendOverrides } from './types';

export { injectReferTopicNode } from './editorDataHelpers';
export {
  hasNonActionContent,
  parseCommandsFromEditorData,
  parseMentionedAgentsFromEditorData,
  parseSelectedSkillsFromEditorData,
  parseSelectedToolsFromEditorData,
} from './parseCommands';
export type { CommandSendOverrides } from './types';

const COMMAND_REGISTRY: CommandRegistry = {
  compact: compactHandler,
  newTopic: newTopicHandler,
};

/**
 * Process all command tags found in editorData.
 * Returns merged overrides from all matched command handlers.
 */
export const processCommands = (params: SendMessageWithContextParams): CommandSendOverrides => {
  const commands = parseCommandsFromEditorData(params.editorData);
  const commandTags = commands.filter((c) => c.category === 'command');

  if (commandTags.length === 0) return {};

  const ctx: CommandHandlerContext = { params };
  let merged: CommandSendOverrides = {};

  for (const tag of commandTags) {
    const handler = COMMAND_REGISTRY[tag.type as CommandType];
    if (handler) {
      const overrides = handler(ctx);
      if (overrides) {
        merged = { ...merged, ...overrides };
      }
    }
  }

  return merged;
};
