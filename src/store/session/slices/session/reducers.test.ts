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

import { type LobeSessions } from '@/types/session';

import { type SessionDispatch } from './reducers';
import { sessionsReducer } from './reducers';

describe('sessionsReducer', () => {
  const mockSession = {
    id: nanoid(),
    config: {
      model: 'gpt-3.5-turbo',
    } as any,
    meta: {
      title: 'Test Agent',
      description: 'A test agent',
      avatar: '',
    },
  } as any;

  const initialState: LobeSessions = [];

  it('should add a new session', () => {
    const addAction: SessionDispatch = {
      session: mockSession,
      type: 'addSession',
    };

    const newState = sessionsReducer(initialState, addAction);

    expect(newState).toHaveLength(1);
    expect(newState[0]).toMatchObject({
      ...mockSession,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });

  it('should remove an existing session', () => {
    const state: LobeSessions = [mockSession];
    const removeAction: SessionDispatch = {
      id: mockSession.id,
      type: 'removeSession',
    };

    const newState = sessionsReducer(state, removeAction);

    expect(newState).toHaveLength(0);
  });

  it('should update an existing session', () => {
    const state: LobeSessions = [mockSession];
    const updateAction: SessionDispatch = {
      id: mockSession.id,
      type: 'updateSession',
      value: { group: 'abc' },
    };

    const newState = sessionsReducer(state, updateAction);

    expect(newState).toHaveLength(1);
    expect(newState[0]).toMatchObject({
      ...mockSession,
      group: 'abc',
      updatedAt: expect.any(Date),
    });
  });

  it('should return the same state for unknown action', () => {
    const state: LobeSessions = [mockSession];
    // @ts-ignore
    const unknownAction: SessionDispatch = { type: 'unknown' };

    const newState = sessionsReducer(state, unknownAction);

    expect(newState).toEqual(state);
  });
});
