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
import { type AgentStoreState } from './initialState';
import { initialState } from './initialState';
import { type AgentSliceAction } from './slices/agent';
import { createAgentSlice } from './slices/agent';
import { type BotSliceAction } from './slices/bot';
import { createBotSlice } from './slices/bot';
import { type BuiltinAgentSliceAction } from './slices/builtin';
import { createBuiltinAgentSlice } from './slices/builtin';
import { type CronSliceAction } from './slices/cron';
import { createCronSlice } from './slices/cron';
import { type KnowledgeSliceAction } from './slices/knowledge';
import { createKnowledgeSlice } from './slices/knowledge';
import { type PluginSliceAction } from './slices/plugin';
import { createPluginSlice } from './slices/plugin';

//  ===============  aggregate createStoreFn ============ //

export interface AgentStore
  extends
    AgentSliceAction,
    BotSliceAction,
    BuiltinAgentSliceAction,
    CronSliceAction,
    KnowledgeSliceAction,
    PluginSliceAction,
    AgentStoreState {}

type AgentStoreAction = AgentSliceAction &
  BotSliceAction &
  BuiltinAgentSliceAction &
  CronSliceAction &
  KnowledgeSliceAction &
  PluginSliceAction;

const createStore: StateCreator<AgentStore, [['zustand/devtools', never]]> = (
  ...parameters: Parameters<StateCreator<AgentStore, [['zustand/devtools', never]]>>
) => ({
  ...initialState,
  ...flattenActions<AgentStoreAction>([
    createAgentSlice(...parameters),
    createBotSlice(...parameters),
    createBuiltinAgentSlice(...parameters),
    createCronSlice(...parameters),
    createKnowledgeSlice(...parameters),
    createPluginSlice(...parameters),
  ]),
});

//  ===============  implement useStore ============ //

const devtools = createDevtools('agent');

export const useAgentStore = createWithEqualityFn<AgentStore>()(devtools(createStore), shallow);

expose('agent', useAgentStore);

export const getAgentStoreState = () => useAgentStore.getState();
