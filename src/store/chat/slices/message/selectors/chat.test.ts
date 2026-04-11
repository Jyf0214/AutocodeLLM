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

import { type UIChatMessage } from '@lobechat/types';
import { describe, expect, it } from 'vitest';

import { type ChatStore } from '@/store/chat';
import { initialState } from '@/store/chat/initialState';
import { messageMapKey } from '@/store/chat/utils/messageMapKey';
import { createServerConfigStore } from '@/store/serverConfig/store';
import { merge } from '@/utils/merge';

import { chatSelectors } from './chat';

vi.mock('i18next', () => ({
  t: vi.fn((key) => key),
}));

const initialStore = initialState as ChatStore;

const mockMessages = [
  {
    id: 'msg1',
    content: 'Hello World',
    role: 'user',
  },
  {
    id: 'msg2',
    content: 'Goodbye World',
    role: 'user',
  },
] as UIChatMessage[];

beforeAll(() => {
  createServerConfigStore();
});

describe('chatSelectors - Backward Compatibility Layer', () => {
  describe('getMessageById', () => {
    it('should work as backward compatibility alias for getDisplayMessageById', () => {
      const state = merge(initialStore, {
        messagesMap: {
          [messageMapKey({ agentId: 'abc' })]: mockMessages,
        },
        activeAgentId: 'abc',
      });
      const message = chatSelectors.getMessageById('msg1')(state);
      expect(message?.id).toBe('msg1');
      expect(message?.content).toBe('Hello World');
    });
  });

  describe('currentChatKey', () => {
    it('should work as backward compatibility alias for currentDisplayChatKey', () => {
      const state: Partial<ChatStore> = {
        activeAgentId: 'testId',
        activeTopicId: 'topicId',
      };
      const result = chatSelectors.currentChatKey(state as ChatStore);
      expect(result).toBe(messageMapKey({ agentId: 'testId', topicId: 'topicId' }));
    });
  });

  describe('activeBaseChats', () => {
    it('should work as backward compatibility alias for activeDisplayMessages', () => {
      const state = merge(initialStore, {
        messagesMap: {
          [messageMapKey({ agentId: 'abc' })]: mockMessages,
        },
        activeAgentId: 'abc',
      });
      const chats = chatSelectors.activeBaseChats(state);
      expect(chats).toHaveLength(2);
      expect(chats[0].id).toBe('msg1');
    });
  });

  describe('currentToolMessages', () => {
    it('should work as backward compatibility alias for dbToolMessages', () => {
      const messages = [
        { id: '1', role: 'user', content: 'Hello' },
        { id: '2', role: 'tool', content: 'Tool message' },
      ] as UIChatMessage[];
      const state: Partial<ChatStore> = {
        activeAgentId: 'test-id',
        dbMessagesMap: {
          [messageMapKey({ agentId: 'test-id' })]: messages,
        },
      };
      const result = chatSelectors.currentToolMessages(state as ChatStore);
      expect(result).toHaveLength(1);
      expect(result[0].role).toBe('tool');
    });
  });
});
