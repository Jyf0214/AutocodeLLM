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

export interface DocumentQueryFilter {
  fileTypes?: string[];
  sourceTypes?: string[];
}

export interface DocumentState {
  /**
   * current page number (0-based)
   */
  currentPage: number;
  /**
   * Filters used in the last document query
   */
  documentQueryFilter?: DocumentQueryFilter;
  /**
   * Server documents fetched from document service
   */
  documents: LobeDocument[];
  /**
   * total count of documents
   */
  documentsTotal: number;
  /**
   * whether there are more documents to load
   */
  hasMoreDocuments: boolean;
  /**
   * Loading state for document fetching
   */
  isDocumentListLoading: boolean;
  /**
   * loading more documents state
   */
  isLoadingMoreDocuments: boolean;
  /**
   * Local optimistic document map for immediate UI updates
   */
  localDocumentMap: Map<string, LobeDocument>;
}

export const initialDocumentState: DocumentState = {
  currentPage: 0,
  documentQueryFilter: undefined,
  documents: [],
  documentsTotal: 0,
  hasMoreDocuments: false,
  isDocumentListLoading: false,
  isLoadingMoreDocuments: false,
  localDocumentMap: new Map(),
};
