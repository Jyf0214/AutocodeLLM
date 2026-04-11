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
import { type AIProviderStoreState } from './initialState';
import { initialState } from './initialState';
import { type AiModelAction } from './slices/aiModel';
import { createAiModelSlice } from './slices/aiModel';
import { type AiProviderAction } from './slices/aiProvider';
import { createAiProviderSlice } from './slices/aiProvider';

//  ===============  Aggregate createStoreFn ============ //

export interface AiInfraStore extends AIProviderStoreState, AiProviderAction, AiModelAction {
  /* empty */
}

type AiInfraStoreAction = AiProviderAction & AiModelAction;

const createStore: StateCreator<AiInfraStore, [['zustand/devtools', never]]> = (
  ...parameters: Parameters<StateCreator<AiInfraStore, [['zustand/devtools', never]]>>
) => ({
  ...initialState,
  ...flattenActions<AiInfraStoreAction>([
    createAiModelSlice(...parameters),
    createAiProviderSlice(...parameters),
  ]),
});

//  ===============  Implement useStore ============ //
const devtools = createDevtools('aiInfra');

export const useAiInfraStore = createWithEqualityFn<AiInfraStore>()(devtools(createStore), shallow);

expose('aiInfra', useAiInfraStore);

export const getAiInfraStoreState = () => useAiInfraStore.getState();
