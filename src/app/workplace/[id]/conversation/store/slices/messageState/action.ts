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
import { type StateCreator } from 'zustand';

import { type State } from '../../initialState';

export interface MessageEditingAction {
  /**
   * Toggle message editing state
   */
  toggleMessageEditing: (id: string, editing: boolean) => void;
}

/**
 * Helper function to toggle an item in a boolean list
 */
const toggleBooleanList = (ids: string[], id: string, value: boolean) => {
  return produce(ids, (draft) => {
    if (value) {
      if (!draft.includes(id)) draft.push(id);
    } else {
      const index = draft.indexOf(id);
      if (index >= 0) draft.splice(index, 1);
    }
  });
};

export const messageEditingSlice: StateCreator<
  State,
  [['zustand/devtools', never]],
  [],
  MessageEditingAction
> = (set, get) => ({
  toggleMessageEditing: (id, editing) => {
    set(
      { messageEditingIds: toggleBooleanList(get().messageEditingIds, id, editing) },
      false,
      'toggleMessageEditing',
    );
  },
});
