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

import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';
import { type StateCreator } from 'zustand/vanilla';

import { createDevtools } from '../middleware/createDevtools';
import { expose } from '../middleware/expose';
import { flattenActions } from '../utils/flattenActions';
import { type ResetableStore, ResetableStoreAction } from '../utils/resetableStore';
import { type MentionAction } from './action';
import { createMentionSlice } from './action';
import { type MentionState } from './initialState';
import { initialMentionState } from './initialState';

export type MentionStore = MentionState & MentionAction & ResetableStore;

class MentionStoreResetAction extends ResetableStoreAction<MentionStore> {
  protected readonly resetActionName = 'resetMentionStore';
}

const createStore: StateCreator<MentionStore, [['zustand/devtools', never]]> = (
  ...parameters: Parameters<StateCreator<MentionStore, [['zustand/devtools', never]]>>
) => ({
  ...initialMentionState,
  ...flattenActions<MentionAction & ResetableStore>([
    createMentionSlice(...parameters),
    new MentionStoreResetAction(...parameters),
  ]),
});

const devtools = createDevtools('mention');

export const useMentionStore = createWithEqualityFn<MentionStore>()(devtools(createStore), shallow);

expose('mention', useMentionStore);

export const getMentionStoreState = () => useMentionStore.getState();
