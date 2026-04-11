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

import { nanoid } from 'nanoid';
import { describe, expect, it } from 'vitest';

import { type SessionGroupItem } from '@/types/session';

import { sessionGroupsReducer } from './reducer';

describe('sessionGroupsReducer', () => {
  const initialState: SessionGroupItem[] = [
    {
      id: nanoid(),
      name: 'Group 1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: nanoid(),
      name: 'Group 2',
      createdAt: new Date(),
      updatedAt: new Date(),
      sort: 1,
    },
  ];

  it('should add a new session group item', () => {
    const newItem: SessionGroupItem = {
      id: nanoid(),
      name: 'New Group',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = sessionGroupsReducer(initialState, {
      type: 'addSessionGroupItem',
      item: newItem,
    });

    expect(result).toHaveLength(3);
    expect(result).toContainEqual(newItem);
  });

  it('should delete a session group item', () => {
    const itemToDelete = initialState[0].id;

    const result = sessionGroupsReducer(initialState, {
      type: 'deleteSessionGroupItem',
      id: itemToDelete,
    });

    expect(result).toHaveLength(1);
    expect(result).not.toContainEqual(expect.objectContaining({ id: itemToDelete }));
  });

  it('should update a session group item', () => {
    const itemToUpdate = initialState[0].id;
    const updatedItem = { name: 'Updated Group' };

    const result = sessionGroupsReducer(initialState, {
      type: 'updateSessionGroupItem',
      id: itemToUpdate,
      item: updatedItem,
    });

    expect(result).toHaveLength(2);
    expect(result).toContainEqual(expect.objectContaining({ id: itemToUpdate, ...updatedItem }));
  });

  it('should update session group order', () => {
    const sortMap = [
      { id: initialState[1].id, sort: 0 },
      { id: initialState[0].id, sort: 1 },
    ];

    const result = sessionGroupsReducer(initialState, { type: 'updateSessionGroupOrder', sortMap });

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(initialState[1].id);
    expect(result[1].id).toBe(initialState[0].id);
  });

  it('should return the initial state for unknown action', () => {
    const result = sessionGroupsReducer(initialState, { type: 'unknown' } as any);

    expect(result).toEqual(initialState);
  });
});
