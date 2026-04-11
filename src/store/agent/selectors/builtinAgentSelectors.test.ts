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

import { BUILTIN_AGENT_SLUGS } from '@lobechat/builtin-agents';
import { INBOX_SESSION_ID } from '@lobechat/const';
import { describe, expect, it } from 'vitest';

import { type AgentStoreState } from '@/store/agent/initialState';
import { initialAgentSliceState } from '@/store/agent/slices/agent/initialState';
import { initialBuiltinAgentSliceState } from '@/store/agent/slices/builtin';

import { builtinAgentSelectors } from './builtinAgentSelectors';

const createState = (overrides: Partial<AgentStoreState> = {}): AgentStoreState => ({
  ...initialAgentSliceState,
  ...initialBuiltinAgentSliceState,
  ...overrides,
});

describe('builtinAgentSelectors', () => {
  describe('getBuiltinAgentId', () => {
    it('should return agent id for a given slug', () => {
      const state = createState({
        builtinAgentIdMap: { 'page-agent': 'page-agent-123' },
      });

      expect(builtinAgentSelectors.getBuiltinAgentId('page-agent')(state)).toBe('page-agent-123');
    });

    it('should return undefined for non-existent slug', () => {
      const state = createState({
        builtinAgentIdMap: {},
      });

      expect(builtinAgentSelectors.getBuiltinAgentId('page-agent')(state)).toBeUndefined();
    });
  });

  describe('isBuiltinAgentInit', () => {
    it('should return true when builtin agent exists', () => {
      const state = createState({
        builtinAgentIdMap: { 'page-agent': 'page-agent-123' },
      });

      expect(builtinAgentSelectors.isBuiltinAgentInit('page-agent')(state)).toBe(true);
    });

    it('should return false when builtin agent does not exist', () => {
      const state = createState({
        builtinAgentIdMap: {},
      });

      expect(builtinAgentSelectors.isBuiltinAgentInit('page-agent')(state)).toBe(false);
    });
  });

  describe('pageAgentId', () => {
    it('should return page agent id', () => {
      const state = createState({
        builtinAgentIdMap: { [BUILTIN_AGENT_SLUGS.pageAgent]: 'page-agent-456' },
      });

      expect(builtinAgentSelectors.pageAgentId(state)).toBe('page-agent-456');
    });

    it('should return undefined when page agent not initialized', () => {
      const state = createState({
        builtinAgentIdMap: {},
      });

      expect(builtinAgentSelectors.pageAgentId(state)).toBeUndefined();
    });
  });

  describe('agentBuilderId', () => {
    it('should return agent builder id', () => {
      const state = createState({
        builtinAgentIdMap: { [BUILTIN_AGENT_SLUGS.agentBuilder]: 'builder-789' },
      });

      expect(builtinAgentSelectors.agentBuilderId(state)).toBe('builder-789');
    });

    it('should return undefined when agent builder not initialized', () => {
      const state = createState({
        builtinAgentIdMap: {},
      });

      expect(builtinAgentSelectors.agentBuilderId(state)).toBeUndefined();
    });
  });

  describe('inboxAgentId', () => {
    it('should return inbox agent id from builtinAgentIdMap', () => {
      const state = createState({
        builtinAgentIdMap: { [INBOX_SESSION_ID]: 'inbox-agent-123' },
      });

      expect(builtinAgentSelectors.inboxAgentId(state)).toBe('inbox-agent-123');
    });

    it('should return undefined when inbox agent is not initialized', () => {
      const state = createState({
        builtinAgentIdMap: {},
      });

      expect(builtinAgentSelectors.inboxAgentId(state)).toBeUndefined();
    });
  });

  describe('isInboxAgentConfigInit', () => {
    it('should return true when inbox agent is in builtinAgentIdMap', () => {
      const state = createState({
        builtinAgentIdMap: { [INBOX_SESSION_ID]: 'inbox-agent-id' },
      });

      expect(builtinAgentSelectors.isInboxAgentConfigInit(state)).toBe(true);
    });

    it('should return false when inbox agent is not initialized', () => {
      const state = createState({
        builtinAgentIdMap: {},
      });

      expect(builtinAgentSelectors.isInboxAgentConfigInit(state)).toBe(false);
    });
  });

  describe('isInboxAgent', () => {
    it('should return true when activeAgentId matches inbox agent in builtinAgentIdMap', () => {
      const state = createState({
        activeAgentId: 'inbox-agent',
        builtinAgentIdMap: { [INBOX_SESSION_ID]: 'inbox-agent' },
      });

      expect(builtinAgentSelectors.isInboxAgent(state)).toBe(true);
    });

    it('should return false when activeAgentId does not match inbox agent', () => {
      const state = createState({
        activeAgentId: 'other-agent',
        builtinAgentIdMap: { [INBOX_SESSION_ID]: 'inbox-agent' },
      });

      expect(builtinAgentSelectors.isInboxAgent(state)).toBe(false);
    });

    it('should return false when inbox agent is not initialized', () => {
      const state = createState({
        activeAgentId: 'some-agent',
        builtinAgentIdMap: {},
      });

      expect(builtinAgentSelectors.isInboxAgent(state)).toBe(false);
    });
  });
});
