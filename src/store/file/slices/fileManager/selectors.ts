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

import { type FilesStoreState } from '@/store/file/initialState';
import { type FileUploadStatus } from '@/types/files/upload';

const uploadStatusArray = new Set(['uploading', 'pending', 'processing']);

const dockFileList = (s: FilesStoreState) => s.dockUploadFileList;
const dockRawFileList = (s: FilesStoreState) => s.dockUploadFileList.map((item) => item.file);
const getFileById = (id?: string | null) => (s: FilesStoreState) => {
  if (!id) return;

  return s.fileList.find((item) => item.id === id);
};

const isUploadingFiles = (s: FilesStoreState) =>
  s.dockUploadFileList.some((file) => uploadStatusArray.has(file.status));

const overviewUploadingStatus = (s: FilesStoreState): FileUploadStatus => {
  if (s.dockUploadFileList.length === 0) return 'pending';
  if (s.dockUploadFileList.some((file) => uploadStatusArray.has(file.status))) {
    return 'uploading';
  }

  return 'success';
};

const overviewUploadingProgress = (s: FilesStoreState) => {
  const uploadFiles = s.dockUploadFileList.filter(
    (file) => file.status === 'uploading' || file.status === 'pending',
  );

  if (uploadFiles.length === 0) return 100;

  const totalPercent = uploadFiles.length * 100;
  const currentPercent = uploadFiles.reduce(
    (acc, file) => acc + (file.uploadState?.progress || 0),
    0,
  );

  return (currentPercent / totalPercent) * 100;
};

const isCreatingFileParseTask = (id: string) => (s: FilesStoreState) =>
  s.creatingChunkingTaskIds.includes(id);

const isCreatingChunkEmbeddingTask = (id: string) => (s: FilesStoreState) =>
  s.creatingEmbeddingTaskIds.includes(id);

const fileListHasMore = (s: FilesStoreState) => s.fileListHasMore;

export const fileManagerSelectors = {
  dockFileList,
  dockRawFileList,
  fileListHasMore,
  getFileById,
  isCreatingChunkEmbeddingTask,
  isCreatingFileParseTask,
  isUploadingFiles,
  overviewUploadingProgress,
  overviewUploadingStatus,
};
