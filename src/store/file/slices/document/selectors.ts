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

import { type LobeDocument } from '@/types/document';

import { type FilesStoreState } from '../../initialState';

const getDocumentById = (documentId: string | undefined) => (s: FilesStoreState) => {
  if (!documentId) return undefined;

  // First check local optimistic map
  const localDocument = s.localDocumentMap.get(documentId);

  // Then check server documents
  const serverDocument = s.documents.find((doc) => doc.id === documentId);

  // If both exist, prefer the local update if it's newer
  if (localDocument && serverDocument) {
    return new Date(localDocument.updatedAt) >= new Date(serverDocument.updatedAt)
      ? localDocument
      : serverDocument;
  }

  // Return whichever exists, or undefined if neither exists
  return localDocument || serverDocument;
};

/**
 * Get all documents merged from local optimistic map and server data
 */
const getOptimisticDocuments = (s: FilesStoreState): LobeDocument[] => {
  // Track which documents we've added
  const addedIds = new Set<string>();

  // Create result array - start with server documents
  const result: LobeDocument[] = s.documents.map((doc) => {
    addedIds.add(doc.id);
    // Check if we have a local optimistic update for this document
    const localUpdate = s.localDocumentMap.get(doc.id);
    // If local update exists and is newer, use it; otherwise use server version
    if (localUpdate && new Date(localUpdate.updatedAt) >= new Date(doc.updatedAt)) {
      return localUpdate;
    }
    return doc;
  });

  // Add any optimistic documents that aren't in server list yet (e.g., newly created temp documents)
  for (const [id, doc] of s.localDocumentMap.entries()) {
    if (!addedIds.has(id)) {
      result.unshift(doc); // Add new documents to the beginning
    }
  }

  return result;
};

const hasMoreDocuments = (s: FilesStoreState): boolean => s.hasMoreDocuments;

const isLoadingMoreDocuments = (s: FilesStoreState): boolean => s.isLoadingMoreDocuments;

const documentsTotal = (s: FilesStoreState): number => s.documentsTotal;

export const documentSelectors = {
  documentsTotal,
  getDocumentById,
  getOptimisticDocuments,
  hasMoreDocuments,
  isLoadingMoreDocuments,
};
