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

import { describe, expect, it } from 'vitest';

import type { ResourceItem } from '@/types/resource';

import { getResourceQueryKey, mergeServerResourcesWithOptimistic } from './utils';

const createResource = (overrides: Partial<ResourceItem> = {}): ResourceItem => ({
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  fileType: 'text/plain',
  id: 'resource-1',
  name: 'Resource 1',
  parentId: null,
  size: 1,
  sourceType: 'file',
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  url: 'files/resource-1.txt',
  ...overrides,
});

describe('mergeServerResourcesWithOptimistic', () => {
  it('should preserve optimistic resources from other queries in the global resource map', () => {
    const offscreenOptimistic = createResource({
      _optimistic: {
        isPending: true,
        queryKey: getResourceQueryKey({ parentId: 'folder-a' }),
        retryCount: 0,
      },
      id: 'temp-a',
      name: 'Offscreen upload',
      parentId: 'folder-a',
    });
    const currentServerItem = createResource({
      id: 'file-b',
      name: 'Visible item',
      parentId: 'folder-b',
    });

    const merged = mergeServerResourcesWithOptimistic(
      [currentServerItem],
      new Map([[offscreenOptimistic.id, offscreenOptimistic]]),
      { parentId: 'folder-b' },
    );

    expect(merged.resourceList).toEqual([currentServerItem]);
    expect(merged.resourceMap.get(offscreenOptimistic.id)).toEqual(offscreenOptimistic);
    expect(merged.resourceMap.get(currentServerItem.id)).toEqual(currentServerItem);
  });
});
