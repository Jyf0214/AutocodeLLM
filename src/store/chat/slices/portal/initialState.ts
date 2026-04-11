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

import { type PortalArtifact } from '@/types/artifact';

export enum ArtifactDisplayMode {
  Code = 'code',
  Preview = 'preview',
}

// ============== Portal View Stack Types ==============

export enum PortalViewType {
  Artifact = 'artifact',
  Document = 'document',
  FilePreview = 'filePreview',
  GroupThread = 'groupThread',
  Home = 'home',
  MessageDetail = 'messageDetail',
  Notebook = 'notebook',
  Thread = 'thread',
  ToolUI = 'toolUI',
}

export interface PortalFile {
  chunkId?: string;
  chunkText?: string;
  fileId: string;
}

export type PortalViewData =
  | { type: PortalViewType.Home }
  | { artifact: PortalArtifact; type: PortalViewType.Artifact }
  | { documentId: string; type: PortalViewType.Document }
  | { type: PortalViewType.Notebook }
  | { file: PortalFile; type: PortalViewType.FilePreview }
  | { messageId: string; type: PortalViewType.MessageDetail }
  | { identifier: string; messageId: string; type: PortalViewType.ToolUI }
  | { startMessageId?: string; threadId?: string; type: PortalViewType.Thread }
  | { agentId: string; type: PortalViewType.GroupThread };

// ============== Portal State ==============

export interface ChatPortalState {
  // Legacy fields (kept for backward compatibility during migration)
  // TODO: Remove after Phase 3 migration complete
  /** @deprecated Use portalStack instead */
  portalArtifact?: PortalArtifact;
  portalArtifactDisplayMode: ArtifactDisplayMode;
  /** @deprecated Use portalStack instead */
  portalDocumentId?: string;

  /** @deprecated Use portalStack instead */
  portalFile?: PortalFile;
  /** @deprecated Use portalStack instead */
  portalMessageDetail?: string;
  portalStack: PortalViewData[];
  /** @deprecated Use portalStack instead */
  portalThreadId?: string;
  /** @deprecated Use portalStack instead */
  portalToolMessage?: { id: string; identifier: string };
  /** @deprecated Use portalStack instead */
  showNotebook?: boolean;
  showPortal: boolean;
}

export const initialChatPortalState: ChatPortalState = {
  portalArtifactDisplayMode: ArtifactDisplayMode.Preview,
  portalStack: [],
  showPortal: false,
};
