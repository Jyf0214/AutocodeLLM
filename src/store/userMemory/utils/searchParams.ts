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

import { find, isString, trim } from 'es-toolkit/compat';

import { DEFAULT_SEARCH_USER_MEMORY_TOP_K } from '@/const/userMemory';
import { type RetrieveMemoryParams } from '@/types/userMemory';

interface MemorySearchSource {
  agent?: {
    description?: string | null;
    title?: string | null;
  } | null;
  latestUserMessage?: string | null;
  sendingMessage?: string | null;
  topic?: {
    historySummary?: string | null;
    title?: string | null;
  } | null;
}

const pickFirstNonEmpty = (values: Array<string | null | undefined>) => {
  const matched = find(values, (value) => isString(value) && trim(value).length > 0);

  if (!isString(matched)) return undefined;

  return trim(matched);
};

export const createMemorySearchParams = (
  source: MemorySearchSource,
): RetrieveMemoryParams | undefined => {
  const query = pickFirstNonEmpty([
    source.topic?.historySummary,
    source.agent?.description,
    source.latestUserMessage,
    source.sendingMessage,
  ]);

  if (!query) return undefined;

  return {
    queries: [query],
    topK: {
      ...DEFAULT_SEARCH_USER_MEMORY_TOP_K,
    },
  } as RetrieveMemoryParams;
};
