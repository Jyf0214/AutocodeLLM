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

import { type AgentGroupDetail } from '@lobechat/types';
import { describe, expect, it } from 'vitest';

import { type ChatGroupStore } from '../store';
import { agentGroupByIdSelectors } from './byId';

// Helper to create mock AgentGroupDetail with required fields
const createMockGroup = (overrides: Partial<AgentGroupDetail>): AgentGroupDetail => ({
  agents: [],
  createdAt: new Date(),
  id: 'group-1',
  supervisorAgentId: 'supervisor-1',
  title: 'Test Group',
  updatedAt: new Date(),
  userId: 'user-1',
  ...overrides,
});

describe('agentGroupByIdSelectors', () => {
  describe('groupBySupervisorAgentId', () => {
    it('should find group by supervisor agent ID', () => {
      const mockGroup = createMockGroup({
        id: 'group-1',
        supervisorAgentId: 'supervisor-agent-1',
        title: 'Test Group',
        agents: [
          { id: 'supervisor-agent-1', title: 'Supervisor', isSupervisor: true },
          { id: 'agent-1', title: 'Agent 1', isSupervisor: false },
        ] as AgentGroupDetail['agents'],
      });

      const state: Partial<ChatGroupStore> = {
        groupMap: {
          'group-1': mockGroup,
        },
      };

      const result = agentGroupByIdSelectors.groupBySupervisorAgentId('supervisor-agent-1')(
        state as ChatGroupStore,
      );

      expect(result).toEqual(mockGroup);
    });

    it('should return undefined when supervisor agent ID not found', () => {
      const mockGroup = createMockGroup({
        id: 'group-1',
        supervisorAgentId: 'supervisor-agent-1',
        title: 'Test Group',
      });

      const state: Partial<ChatGroupStore> = {
        groupMap: {
          'group-1': mockGroup,
        },
      };

      const result = agentGroupByIdSelectors.groupBySupervisorAgentId('non-existent-supervisor')(
        state as ChatGroupStore,
      );

      expect(result).toBeUndefined();
    });

    it('should return undefined when groupMap is empty', () => {
      const state: Partial<ChatGroupStore> = {
        groupMap: {},
      };

      const result = agentGroupByIdSelectors.groupBySupervisorAgentId('any-supervisor')(
        state as ChatGroupStore,
      );

      expect(result).toBeUndefined();
    });

    it('should find correct group when multiple groups exist', () => {
      const mockGroup1 = createMockGroup({
        id: 'group-1',
        supervisorAgentId: 'supervisor-1',
        title: 'Group 1',
      });

      const mockGroup2 = createMockGroup({
        id: 'group-2',
        supervisorAgentId: 'supervisor-2',
        title: 'Group 2',
      });

      const state: Partial<ChatGroupStore> = {
        groupMap: {
          'group-1': mockGroup1,
          'group-2': mockGroup2,
        },
      };

      const result = agentGroupByIdSelectors.groupBySupervisorAgentId('supervisor-2')(
        state as ChatGroupStore,
      );

      expect(result).toEqual(mockGroup2);
    });
  });
});
