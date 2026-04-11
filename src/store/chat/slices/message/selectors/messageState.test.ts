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

import { describe, expect, it } from 'vitest';

import { type ChatStore } from '@/store/chat';

import { messageStateSelectors } from './messageState';

describe('messageStateSelectors', () => {
  describe('isToolCallStreaming', () => {
    it('should return true when tool call is streaming for given message and index', () => {
      const state: Partial<ChatStore> = {
        toolCallingStreamIds: {
          'msg-1': [true, false, true],
        },
      };
      expect(messageStateSelectors.isToolCallStreaming('msg-1', 0)(state as ChatStore)).toBe(true);
      expect(messageStateSelectors.isToolCallStreaming('msg-1', 2)(state as ChatStore)).toBe(true);
    });

    it('should return false when tool call is not streaming for given message and index', () => {
      const state: Partial<ChatStore> = {
        toolCallingStreamIds: {
          'msg-1': [true, false, true],
        },
      };
      expect(messageStateSelectors.isToolCallStreaming('msg-1', 1)(state as ChatStore)).toBe(false);
      expect(messageStateSelectors.isToolCallStreaming('msg-2', 0)(state as ChatStore)).toBe(false);
    });

    it('should return false when no streaming data exists for the message', () => {
      const state: Partial<ChatStore> = {
        toolCallingStreamIds: {},
      };
      expect(messageStateSelectors.isToolCallStreaming('msg-1', 0)(state as ChatStore)).toBe(false);
    });
  });
});
