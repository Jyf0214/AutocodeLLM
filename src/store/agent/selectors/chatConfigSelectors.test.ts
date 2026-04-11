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

import { DEFAULT_AGENT_CHAT_CONFIG, DEFAULT_AGENT_SEARCH_FC_MODEL } from '@lobechat/const';
import { describe, expect, it, vi } from 'vitest';

import { type AgentStoreState } from '@/store/agent/initialState';
import { initialAgentSliceState } from '@/store/agent/slices/agent/initialState';
import { initialBuiltinAgentSliceState } from '@/store/agent/slices/builtin/initialState';

import { agentChatConfigSelectors } from './chatConfigSelectors';

// Mock model runtime functions
vi.mock('@lobechat/model-runtime', () => ({
  isContextCachingModel: vi.fn((model) => model === 'claude-3-5-sonnet'),
  isThinkingWithToolClaudeModel: vi.fn((model) => model === 'claude-3-7-sonnet'),
}));

const createState = (overrides: Partial<AgentStoreState> = {}): AgentStoreState => ({
  ...initialAgentSliceState,
  ...initialBuiltinAgentSliceState,
  ...overrides,
});

describe('agentChatConfigSelectors', () => {
  describe('currentChatConfig', () => {
    it('should return chatConfig from current agent merged with defaults', () => {
      const state = createState({
        activeAgentId: 'agent-1',
        agentMap: {
          'agent-1': {
            chatConfig: { historyCount: 10 },
          },
        },
      });

      expect(agentChatConfigSelectors.currentChatConfig(state)).toMatchObject({ historyCount: 10 });
    });

    it('should return empty chatConfig when no chatConfig specified', () => {
      const state = createState({
        activeAgentId: 'agent-1',
        agentMap: { 'agent-1': {} },
      });

      // Returns empty object when no chatConfig exists
      // Individual selectors apply defaults via ?? operator
      expect(agentChatConfigSelectors.currentChatConfig(state)).toEqual({});
    });
  });

  describe('agentSearchMode', () => {
    it('should return searchMode from config', () => {
      const state = createState({
        activeAgentId: 'agent-1',
        agentMap: {
          'agent-1': {
            chatConfig: { searchMode: 'auto' },
          } as any,
        },
      });

      expect(agentChatConfigSelectors.agentSearchMode(state)).toBe('auto');
    });

    it('should return "auto" as default', () => {
      const state = createState({
        activeAgentId: 'agent-1',
        agentMap: { 'agent-1': {} },
      });

      expect(agentChatConfigSelectors.agentSearchMode(state)).toBe('auto');
    });
  });

  describe('isAgentEnableSearch', () => {
    it('should return true when searchMode is not "off"', () => {
      const state = createState({
        activeAgentId: 'agent-1',
        agentMap: {
          'agent-1': {
            chatConfig: { searchMode: 'auto' },
          } as any,
        },
      });

      expect(agentChatConfigSelectors.isAgentEnableSearch(state)).toBe(true);
    });

    it('should return false when searchMode is "off"', () => {
      const state = createState({
        activeAgentId: 'agent-1',
        agentMap: {
          'agent-1': {
            chatConfig: { searchMode: 'off' },
          } as any,
        },
      });

      expect(agentChatConfigSelectors.isAgentEnableSearch(state)).toBe(false);
    });
  });

  describe('useModelBuiltinSearch', () => {
    it('should return useModelBuiltinSearch value', () => {
      const state = createState({
        activeAgentId: 'agent-1',
        agentMap: {
          'agent-1': {
            chatConfig: { useModelBuiltinSearch: true },
          },
        },
      });

      expect(agentChatConfigSelectors.useModelBuiltinSearch(state)).toBe(true);
    });
  });

  describe('searchFCModel', () => {
    it('should return searchFCModel from config when explicitly set', () => {
      const state = createState({
        activeAgentId: 'agent-1',
        agentMap: {
          'agent-1': {
            chatConfig: { searchFCModel: { model: 'custom-model', provider: 'openai' } },
          } as any,
        },
      });

      expect(agentChatConfigSelectors.searchFCModel(state)).toMatchObject({
        model: 'custom-model',
        provider: 'openai',
      });
    });

    it('should return default when not specified', () => {
      const state = createState({
        activeAgentId: 'agent-1',
        agentMap: { 'agent-1': {} },
      });

      expect(agentChatConfigSelectors.searchFCModel(state)).toStrictEqual(
        DEFAULT_AGENT_SEARCH_FC_MODEL,
      );
    });
  });

  describe('enableHistoryCount', () => {
    it('should return enableHistoryCount value even when context caching is enabled', () => {
      const state = createState({
        activeAgentId: 'agent-1',
        agentMap: {
          'agent-1': {
            chatConfig: { disableContextCaching: false, enableHistoryCount: true },
            model: 'claude-3-5-sonnet',
          },
        },
      });

      expect(agentChatConfigSelectors.enableHistoryCount(state)).toBe(true);
    });

    it('should return enableHistoryCount value even when search is enabled', () => {
      const state = createState({
        activeAgentId: 'agent-1',
        agentMap: {
          'agent-1': {
            chatConfig: {
              disableContextCaching: true,
              enableHistoryCount: true,
              searchMode: 'auto',
            },
            model: 'claude-3-7-sonnet',
          } as any,
        },
      });

      expect(agentChatConfigSelectors.enableHistoryCount(state)).toBe(true);
    });

    it('should return enableHistoryCount value directly from config', () => {
      const state = createState({
        activeAgentId: 'agent-1',
        agentMap: {
          'agent-1': {
            chatConfig: {
              disableContextCaching: true,
              enableHistoryCount: true,
              searchMode: 'off',
            },
            model: 'gpt-4',
          },
        },
      });

      expect(agentChatConfigSelectors.enableHistoryCount(state)).toBe(true);
    });
  });

  describe('historyCount', () => {
    it('should return historyCount from config', () => {
      const state = createState({
        activeAgentId: 'agent-1',
        agentMap: {
          'agent-1': {
            chatConfig: { historyCount: 5 },
          },
        },
      });

      expect(agentChatConfigSelectors.historyCount(state)).toBe(5);
    });

    it('should return 0 when historyCount is 0', () => {
      const state = createState({
        activeAgentId: 'agent-1',
        agentMap: {
          'agent-1': {
            chatConfig: { historyCount: 0 },
          },
        },
      });

      expect(agentChatConfigSelectors.historyCount(state)).toBe(0);
    });

    it('should return default when not specified', () => {
      const state = createState({
        activeAgentId: 'agent-1',
        agentMap: { 'agent-1': {} },
      });

      expect(agentChatConfigSelectors.historyCount(state)).toBe(
        DEFAULT_AGENT_CHAT_CONFIG.historyCount,
      );
    });
  });

  describe('enableHistoryDivider', () => {
    it('should return true when conditions are met', () => {
      const state = createState({
        activeAgentId: 'agent-1',
        agentMap: {
          'agent-1': {
            chatConfig: {
              disableContextCaching: true,
              enableHistoryCount: true,
              historyCount: 3,
            },
            model: 'gpt-4',
          },
        },
      });

      // historyLength = 5, currentIndex = 2 => historyLength - currentIndex = 3 = historyCount
      expect(agentChatConfigSelectors.enableHistoryDivider(5, 2)(state)).toBe(true);
    });

    it('should return false when enableHistoryCount is false', () => {
      const state = createState({
        activeAgentId: 'agent-1',
        agentMap: {
          'agent-1': {
            chatConfig: {
              enableHistoryCount: false,
              historyCount: 3,
            },
          },
        },
      });

      expect(agentChatConfigSelectors.enableHistoryDivider(5, 2)(state)).toBe(false);
    });

    it('should return false when historyLength <= historyCount', () => {
      const state = createState({
        activeAgentId: 'agent-1',
        agentMap: {
          'agent-1': {
            chatConfig: {
              disableContextCaching: true,
              enableHistoryCount: true,
              historyCount: 10,
            },
            model: 'gpt-4',
          },
        },
      });

      // historyLength = 5 <= historyCount = 10
      expect(agentChatConfigSelectors.enableHistoryDivider(5, 2)(state)).toBe(false);
    });
  });
});
