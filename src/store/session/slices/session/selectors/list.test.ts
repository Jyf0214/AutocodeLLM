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

import { DEFAULT_AGENT_LOBE_SESSION } from '@/const/session';
import { type SessionStore } from '@/store/session';
import { type LobeAgentSession } from '@/types/session';
import { LobeSessionType } from '@/types/session';

import { sessionSelectors } from './list';

describe('currentSession', () => {
  const s = {
    activeId: '1',
    sessions: [
      {
        id: '1',
        config: {
          model: 'gpt-3.5-turbo',
          params: {},
          systemRole: 'system-role',
        },
        type: LobeSessionType.Agent,
      } as LobeAgentSession,
      {
        id: '2',
        config: {
          model: 'gpt-3.5-turbo',
          params: {},
          systemRole: 'system-role',
        },
        type: LobeSessionType.Agent,
      } as LobeAgentSession,
    ],
  } as unknown as SessionStore;

  it('should return undefined when s.activeId is not defined', () => {
    expect(sessionSelectors.currentSession({ sessions: {} } as any)).toBeUndefined();
  });

  it('should return s.sessions[s.activeId] when s.activeId is not equal to INBOX_SESSION_ID', () => {
    expect(sessionSelectors.currentSession(s)).toEqual(s.sessions[0]);
  });
});

describe('currentSessionSafe', () => {
  const s = {
    activeId: '1',
    sessions: [
      {
        id: '1',
        config: {
          model: 'gpt-3.5-turbo',
          params: {},
          systemRole: 'system-role',
        },
        type: LobeSessionType.Agent,
      } as LobeAgentSession,
      {
        id: '2',
        config: {
          model: 'gpt-3.5-turbo',
          params: {},
          systemRole: 'system-role',
        },
        type: LobeSessionType.Agent,
      } as LobeAgentSession,
    ],
  } as unknown as SessionStore;

  it('should return initLobeSession when currentSession(s) returns undefined', () => {
    expect(sessionSelectors.currentSessionSafe({ sessions: {} } as any)).toEqual(
      DEFAULT_AGENT_LOBE_SESSION,
    );
  });

  it('should return the result of currentSession(s) when it returns a non-undefined value', () => {
    expect(sessionSelectors.currentSessionSafe(s)).toEqual(s.sessions[0]);
  });
});

describe('getSessionById', () => {
  const s = {
    activeId: '1',
    sessions: [
      {
        id: '1',
        config: {
          model: 'gpt-3.5-turbo',
          params: {},
          systemRole: 'system-role',
        },
        type: LobeSessionType.Agent,
      } as LobeAgentSession,
      {
        id: '2',
        config: {
          model: 'gpt-3.5-turbo',
          params: {},
          systemRole: 'system-role',
        },
        type: LobeSessionType.Agent,
      } as LobeAgentSession,
    ],
  } as unknown as SessionStore;

  it('should return the session with the specified id when id is not equal to INBOX_SESSION_ID', () => {
    expect(sessionSelectors.getSessionById('1')(s)).toEqual(s.sessions[0]);
  });

  it('should return initLobeSession when the session with the specified id does not exist', () => {
    expect(sessionSelectors.getSessionById('3')(s)).toEqual(DEFAULT_AGENT_LOBE_SESSION);
  });
});

describe('getSessionMetaById', () => {
  const s: SessionStore = {
    sessions: [
      { id: '1', meta: { title: 'Session 1' } },
      { id: '2', meta: { title: 'Session 2' } },
    ],
  } as unknown as SessionStore;

  it('should return the meta data of the session with the specified id', () => {
    expect(sessionSelectors.getSessionMetaById('1')(s)).toEqual({ title: 'Session 1' });
  });

  it('should return an empty object when the session with the specified id does not exist', () => {
    expect(sessionSelectors.getSessionMetaById('3')(s)).toEqual({});
  });
});
