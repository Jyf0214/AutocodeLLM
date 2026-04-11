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

'use client';

import isEqual from 'fast-deep-equal';
import { type ReactNode } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useToolStore } from '@/store/tool';
import { builtinToolSelectors } from '@/store/tool/selectors';

import { type DetailContextValue } from './DetailContext';
import { DetailContext } from './DetailContext';

interface BuiltinDetailProviderProps {
  children: ReactNode;
  identifier: string;
}

export const BuiltinDetailProvider = ({ children, identifier }: BuiltinDetailProviderProps) => {
  const { t } = useTranslation(['setting']);

  // Use allMetaList to show details for all builtin tools (including not installed ones)
  const builtinTools = useToolStore(builtinToolSelectors.allMetaList, isEqual);

  const toolMeta = useMemo(
    () => builtinTools.find((tool) => tool.identifier === identifier),
    [identifier, builtinTools],
  );

  // Get the full builtin tool data to access API definitions
  const builtinToolsData = useToolStore((s) => s.builtinTools, isEqual);
  const toolData = useMemo(
    () => builtinToolsData.find((tool) => tool.identifier === identifier),
    [identifier, builtinToolsData],
  );

  if (!toolMeta || !toolData) return null;

  const { meta } = toolMeta;
  const { manifest } = toolData;

  // Convert API definitions to tools format
  const tools = (manifest.api || []).map((api) => ({
    description: api.description,
    inputSchema: api.parameters,
    name: api.name,
  }));

  const localizedTitle = t(`tools.builtins.${identifier}.title`, {
    defaultValue: meta?.title || identifier,
  });
  const localizedDescription = t(`tools.builtins.${identifier}.description`, {
    defaultValue: meta?.description || '',
  });
  const localizedReadme = t(`tools.builtins.${identifier}.readme`, {
    defaultValue: manifest.meta.readme || '',
  });

  const value: DetailContextValue = {
    author: 'LobeHub',
    authorUrl: 'https://lobehub.com',
    config: null as any, // Builtin tools don't have provider config
    description: meta?.description || '',
    icon: meta?.avatar || '',
    identifier,
    isConnected: true, // Builtin tools are always "connected"
    label: localizedTitle,
    localizedDescription,
    localizedReadme,
    readme: manifest.meta.readme || '',
    tools,
    toolsLoading: false,
  };

  return <DetailContext value={value}>{children}</DetailContext>;
};
