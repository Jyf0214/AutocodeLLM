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

import { type SessionGroupItem } from '@/types/session';

export type AddSessionGroupAction = { item: SessionGroupItem; type: 'addSessionGroupItem' };
export type DeleteSessionGroupAction = { id: string; type: 'deleteSessionGroupItem' };
export type UpdateSessionGroupAction = {
  id: string;
  item: Partial<SessionGroupItem>;
  type: 'updateSessionGroupItem';
};
export type UpdateSessionGroupOrderAction = {
  sortMap: { id: string; sort?: number }[];
  type: 'updateSessionGroupOrder';
};

export type SessionGroupsDispatch =
  | AddSessionGroupAction
  | DeleteSessionGroupAction
  | UpdateSessionGroupAction
  | UpdateSessionGroupOrderAction;

export const sessionGroupsReducer = (
  state: SessionGroupItem[],
  payload: SessionGroupsDispatch,
): SessionGroupItem[] => {
  switch (payload.type) {
    case 'addSessionGroupItem': {
      return [...state, payload.item];
    }

    case 'deleteSessionGroupItem': {
      return state.filter((item) => item.id !== payload.id);
    }

    case 'updateSessionGroupItem': {
      return state.map((item) => {
        if (item.id === payload.id) {
          return { ...item, ...payload.item };
        }
        return item;
      });
    }

    case 'updateSessionGroupOrder': {
      return state
        .map((item) => {
          const sort = payload.sortMap.find((i) => i.id === item.id)?.sort;
          return { ...item, sort };
        })
        .sort((a, b) => (a.sort || 0) - (b.sort || 0));
    }

    default: {
      return state;
    }
  }
};
