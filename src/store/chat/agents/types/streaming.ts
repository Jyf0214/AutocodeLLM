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

import {
  type ChatImageItem,
  type ChatToolPayload,
  type GroundingSearch,
  type MessageContentPart,
  type MessageToolCall,
  type ModelPerformance,
  type ModelUsage,
} from '@lobechat/types';

/**
 * Streaming context - immutable configuration
 */
export interface StreamingContext {
  agentId: string;
  groupId?: string;
  messageId: string;
  operationId?: string;
  topicId?: string | null;
}

/**
 * Reasoning state
 */
export interface ReasoningState {
  content?: string;
  duration?: number;
  isMultimodal?: boolean;
  signature?: string;
  tempDisplayContent?: MessageContentPart[];
}

/**
 * Grounding/search data - extends GroundingSearch for compatibility
 */
export type GroundingData = GroundingSearch;

/**
 * Streaming callbacks - for notifying external state changes
 */
export interface StreamingCallbacks {
  /** Content update */
  onContentUpdate: (
    content: string,
    reasoning?: ReasoningState,
    contentMetadata?: { isMultimodal: boolean; tempDisplayContent: string },
  ) => void;
  /** Search grounding update */
  onGroundingUpdate: (grounding: GroundingData) => void;
  /** Image list update */
  onImagesUpdate: (images: ChatImageItem[]) => void;
  /** Complete reasoning operation */
  onReasoningComplete: (operationId: string) => void;
  /** Start reasoning operation */
  onReasoningStart: () => string | undefined;
  /** Reasoning state update */
  onReasoningUpdate: (reasoning: ReasoningState) => void;
  /** Tool calls update */
  onToolCallsUpdate: (tools: ChatToolPayload[]) => void;
  /** Toggle tool calling streaming animation */
  toggleToolCallingStreaming: (messageId: string, isAnimationActives?: boolean[]) => void;
  /** Transform tool calls */
  transformToolCalls: (toolCalls: MessageToolCall[]) => ChatToolPayload[];
  /** Upload base64 image */
  uploadBase64Image: (base64Data: string) => Promise<{ id?: string; url?: string }>;
}

/**
 * Finish callback data
 */
export interface FinishData {
  grounding?: GroundingData;
  observationId?: string | null;
  reasoning?: { content?: string; signature?: string };
  speed?: ModelPerformance;
  toolCalls?: MessageToolCall[];
  traceId?: string | null;
  type?: string;
  usage?: ModelUsage;
}

/**
 * Final streaming result
 */
export interface StreamingResult {
  content: string;
  finishType?: string;
  isFunctionCall: boolean;
  metadata: {
    finishType?: string;
    imageList?: ChatImageItem[];
    isMultimodal?: boolean;
    performance?: ModelPerformance;
    reasoning?: ReasoningState;
    search?: GroundingData;
    usage?: ModelUsage;
  };
  toolCalls?: MessageToolCall[];
  tools?: ChatToolPayload[];
  traceId?: string;
  usage?: ModelUsage;
}

/**
 * Stream chunk types
 */
export type StreamChunk =
  | { text: string; type: 'text' }
  | { text: string; type: 'reasoning' }
  | { content: string; mimeType?: string; partType: 'text' | 'image'; type: 'reasoning_part' }
  | { content: string; mimeType?: string; partType: 'text' | 'image'; type: 'content_part' }
  | {
      isAnimationActives?: boolean[];
      tool_calls: MessageToolCall[];
      type: 'tool_calls';
    }
  | { grounding?: GroundingData; type: 'grounding' }
  | {
      image: { data: string; id: string };
      images: { data: string; id: string }[];
      type: 'base64_image';
    }
  | { type: 'stop' };
