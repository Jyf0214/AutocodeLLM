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

import { LOADING_FLAT } from '@/const/message';

import { generateMarkdown } from './template';

describe('generateMarkdown', () => {
  // 创建测试用的消息数据
  const mockMessages = [
    {
      id: '1',
      content: 'Hello',
      role: 'user',
      createdAt: Date.now(),
    },
    {
      id: '2',
      content: 'Hi there',
      role: 'assistant',
      createdAt: Date.now(),
    },
    {
      id: '3',
      content: LOADING_FLAT,
      role: 'assistant',
      createdAt: Date.now(),
    },
    {
      id: '4',
      content: '{"result": "tool data"}',
      role: 'tool',
      createdAt: Date.now(),
      tool_call_id: 'tool1',
    },
    {
      id: '5',
      content: 'Message with tools',
      role: 'assistant',
      createdAt: Date.now(),
      tools: [{ name: 'calculator', result: '42' }],
    },
  ] as UIChatMessage[];

  const defaultParams = {
    messages: mockMessages,
    title: 'Chat Title',
    includeTool: false,
    includeUser: true,
    withSystemRole: false,
    withRole: false,
    systemRole: '',
  };

  it('should filter out loading messages', () => {
    const result = generateMarkdown(defaultParams);

    expect(result).not.toContain(LOADING_FLAT);
  });

  it('should handle messages with special characters', () => {
    const messagesWithSpecialChars = [
      {
        id: '1',
        content: '**Bold** *Italic* `Code`',
        role: 'user',
        createdAt: Date.now(),
      },
    ] as UIChatMessage[];

    const result = generateMarkdown({
      ...defaultParams,
      messages: messagesWithSpecialChars,
    });

    expect(result).toContain('**Bold** *Italic* `Code`');
  });

  it('should normalize think tags before exporting markdown', () => {
    const messagesWithThinkTags = [
      {
        id: '1',
        content: 'Intro<think>Reasoning</think>Outro',
        role: 'assistant',
        createdAt: Date.now(),
      },
    ] as UIChatMessage[];

    const result = generateMarkdown({
      ...defaultParams,
      messages: messagesWithThinkTags,
    });

    expect(result).toContain('Intro\n\n<think>\n\nReasoning\n\n</think>\n\nOutro');
  });
});
