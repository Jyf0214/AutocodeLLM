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

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { initialState } from '@/store/file/initialState';
import { useFileStore } from '@/store/file/store';
import type { ResourceItem } from '@/types/resource';

const { mockMoveResource } = vi.hoisted(() => ({
  mockMoveResource: vi.fn(),
}));

vi.mock('@/services/resource', () => ({
  resourceService: {
    moveResource: mockMoveResource,
  },
}));

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

describe('resource actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useFileStore.setState(initialState);
  });

  it('should keep completed background uploads out of the current resource list when they are off-screen', () => {
    const visibleResource = createResource({
      id: 'visible-1',
      name: 'Visible resource',
      parentId: 'folder-b',
    });
    const optimisticResource = createResource({
      _optimistic: {
        isPending: true,
        retryCount: 0,
      },
      id: 'temp-a',
      name: 'Background upload',
      parentId: 'folder-a',
    });
    const completedResource = createResource({
      id: 'file-a',
      name: 'Background upload',
      parentId: 'folder-a',
    });

    useFileStore.setState({
      queryParams: { parentId: 'folder-b' },
      resourceList: [visibleResource],
      resourceMap: new Map([
        [visibleResource.id, visibleResource],
        [optimisticResource.id, optimisticResource],
      ]),
    });

    useFileStore.getState().replaceLocalResource(optimisticResource.id, completedResource);

    const { resourceList, resourceMap } = useFileStore.getState();

    expect(resourceList).toEqual([visibleResource]);
    expect(resourceMap.has(optimisticResource.id)).toBe(false);
    expect(resourceMap.get(completedResource.id)).toEqual(completedResource);
  });

  it('should remove a root item from the visible list when moving it into a folder', async () => {
    const rootResource = createResource({
      id: 'root-1',
      name: 'Root resource',
      parentId: null,
    });
    const movedResource = createResource({
      id: 'root-1',
      name: 'Root resource',
      parentId: 'folder-a',
    });

    mockMoveResource.mockResolvedValue(movedResource);

    useFileStore.setState({
      queryParams: { parentId: null },
      resourceList: [rootResource],
      resourceMap: new Map([[rootResource.id, rootResource]]),
    });

    await useFileStore.getState().moveResource(rootResource.id, 'folder-a');

    const { resourceList, resourceMap } = useFileStore.getState();

    expect(resourceList).toEqual([]);
    expect(resourceMap.has(rootResource.id)).toBe(false);
  });
});
