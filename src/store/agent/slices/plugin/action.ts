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

import { type StoreSetter } from '@/store/types';

import { agentSelectors } from '../../selectors';
import { type AgentStore } from '../../store';

/**
 * Plugin Slice Actions
 * Handles plugin toggle operations
 */

type Setter = StoreSetter<AgentStore>;
export const createPluginSlice = (set: Setter, get: () => AgentStore, _api?: unknown) =>
  new PluginSliceActionImpl(set, get, _api);

export class PluginSliceActionImpl {
  readonly #get: () => AgentStore;

  constructor(set: Setter, get: () => AgentStore, _api?: unknown) {
    void _api;
    void set;
    this.#get = get;
  }

  removePlugin = async (id: string): Promise<void> => {
    await this.#get().togglePlugin(id, false);
  };

  togglePlugin = async (id: string, open?: boolean): Promise<void> => {
    const originConfig = agentSelectors.currentAgentConfig(this.#get());
    if (!originConfig) return;

    const config = produce(originConfig, (draft) => {
      draft.plugins = produce(draft.plugins || [], (plugins) => {
        const index = plugins.indexOf(id);
        const shouldOpen = open !== undefined ? open : index === -1;

        if (shouldOpen) {
          // If open is true or id doesn't exist in plugins, add it
          if (index === -1) {
            plugins.push(id);
          }
        } else {
          // If open is false or id exists in plugins, remove it
          if (index !== -1) {
            plugins.splice(index, 1);
          }
        }
      });
    });

    await this.#get().updateAgentConfig(config);
  };
}

export type PluginSliceAction = Pick<PluginSliceActionImpl, keyof PluginSliceActionImpl>;
