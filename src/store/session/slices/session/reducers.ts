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

import { produce } from 'immer';

import { type LobeSession, type LobeSessions } from '@/types/session';

interface AddSession {
  session: LobeSession;
  type: 'addSession';
}

interface RemoveSession {
  id: string;
  type: 'removeSession';
}

interface UpdateSession {
  id: string;
  type: 'updateSession';
  value: Partial<LobeSession>;
}

export type SessionDispatch = AddSession | RemoveSession | UpdateSession;

export const sessionsReducer = (state: LobeSessions, payload: SessionDispatch): LobeSessions => {
  switch (payload.type) {
    case 'addSession': {
      return produce(state, (draft) => {
        const { session } = payload;
        if (!session) return;

        draft.unshift({ ...session, createdAt: new Date(), updatedAt: new Date() });
      });
    }

    case 'removeSession': {
      return produce(state, (draftState) => {
        const index = draftState.findIndex((item) => item.id === payload.id);
        if (index !== -1) {
          draftState.splice(index, 1);
        }
      });
    }

    case 'updateSession': {
      return produce(state, (draftState) => {
        const { value, id } = payload;
        const index = draftState.findIndex((item) => item.id === id);

        if (index !== -1) {
          // @ts-ignore
          draftState[index] = { ...draftState[index], ...value, updatedAt: new Date() };
        }
      });
    }

    default: {
      return produce(state, () => {});
    }
  }
};
