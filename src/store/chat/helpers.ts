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

import { type OpenAIChatMessage, type UIChatMessage } from '@lobechat/types';

import { encodeAsync } from '@/utils/tokenizer';

export const getMessagesTokenCount = async (messages: OpenAIChatMessage[]) =>
  encodeAsync(messages.map((m) => m.content).join(''));

export const getMessageById = (
  messages: UIChatMessage[],
  id: string,
): UIChatMessage | undefined => {
  // First try to find in top-level messages
  const directMatch = messages.find((m) => m.id === id);
  if (directMatch) return directMatch;

  // If not found, search in agentCouncil members
  for (const message of messages) {
    if (message.role === 'agentCouncil' && (message as any).members) {
      const member = (message as any).members.find((m: UIChatMessage) => m.id === id);
      if (member) return member;
    }
  }

  return undefined;
};

const getSlicedMessages = (
  messages: UIChatMessage[],
  options: {
    enableHistoryCount?: boolean;
    historyCount?: number;
    includeNewUserMessage?: boolean;
  },
): UIChatMessage[] => {
  // if historyCount is not enabled, return all messages
  if (!options.enableHistoryCount || options.historyCount === undefined) return messages;

  // if user send message, history will include this message so the total length should +1
  const messagesCount = !!options.includeNewUserMessage
    ? options.historyCount + 1
    : options.historyCount;

  // if historyCount is negative or set to 0, return empty array
  if (messagesCount <= 0) return [];

  // if historyCount is positive, return last N messages
  return messages.slice(-messagesCount);
};

export const chatHelpers = {
  getMessageById,
  getMessagesTokenCount,
  getSlicedMessages,
};
