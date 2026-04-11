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

import { processCommands } from './index';

const baseParams = {
  message: 'hello',
  context: {
    agentId: 'agent-1',
    topicId: 'topic-1',
  },
} as any;

describe('processCommands', () => {
  it('should return empty overrides when no editorData', () => {
    expect(processCommands(baseParams)).toEqual({});
  });

  it('should return empty overrides when no command tags', () => {
    const params = {
      ...baseParams,
      editorData: {
        root: {
          children: [
            {
              children: [
                {
                  actionCategory: 'skill',
                  actionLabel: 'Translate',
                  actionType: 'translate',
                  type: 'action-tag',
                },
              ],
              type: 'paragraph',
            },
          ],
          type: 'root',
        },
      },
    };
    expect(processCommands(params)).toEqual({});
  });

  it('should return forceNewTopic for newTopic command', () => {
    const params = {
      ...baseParams,
      editorData: {
        root: {
          children: [
            {
              children: [
                {
                  actionCategory: 'command',
                  actionLabel: 'Send in new topic',
                  actionType: 'newTopic',
                  type: 'action-tag',
                },
              ],
              type: 'paragraph',
            },
          ],
          type: 'root',
        },
      },
    };

    const result = processCommands(params);
    expect(result.forceNewTopic).toBe(true);
  });

  it('should return triggerCompression for compact command', () => {
    const params = {
      ...baseParams,
      editorData: {
        root: {
          children: [
            {
              children: [
                {
                  actionCategory: 'command',
                  actionLabel: 'Compact context',
                  actionType: 'compact',
                  type: 'action-tag',
                },
              ],
              type: 'paragraph',
            },
          ],
          type: 'root',
        },
      },
    };

    const result = processCommands(params);
    expect(result.triggerCompression).toBe(true);
  });

  it('should merge overrides from multiple commands', () => {
    const params = {
      ...baseParams,
      editorData: {
        root: {
          children: [
            {
              children: [
                {
                  actionCategory: 'command',
                  actionLabel: 'Send in new topic',
                  actionType: 'newTopic',
                  type: 'action-tag',
                },
                {
                  actionCategory: 'command',
                  actionLabel: 'Compact context',
                  actionType: 'compact',
                  type: 'action-tag',
                },
              ],
              type: 'paragraph',
            },
          ],
          type: 'root',
        },
      },
    };

    const result = processCommands(params);
    expect(result.forceNewTopic).toBe(true);
    expect(result.triggerCompression).toBe(true);
  });
});
