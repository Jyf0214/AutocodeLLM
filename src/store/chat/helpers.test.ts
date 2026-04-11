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
  type LobeAgentChatConfig,
  type OpenAIChatMessage,
  type UIChatMessage,
} from '@lobechat/types';
import { describe, expect, it, vi } from 'vitest';

import * as tokenizerObj from '@/utils/tokenizer';

import { chatHelpers } from './helpers';

// Mock encodeAsync function
vi.mock('@/utils/tokenizer', () => ({
  encodeAsync: vi.fn((text) => Promise.resolve(text.length)),
}));

describe('chatHelpers', () => {
  describe('getMessagesTokenCount', () => {
    it('returns token count for a list of messages', async () => {
      const messages = [{ content: 'Hello' }, { content: 'World' }] as OpenAIChatMessage[];
      const tokenCount = await chatHelpers.getMessagesTokenCount(messages);
      expect(tokenCount).toBe('HelloWorld'.length);
    });

    it('returns 0 for an empty array', async () => {
      const tokenCount = await chatHelpers.getMessagesTokenCount([]);
      expect(tokenCount).toBe(0);
    });

    it('handles messages with empty content', async () => {
      const messages = [
        { content: 'Hello' },
        { content: '' },
        { content: 'World' },
      ] as OpenAIChatMessage[];
      const tokenCount = await chatHelpers.getMessagesTokenCount(messages);
      expect(tokenCount).toBe('HelloWorld'.length);
    });

    it('throws an error when encodeAsync fails', async () => {
      vi.spyOn(tokenizerObj, 'encodeAsync').mockRejectedValue(new Error('Test error'));
      await expect(
        chatHelpers.getMessagesTokenCount([{ content: 'Hello' }] as OpenAIChatMessage[]),
      ).rejects.toThrow('Test error');
    });
  });

  describe('getMessageById', () => {
    const messages = [
      { id: '1', content: 'Hello' },
      { id: '2', content: 'World' },
    ] as UIChatMessage[];

    it('finds a message by id', () => {
      const message = chatHelpers.getMessageById(messages, '1');
      expect(message).toEqual({ id: '1', content: 'Hello' });
    });

    it('returns undefined for an invalid id', () => {
      const message = chatHelpers.getMessageById(messages, '3');
      expect(message).toBeUndefined();
    });

    it('returns undefined for an empty array', () => {
      const message = chatHelpers.getMessageById([], '1');
      expect(message).toBeUndefined();
    });
  });

  describe('getSlicedMessages', () => {
    const messages = [
      { id: '1', content: 'First' },
      { id: '2', content: 'Second' },
      { id: '3', content: 'Third' },
    ] as UIChatMessage[];

    it('returns all messages if history is disabled', () => {
      const config = { enableHistoryCount: false, historyCount: undefined } as LobeAgentChatConfig;
      const slicedMessages = chatHelpers.getSlicedMessages(messages, config);
      expect(slicedMessages).toEqual(messages);
    });

    it('returns last N messages based on historyCount', () => {
      const config = { enableHistoryCount: true, historyCount: 2 } as LobeAgentChatConfig;
      const slicedMessages = chatHelpers.getSlicedMessages(messages, config);
      expect(slicedMessages).toEqual([
        { id: '2', content: 'Second' },
        { id: '3', content: 'Third' },
      ]);
    });

    it('returns empty array when historyCount is negative', () => {
      const config = { enableHistoryCount: true, historyCount: -1 } as LobeAgentChatConfig;
      const slicedMessages = chatHelpers.getSlicedMessages(messages, config);
      expect(slicedMessages).toEqual([]);
    });

    it('returns all messages if historyCount exceeds the array length', () => {
      const config = { enableHistoryCount: true, historyCount: 5 } as LobeAgentChatConfig;
      const slicedMessages = chatHelpers.getSlicedMessages(messages, config);
      expect(slicedMessages).toEqual(messages);
    });

    it('returns an empty array for an empty message array', () => {
      const config = { enableHistoryCount: true, historyCount: 2 } as LobeAgentChatConfig;
      const slicedMessages = chatHelpers.getSlicedMessages([], config);
      expect(slicedMessages).toEqual([]);
    });

    it('returns an empty array when historyCount is zero', () => {
      const config = { enableHistoryCount: true, historyCount: 0 } as LobeAgentChatConfig;
      const slicedMessages = chatHelpers.getSlicedMessages(messages, config);
      expect(slicedMessages).toEqual([]);
    });
  });
});
