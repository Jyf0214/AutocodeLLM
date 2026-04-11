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

import { getKlavisServerByServerIdentifier } from '@lobechat/const';
import { type Klavis } from 'klavis';
import { type ReactNode } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useToolStore } from '@/store/tool';
import { klavisStoreSelectors } from '@/store/tool/selectors';
import { KlavisServerStatus } from '@/store/tool/slices/klavisStore';

import { type DetailContextValue } from './DetailContext';
import { DetailContext } from './DetailContext';

interface KlavisDetailProviderProps {
  children: ReactNode;
  identifier: string;
  serverName: Klavis.McpServerName;
}

export const KlavisDetailProvider = ({
  children,
  identifier,
  serverName,
}: KlavisDetailProviderProps) => {
  const { t } = useTranslation(['setting']);

  const config = useMemo(() => getKlavisServerByServerIdentifier(identifier), [identifier]);

  const klavisServers = useToolStore(klavisStoreSelectors.getServers);

  const serverState = useMemo(
    () => klavisServers.find((s) => s.identifier === identifier),
    [identifier, klavisServers],
  );

  const isConnected = useMemo(
    () => serverState?.status === KlavisServerStatus.CONNECTED,
    [serverState],
  );

  const useFetchServerTools = useToolStore((s) => s.useFetchServerTools);
  const { data: tools = [], isLoading: toolsLoading } = useFetchServerTools(serverName);

  if (!config) return null;

  const { author, authorUrl, description, icon, readme, label } = config;

  const localizedDescription = t(`tools.klavis.servers.${identifier}.description`, {
    defaultValue: description,
  });
  const localizedReadme = t(`tools.klavis.servers.${identifier}.readme`, {
    defaultValue: readme,
  });

  const value: DetailContextValue = {
    author,
    authorUrl,
    config,
    description,
    icon,
    identifier,
    isConnected,
    label,
    localizedDescription,
    localizedReadme,
    readme,
    serverName,
    tools,
    toolsLoading,
  };

  return <DetailContext value={value}>{children}</DetailContext>;
};
