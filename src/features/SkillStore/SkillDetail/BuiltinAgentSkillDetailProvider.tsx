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
import { type ReactNode, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useToolStore } from '@/store/tool';

import { DetailContext, type DetailContextValue } from './DetailContext';

interface BuiltinAgentSkillDetailProviderProps {
  children: ReactNode;
  identifier: string;
}

export const BuiltinAgentSkillDetailProvider = ({
  children,
  identifier,
}: BuiltinAgentSkillDetailProviderProps) => {
  const { t } = useTranslation(['setting']);

  const builtinSkills = useToolStore((s) => s.builtinSkills, isEqual);

  const skill = useMemo(
    () => builtinSkills.find((s) => s.identifier === identifier),
    [identifier, builtinSkills],
  );

  if (!skill) return null;

  const localizedTitle = t(`tools.builtins.${identifier}.title`, {
    defaultValue: skill.name,
  });
  const localizedDescription = t(`tools.builtins.${identifier}.description`, {
    defaultValue: skill.description,
  });
  const localizedReadme = t(`tools.builtins.${identifier}.readme`, {
    defaultValue: '',
  });

  const value: DetailContextValue = {
    author: 'LobeHub',
    authorUrl: 'https://lobehub.com',
    config: null as any,
    description: skill.description,
    icon: skill.avatar || '',
    identifier,
    isConnected: true,
    label: localizedTitle,
    localizedDescription,
    localizedReadme,
    readme: '',
    skillContent: skill.content,
    tools: [],
    toolsLoading: false,
  };

  return <DetailContext value={value}>{children}</DetailContext>;
};
