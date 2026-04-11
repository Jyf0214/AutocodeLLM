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

import { ragService } from '@/services/rag';
import { type StoreSetter } from '@/store/types';

import { type FileStore } from '../../store';

type Setter = StoreSetter<FileStore>;
export const createFileChunkSlice = (set: Setter, get: () => FileStore, _api?: unknown) =>
  new FileChunkActionImpl(set, get, _api);

export class FileChunkActionImpl {
  readonly #set: Setter;

  constructor(set: Setter, get: () => FileStore, _api?: unknown) {
    void _api;
    this.#set = set;
    void get;
  }

  closeChunkDrawer = (): void => {
    this.#set({ chunkDetailId: null, isSimilaritySearch: false, similaritySearchChunks: [] });
  };

  highlightChunks = (ids: string[]): void => {
    this.#set({ highlightChunkIds: ids });
  };

  openChunkDrawer = (id: string): void => {
    this.#set({ chunkDetailId: id });
  };

  semanticSearch = async (text: string, fileId: string): Promise<void> => {
    this.#set({ isSimilaritySearching: true });
    const data = await ragService.semanticSearch(text, [fileId]);
    this.#set({ isSimilaritySearching: false, similaritySearchChunks: data });
  };
}

export type FileChunkAction = Pick<FileChunkActionImpl, keyof FileChunkActionImpl>;
