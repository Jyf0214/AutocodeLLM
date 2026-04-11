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

import { act, renderHook } from '@testing-library/react';
import { type Mock } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { chatService } from '@/services/chat';
import { messageService } from '@/services/message';
import { messageMapKey } from '@/store/chat/utils/messageMapKey';

import { useChatStore } from '../../store';

// Mock messageService and chatService
vi.mock('@/services/message', () => ({
  messageService: {
    updateMessageTTS: vi.fn(),
    updateMessageTranslate: vi.fn(),
    updateMessage: vi.fn(),
  },
}));

vi.mock('@/services/chat', () => ({
  chatService: {
    fetchPresetTaskResult: vi.fn(),
  },
}));

vi.mock('@/store/user', () => ({
  useUserStore: {
    getState: vi.fn(() => ({})),
  },
}));

vi.mock('@/store/user/selectors', () => ({
  systemAgentSelectors: {
    translation: vi.fn(() => ({})),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ChatEnhanceAction', () => {
  describe('translateMessage', () => {
    it('should translate a message to the target language', async () => {
      const messageId = 'message-id';
      const targetLang = 'zh-CN';
      const messageContent = 'Hello World';
      const detectedLang = 'en-US';
      const translatedText = '你好世界';

      // Setup initial state
      act(() => {
        useChatStore.setState({
          activeAgentId: 'session',
          dbMessagesMap: {
            [messageMapKey({ agentId: 'session' })]: [
              {
                id: messageId,
                content: messageContent,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                role: 'assistant',
                sessionId: 'session',
              },
            ],
          },
        });
      });

      // First call for language detection
      (chatService.fetchPresetTaskResult as Mock).mockImplementationOnce(async ({ onFinish }) => {
        if (onFinish) await onFinish(detectedLang);
      });

      // Second call for translation
      (chatService.fetchPresetTaskResult as Mock).mockImplementationOnce(async ({ onFinish }) => {
        if (onFinish) await onFinish(translatedText);
      });

      const { result } = renderHook(() => useChatStore());

      await act(async () => {
        await result.current.translateMessage(messageId, targetLang);
      });

      expect(messageService.updateMessageTranslate).toHaveBeenCalled();
      expect(chatService.fetchPresetTaskResult).toHaveBeenCalledTimes(2);
    });
  });

  describe('clearTranslate', () => {
    it('should clear translation for a message and refresh messages', async () => {
      const { result } = renderHook(() => useChatStore());
      const messageId = 'message-id';

      await act(async () => {
        await result.current.clearTranslate(messageId);
      });

      expect(messageService.updateMessageTranslate).toHaveBeenCalledWith(messageId, false);
    });
  });
});
