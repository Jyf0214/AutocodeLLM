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

import { selectTodosFromMessages } from './dbMessage';

describe('selectTodosFromMessages', () => {
  const createGTDToolMessage = (todos: {
    items: Array<{ text: string; status: 'todo' | 'processing' | 'completed' }>;
    updatedAt: string;
  }): UIChatMessage =>
    ({
      id: 'tool-msg-1',
      role: 'tool',
      content: 'Todos updated',
      plugin: {
        identifier: 'lobe-gtd',
        apiName: 'createTodos',
        arguments: '{}',
      },
      pluginState: {
        todos,
      },
    }) as unknown as UIChatMessage;

  it('should extract todos from the latest GTD tool message', () => {
    const messages: UIChatMessage[] = [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Create a todo list',
      } as UIChatMessage,
      createGTDToolMessage({
        items: [{ text: 'Buy milk', status: 'todo' }],
        updatedAt: '2024-06-01T00:00:00.000Z',
      }),
    ];

    const result = selectTodosFromMessages(messages);

    expect(result).toBeDefined();
    expect(result?.items).toHaveLength(1);
    expect(result?.items[0].text).toBe('Buy milk');
    expect(result?.items[0].status).toBe('todo');
  });

  it('should return the most recent todos when multiple GTD messages exist', () => {
    const messages: UIChatMessage[] = [
      createGTDToolMessage({
        items: [{ text: 'Old task', status: 'todo' }],
        updatedAt: '2024-01-01T00:00:00.000Z',
      }),
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'Task added',
      } as UIChatMessage,
      createGTDToolMessage({
        items: [
          { text: 'Old task', status: 'completed' },
          { text: 'New task', status: 'todo' },
        ],
        updatedAt: '2024-06-01T00:00:00.000Z',
      }),
    ];

    const result = selectTodosFromMessages(messages);

    expect(result).toBeDefined();
    expect(result?.items).toHaveLength(2);
    // Should be from the latest message
    expect(result?.items[0].text).toBe('Old task');
    expect(result?.items[0].status).toBe('completed');
    expect(result?.items[1].text).toBe('New task');
  });

  it('should return undefined when no GTD messages exist', () => {
    const messages: UIChatMessage[] = [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
      } as UIChatMessage,
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hi there!',
      } as UIChatMessage,
    ];

    const result = selectTodosFromMessages(messages);

    expect(result).toBeUndefined();
  });

  it('should return undefined when messages array is empty', () => {
    const result = selectTodosFromMessages([]);

    expect(result).toBeUndefined();
  });

  it('should ignore non-GTD tool messages', () => {
    const messages: UIChatMessage[] = [
      {
        id: 'msg-1',
        role: 'tool',
        content: 'Search results',
        plugin: {
          identifier: 'lobe-web-browsing',
          apiName: 'search',
          arguments: '{}',
        },
        pluginState: {
          results: ['result 1'],
        },
      } as unknown as UIChatMessage,
    ];

    const result = selectTodosFromMessages(messages);

    expect(result).toBeUndefined();
  });

  it('should handle GTD message without pluginState.todos', () => {
    const messages: UIChatMessage[] = [
      {
        id: 'msg-1',
        role: 'tool',
        content: 'Something',
        plugin: {
          identifier: 'lobe-gtd',
          apiName: 'someOtherApi',
          arguments: '{}',
        },
        pluginState: {
          otherState: 'value',
        },
      } as unknown as UIChatMessage,
    ];

    const result = selectTodosFromMessages(messages);

    expect(result).toBeUndefined();
  });

  it('should provide default updatedAt when missing', () => {
    const messages: UIChatMessage[] = [
      {
        id: 'msg-1',
        role: 'tool',
        content: 'Todos',
        plugin: {
          identifier: 'lobe-gtd',
          apiName: 'createTodos',
          arguments: '{}',
        },
        pluginState: {
          todos: {
            items: [{ text: 'Task', status: 'todo' }],
            // No updatedAt
          },
        },
      } as unknown as UIChatMessage,
    ];

    const result = selectTodosFromMessages(messages);

    expect(result).toBeDefined();
    expect(result?.updatedAt).toBeDefined();
    // Should be a valid ISO date string
    expect(new Date(result!.updatedAt).toISOString()).toBe(result!.updatedAt);
  });

  it('should handle legacy array format for todos', () => {
    const messages: UIChatMessage[] = [
      {
        id: 'msg-1',
        role: 'tool',
        content: 'Todos',
        plugin: {
          identifier: 'lobe-gtd',
          apiName: 'createTodos',
          arguments: '{}',
        },
        pluginState: {
          // Legacy format: direct array
          todos: [
            { text: 'Task 1', status: 'todo' },
            { text: 'Task 2', status: 'completed' },
          ],
        },
      } as unknown as UIChatMessage,
    ];

    const result = selectTodosFromMessages(messages);

    expect(result).toBeDefined();
    expect(result?.items).toHaveLength(2);
    expect(result?.items[0].text).toBe('Task 1');
    expect(result?.items[1].status).toBe('completed');
  });
});
