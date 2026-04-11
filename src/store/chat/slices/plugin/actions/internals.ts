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

import { builtinTools } from '@lobechat/builtin-tools';
import { ToolArgumentsRepairer, ToolNameResolver } from '@lobechat/context-engine';
import { type ChatToolPayload, type MessageToolCall, type ToolManifest } from '@lobechat/types';

import { type ChatStore } from '@/store/chat/store';
import { useToolStore } from '@/store/tool';
import {
  klavisStoreSelectors,
  lobehubSkillStoreSelectors,
  pluginSelectors,
} from '@/store/tool/selectors';
import { type StoreSetter } from '@/store/types';

/**
 * Internal utility methods and runtime state management
 * These are building blocks used by other actions
 */

type Setter = StoreSetter<ChatStore>;
export const pluginInternals = (set: Setter, get: () => ChatStore, _api?: unknown) =>
  new PluginInternalsActionImpl(set, get, _api);

export class PluginInternalsActionImpl {
  constructor(set: Setter, get: () => ChatStore, _api?: unknown) {
    void _api;
    void set;
    void get;
  }

  internal_transformToolCalls = (toolCalls: MessageToolCall[]): ChatToolPayload[] => {
    const toolNameResolver = new ToolNameResolver();

    // Build manifests map from tool store
    const toolStoreState = useToolStore.getState();
    const manifests: Record<string, ToolManifest> = {};

    // Track source for each identifier
    const sourceMap: Record<string, 'builtin' | 'plugin' | 'mcp' | 'klavis' | 'lobehubSkill'> = {};

    // Get all installed plugins
    const installedPlugins = pluginSelectors.installedPlugins(toolStoreState);
    for (const plugin of installedPlugins) {
      if (plugin.manifest) {
        manifests[plugin.identifier] = plugin.manifest as ToolManifest;
        // Check if this plugin has MCP params
        sourceMap[plugin.identifier] = plugin.customParams?.mcp ? 'mcp' : 'plugin';
      }
    }

    // Get all builtin tools
    for (const tool of builtinTools) {
      if (tool.manifest) {
        manifests[tool.identifier] = tool.manifest as ToolManifest;
        sourceMap[tool.identifier] = 'builtin';
      }
    }

    // Get all Klavis tools
    const klavisTools = klavisStoreSelectors.klavisAsLobeTools(toolStoreState);
    for (const tool of klavisTools) {
      if (tool.manifest) {
        manifests[tool.identifier] = tool.manifest as ToolManifest;
        sourceMap[tool.identifier] = 'klavis';
      }
    }

    // Get all LobeHub Skill tools
    const lobehubSkillTools = lobehubSkillStoreSelectors.lobehubSkillAsLobeTools(toolStoreState);
    for (const tool of lobehubSkillTools) {
      if (tool.manifest) {
        manifests[tool.identifier] = tool.manifest as ToolManifest;
        sourceMap[tool.identifier] = 'lobehubSkill';
      }
    }

    // Resolve tool calls and add source field
    const resolved = toolNameResolver.resolve(toolCalls, manifests);

    return resolved.map((payload) => {
      // Parse and repair arguments if needed
      const manifest = manifests[payload.identifier];
      const repairer = new ToolArgumentsRepairer(manifest);
      const repairedArgs = repairer.parse(payload.apiName, payload.arguments);

      return {
        ...payload,
        arguments: JSON.stringify(repairedArgs),
        source: sourceMap[payload.identifier],
      };
    });
  };
}

export type PluginInternalsAction = Pick<
  PluginInternalsActionImpl,
  keyof PluginInternalsActionImpl
>;
