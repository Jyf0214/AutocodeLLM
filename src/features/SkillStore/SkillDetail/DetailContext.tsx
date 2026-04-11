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

import { type KlavisServerType, type LobehubSkillProviderType } from '@lobechat/const';
import { type Klavis } from 'klavis';
import type React from 'react';
import { createContext, use } from 'react';

export interface DetailContextValue {
  author: string;
  authorUrl?: string;
  config: KlavisServerType | LobehubSkillProviderType;
  description: string;
  icon: string | React.ComponentType<any>;
  identifier: string;
  isConnected: boolean;
  label: string;
  localizedDescription: string;
  localizedReadme: string;
  readme: string;
  serverName?: Klavis.McpServerName;
  skillContent?: string;
  tools: Array<{ description?: string; inputSchema?: any; name: string }>;
  toolsLoading: boolean;
}

export const DetailContext = createContext<DetailContextValue | null>(null);

export const useDetailContext = () => {
  const context = use(DetailContext);
  if (!context) {
    throw new Error('useDetailContext must be used within DetailProvider');
  }
  return context;
};
