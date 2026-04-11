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

import { type SWRResponse } from 'swr';

import { useClientDataSWR } from '@/libs/swr';
import { fileService } from '@/services/file';
import { type StoreSetter } from '@/store/types';
import { type FileItem } from '@/types/files';

import { type FileStore } from '../../store';

const FETCH_TTS_FILE = 'fetchTTSFile';

type Setter = StoreSetter<FileStore>;
export const createTTSFileSlice = (set: Setter, get: () => FileStore, _api?: unknown) =>
  new TTSFileActionImpl(set, get, _api);

export class TTSFileActionImpl {
  readonly #get: () => FileStore;

  constructor(set: Setter, get: () => FileStore, _api?: unknown) {
    void _api;
    void set;
    this.#get = get;
  }

  removeTTSFile = async (id: string): Promise<void> => {
    await fileService.removeFile(id);
  };

  uploadTTSByArrayBuffers = async (
    messageId: string,
    arrayBuffers: ArrayBuffer[],
  ): Promise<string | undefined> => {
    const fileType = 'audio/mp3';
    const blob = new Blob(arrayBuffers, { type: fileType });
    const fileName = `${messageId}.mp3`;
    const fileOptions = {
      lastModified: Date.now(),
      type: fileType,
    };
    const file = new File([blob], fileName, fileOptions);

    const res = await this.#get().uploadWithProgress({ file, skipCheckFileType: true });

    return res?.id;
  };

  useFetchTTSFile = (id: string | null): SWRResponse<FileItem> => {
    return useClientDataSWR(!!id ? [FETCH_TTS_FILE, id] : null, () => fileService.getFile(id!));
  };
}

export type TTSFileAction = Pick<TTSFileActionImpl, keyof TTSFileActionImpl>;
