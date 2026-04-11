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

import { type Operation } from '../slices/operation/types';
import {
  createPendingCompressedGroup,
  getCompressionCandidateMessageIds,
  hasRunningCompressionOperation,
  isCompressionOperationType,
} from './compression';

describe('compression utils', () => {
  it('should treat contextCompression and generateSummary as compression operations', () => {
    expect(isCompressionOperationType('contextCompression')).toBe(true);
    expect(isCompressionOperationType('generateSummary')).toBe(true);
    expect(isCompressionOperationType('sendMessage')).toBe(false);
  });

  it('should exclude compressedGroup ids from compression candidates', () => {
    expect(
      getCompressionCandidateMessageIds([
        { id: 'user-1', role: 'user' } as any,
        { id: 'group-1', role: 'compressedGroup' } as any,
        { id: 'tool-1', role: 'tool' } as any,
      ]),
    ).toEqual(['user-1', 'tool-1']);
  });

  it('should detect running compression operations in the same conversation context', () => {
    const operations: Operation[] = [
      {
        abortController: new AbortController(),
        context: { agentId: 'agent-1', threadId: null, topicId: 'topic-1' },
        id: 'op-1',
        metadata: { startTime: Date.now() },
        status: 'running',
        type: 'contextCompression',
      },
      {
        abortController: new AbortController(),
        context: { agentId: 'agent-1', threadId: null, topicId: 'topic-2' },
        id: 'op-2',
        metadata: { startTime: Date.now() },
        status: 'running',
        type: 'generateSummary',
      },
    ];

    expect(
      hasRunningCompressionOperation(operations, {
        agentId: 'agent-1',
        groupId: undefined,
        threadId: null,
        topicId: 'topic-1',
      }),
    ).toBe(true);
    expect(
      hasRunningCompressionOperation(operations, {
        agentId: 'agent-1',
        groupId: undefined,
        threadId: null,
        topicId: 'topic-3',
      }),
    ).toBe(false);
  });

  it('should build a pending compressedGroup message', () => {
    const message = createPendingCompressedGroup({
      agentId: 'agent-1',
      groupId: 'group-1',
      id: 'temp-group-1',
      threadId: 'thread-1',
      topicId: 'topic-1',
    });

    expect(message.role).toBe('compressedGroup');
    expect(message.id).toBe('temp-group-1');
    expect(message.metadata).toEqual({ expanded: true });
    expect(message.compressedMessages).toEqual([]);
  });
});
