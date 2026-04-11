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

import { getLobehubSkillProviderById } from '@lobechat/const';
import { type ReactNode } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useToolStore } from '@/store/tool';
import { lobehubSkillStoreSelectors } from '@/store/tool/selectors';
import { LobehubSkillStatus } from '@/store/tool/slices/lobehubSkillStore/types';

import { type DetailContextValue } from './DetailContext';
import { DetailContext } from './DetailContext';

interface LobehubDetailProviderProps {
  children: ReactNode;
  identifier: string;
}

export const LobehubDetailProvider = ({ children, identifier }: LobehubDetailProviderProps) => {
  const { t } = useTranslation(['setting']);

  const config = useMemo(() => getLobehubSkillProviderById(identifier), [identifier]);

  const lobehubSkillServers = useToolStore(lobehubSkillStoreSelectors.getServers);

  const serverState = useMemo(
    () => lobehubSkillServers.find((s) => s.identifier === identifier),
    [identifier, lobehubSkillServers],
  );

  const isConnected = useMemo(
    () => serverState?.status === LobehubSkillStatus.CONNECTED,
    [serverState],
  );

  const useFetchProviderTools = useToolStore((s) => s.useFetchProviderTools);
  const { data: tools = [], isLoading: toolsLoading } = useFetchProviderTools(identifier);

  if (!config) return null;

  const { author, authorUrl, description, icon, readme, label } = config;

  const localizedDescription = t(`tools.lobehubSkill.providers.${identifier}.description`, {
    defaultValue: description,
  });
  const localizedReadme = t(`tools.lobehubSkill.providers.${identifier}.readme`, {
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
    tools,
    toolsLoading,
  };

  return <DetailContext value={value}>{children}</DetailContext>;
};
