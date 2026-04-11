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

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { documentService } from '@/services/document';
import { DocumentSourceType, type LobeDocument } from '@/types/document';
import { type ResourceItem } from '@/types/resource';

import { useFileStore as useStore } from '../../store';
import { getResourceQueryKey } from '../resource/utils';

vi.mock('zustand/traditional');

vi.mock('@/services/document', () => ({
  documentService: {
    createDocument: vi.fn(),
    deleteDocument: vi.fn(),
    getDocumentById: vi.fn(),
    queryDocuments: vi.fn(),
    updateDocument: vi.fn(),
  },
}));

const createDocumentFixture = (overrides: Partial<LobeDocument> = {}): LobeDocument => ({
  content: 'Body',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  editorData: {},
  fileType: 'custom/document',
  filename: 'Old title',
  id: 'doc-1',
  metadata: {},
  source: 'document',
  sourceType: DocumentSourceType.EDITOR,
  title: 'Old title',
  totalCharCount: 4,
  totalLineCount: 1,
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  ...overrides,
});

const createResourceFixture = (overrides: Partial<ResourceItem> = {}): ResourceItem => ({
  content: 'Body',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  editorData: {},
  fileType: 'custom/document',
  id: 'doc-1',
  knowledgeBaseId: 'kb-1',
  metadata: {},
  name: 'Old title',
  parentId: null,
  size: 4,
  sourceType: 'document',
  title: 'Old title',
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  url: 'document',
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();

  useStore.setState(
    {
      documents: [],
      localDocumentMap: new Map(),
      queryParams: undefined,
      resourceList: [],
      resourceMap: new Map(),
    },
    false,
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('DocumentAction', () => {
  it('creates a folder in the current resource list without full revalidation', async () => {
    const { result } = renderHook(() => useStore());

    vi.mocked(documentService.createDocument).mockResolvedValue({
      content: '',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      editorData: '{}',
      fileType: 'custom/folder',
      id: 'folder-1',
      metadata: {},
      parentId: null,
      slug: 'new-folder',
      source: 'document',
      title: 'New Folder',
      totalCharCount: 0,
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    } as any);

    act(() => {
      useStore.setState(
        {
          queryParams: {
            libraryId: 'kb-1',
            parentId: null,
          },
        },
        false,
      );
    });

    await act(async () => {
      await result.current.createFolder('New Folder', undefined, 'kb-1');
    });

    expect(useStore.getState().resourceList.map((item) => item.id)).toEqual(['folder-1']);
    expect(useStore.getState().resourceMap.get('folder-1')).toMatchObject({
      fileType: 'custom/folder',
      id: 'folder-1',
      knowledgeBaseId: 'kb-1',
      name: 'New Folder',
      parentId: null,
      slug: 'new-folder',
      sourceType: 'document',
      title: 'New Folder',
    });
  });

  it('updates the local document and visible resource after a successful save', async () => {
    const { result } = renderHook(() => useStore());
    const existingDocument = createDocumentFixture();
    const existingResource = createResourceFixture();

    vi.mocked(documentService.updateDocument).mockResolvedValue(undefined);

    act(() => {
      useStore.setState(
        {
          documents: [existingDocument],
          queryParams: {
            libraryId: 'kb-1',
            parentId: null,
          },
          resourceList: [existingResource],
          resourceMap: new Map([[existingResource.id, existingResource]]),
        },
        false,
      );
    });

    await act(async () => {
      await result.current.updateDocument('doc-1', {
        metadata: { emoji: 'page' },
        title: 'Renamed title',
      });
    });

    expect(documentService.updateDocument).toHaveBeenCalledWith({
      content: undefined,
      editorData: undefined,
      id: 'doc-1',
      metadata: { emoji: 'page' },
      parentId: undefined,
      title: 'Renamed title',
    });
    expect(useStore.getState().localDocumentMap.get('doc-1')).toMatchObject({
      metadata: { emoji: 'page' },
      title: 'Renamed title',
    });
    expect(useStore.getState().resourceMap.get('doc-1')).toMatchObject({
      metadata: { emoji: 'page' },
      name: 'Renamed title',
      title: 'Renamed title',
    });
  });

  it('updates the resource optimistically and clears the marker after sync', async () => {
    const { result } = renderHook(() => useStore());
    const existingDocument = createDocumentFixture();
    const existingResource = createResourceFixture();

    let resolveUpdate: (() => void) | undefined;
    vi.mocked(documentService.updateDocument).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveUpdate = resolve;
        }),
    );

    act(() => {
      useStore.setState(
        {
          documents: [existingDocument],
          queryParams: {
            libraryId: 'kb-1',
            parentId: null,
          },
          resourceList: [existingResource],
          resourceMap: new Map([[existingResource.id, existingResource]]),
        },
        false,
      );
    });

    let pendingUpdate!: Promise<void>;
    act(() => {
      pendingUpdate = result.current.updateDocumentOptimistically('doc-1', {
        title: 'Optimistic title',
      });
    });

    expect(useStore.getState().resourceMap.get('doc-1')).toMatchObject({
      _optimistic: {
        isPending: true,
        queryKey: getResourceQueryKey(useStore.getState().queryParams),
        retryCount: 0,
      },
      name: 'Optimistic title',
      title: 'Optimistic title',
    });

    resolveUpdate?.();

    await act(async () => {
      await pendingUpdate;
    });

    expect(useStore.getState().resourceMap.get('doc-1')).toMatchObject({
      name: 'Optimistic title',
      title: 'Optimistic title',
    });
    expect(useStore.getState().resourceMap.get('doc-1')?._optimistic).toBeUndefined();
  });

  it('reverts optimistic resource updates when the sync fails', async () => {
    const { result } = renderHook(() => useStore());
    const existingDocument = createDocumentFixture();
    const existingResource = createResourceFixture();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(documentService.updateDocument).mockRejectedValue(new Error('sync failed'));

    act(() => {
      useStore.setState(
        {
          documents: [existingDocument],
          queryParams: {
            libraryId: 'kb-1',
            parentId: null,
          },
          resourceList: [existingResource],
          resourceMap: new Map([[existingResource.id, existingResource]]),
        },
        false,
      );
    });

    await act(async () => {
      await result.current.updateDocumentOptimistically('doc-1', {
        title: 'Broken title',
      });
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(useStore.getState().localDocumentMap.get('doc-1')).toMatchObject({
      title: 'Old title',
    });
    expect(useStore.getState().resourceMap.get('doc-1')).toMatchObject({
      name: 'Old title',
      title: 'Old title',
    });
    expect(useStore.getState().resourceMap.get('doc-1')?._optimistic).toBeUndefined();
  });
});
