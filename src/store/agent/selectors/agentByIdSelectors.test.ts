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

import { type AgentStoreState } from '@/store/agent/initialState';
import { initialAgentSliceState } from '@/store/agent/slices/agent/initialState';
import { initialBuiltinAgentSliceState } from '@/store/agent/slices/builtin/initialState';

import { agentByIdSelectors } from './agentByIdSelectors';

const createState = (overrides: Partial<AgentStoreState> = {}): AgentStoreState => ({
  ...initialAgentSliceState,
  ...initialBuiltinAgentSliceState,
  ...overrides,
});

describe('agentByIdSelectors', () => {
  describe('getAgentBuilderContextById', () => {
    it('should return builder context from existing agent config', () => {
      const state = createState({
        agentMap: {
          'agent-1': {
            chatConfig: { historyCount: 6 },
            model: 'gpt-4o',
            plugins: ['search'],
            provider: 'openai',
            systemRole: 'You are a helper',
          },
        },
      });

      const context = agentByIdSelectors.getAgentBuilderContextById('agent-1')(state);

      expect(context.config).toMatchObject({
        chatConfig: { historyCount: 6 },
        model: 'gpt-4o',
        plugins: ['search'],
        provider: 'openai',
        systemRole: 'You are a helper',
      });
    });

    it('should not throw when agent config is missing', () => {
      const state = createState({ agentMap: {} });

      expect(() =>
        agentByIdSelectors.getAgentBuilderContextById('missing-agent')(state),
      ).not.toThrow();

      const context = agentByIdSelectors.getAgentBuilderContextById('missing-agent')(state);

      expect(context.config).toMatchObject({
        chatConfig: undefined,
        model: undefined,
        plugins: undefined,
        provider: undefined,
        systemRole: undefined,
      });
    });
  });
});
