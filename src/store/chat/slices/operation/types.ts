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

import { type ConversationContext } from '@lobechat/types';

/**
 * Operation Type Definitions
 * Unified operation state management for all async operations
 */

/**
 * Operation type enumeration - covers all async operations
 */
export type OperationType =
  // === Message sending ===
  | 'sendMessage' // Send message to server
  | 'createTopic' // Auto create topic
  | 'regenerate' // Regenerate message
  | 'continue' // Continue generation

  // === AI generation ===
  | 'execAgentRuntime' // Execute agent runtime (client-side, entire agent runtime execution)
  | 'execServerAgentRuntime' // Execute server agent runtime (server-side, e.g., Group Chat)
  | 'createAssistantMessage' // Create assistant message (sub-operation of execAgentRuntime)
  // === LLM execution (sub-operations) ===
  | 'callLLM' // Call LLM streaming response (sub-operation of execAgentRuntime)
  // === (sub-operations) = ==
  | 'reasoning' // AI reasoning process (child operation)

  // === RAG and retrieval ===
  | 'rag' // RAG retrieval flow (child operation)
  | 'searchWorkflow' // Search workflow

  // === Tool calling ===
  | 'toolCalling' // Tool calling (streaming, child operation)
  // === (sub-operations) ===
  | 'createToolMessage' // Create tool message (sub-operation of executeToolCall)
  | 'executeToolCall' // Execute tool call (sub-operation of toolCalling)
  // === Tool intervention ===
  | 'approveToolCalling' // Approve tool intervention
  | 'rejectToolCalling' // Reject tool intervention
  | 'submitToolInteraction' // Submit user interaction response
  | 'skipToolInteraction' // Skip user interaction
  | 'cancelToolInteraction' // Cancel user interaction
  // === (sub-operations of executeToolCall) ===
  | 'pluginApi' // Plugin API call
  | 'builtinToolSearch' // Builtin tool: search
  | 'builtinToolInterpreter' // Builtin tool: code interpreter
  | 'builtinToolLocalSystem' // Builtin tool: local system
  | 'builtinToolKnowledgeBase' // Builtin tool: knowledge base
  | 'builtinToolMemory' // Builtin tool: user memory
  | 'builtinToolAgentBuilder' // Builtin tool: agent builder
  | 'builtinToolGroupAgentBuilder' // Builtin tool: group agent builder
  | 'builtinToolPageAgent' // Builtin tool: page agent (document editing)

  // === Group Chat ===
  | 'supervisorDecision' // Supervisor decision
  | 'groupAgentGenerate' // Group agent generate (deprecated, use groupAgentStream)
  | 'groupAgentStream' // Group agent SSE stream (sub-operation of execServerAgentRuntime)

  // === Async Task (Desktop only) ===
  | 'execClientTask' // Execute single async sub-agent task on desktop client
  | 'execClientTasks' // Execute multiple async sub-agent tasks on desktop client

  // === Context Compression ===
  // Context compression (compress old messages into summary)
  | 'contextCompression'
  | 'createMessageGroup'
  | 'generateSummary'
  // === Others ===
  | 'translate'; // Translate message

/**
 * Operation status
 */
export type OperationStatus =
  | 'pending' // Waiting to start (not currently used)
  | 'running' // Executing
  | 'paused' // Paused (for user intervention scenarios)
  | 'completed' // Successfully completed
  | 'cancelled' // User cancelled
  | 'failed'; // Execution failed

/**
 * Operation context - business entity associations
 * Extends ConversationContext with operation-specific fields
 * Captured when Operation is created, never changes afterwards
 */
export interface OperationContext extends Partial<ConversationContext> {
  agentId?: string; // Associated agent ID (specific agent in Group Chat)
  groupId?: string; // Associated group ID (Group Chat)
  messageId?: string; // Associated message ID
}

/**
 * Operation cancel context - passed to cancel handler
 */
export interface OperationCancelContext {
  metadata?: OperationMetadata;
  operationId: string;
  reason: string;
  type: OperationType;
}

/**
 * Callback to execute after AgentRuntime completes
 */
export type AfterCompletionCallback = () => void | Promise<void>;

/**
 * Runtime hooks that can be registered during operation execution
 */
export interface RuntimeHooks {
  /**
   * Callbacks to execute after AgentRuntime completes
   * Used for actions that should happen after current execution finishes
   * to avoid race conditions with message updates
   */
  afterCompletionCallbacks?: AfterCompletionCallback[];
}

/**
 * Operation metadata
 */
export interface OperationMetadata {
  // Other metadata (extensible)
  [key: string]: any;

  // Cancel information
  cancelReason?: string;
  duration?: number;
  endTime?: number;

  // Error information
  error?: {
    type: string;
    message: string;
    code?: string;
    details?: any;
  };

  // UI state (for sendMessage operation)
  inputEditorTempState?: any | null; // Editor state snapshot for cancel restoration

  inputSendErrorMsg?: string; // Error message to display in UI
  // Progress information
  progress?: {
    current: number;
    total: number;
    percentage?: number;
  };

  // Runtime hooks (collected during execution, executed after completion)
  runtimeHooks?: RuntimeHooks;

  // Performance information
  startTime: number;
}

/**
 * Operation definition
 */
export interface Operation {
  // === Control ===
  abortController: AbortController; // Abort controller
  childOperationIds?: string[]; // Child operation IDs
  // === Context (core: capture and fix business context) ===
  context: OperationContext; // Associated entities, captured at creation

  description?: string; // Operation description (for tooltip)

  // === Basic information ===
  id: string; // Unique operation ID (using nanoid)

  // === UI display ===
  label?: string; // Operation display label (for UI)

  // === Metadata ===
  metadata: OperationMetadata;

  // === Cancel handler ===
  onCancelHandler?: (context: OperationCancelContext) => void | Promise<void>; // Cancel callback
  // === Dependencies ===
  parentOperationId?: string; // Parent operation ID (for operation nesting)

  status: OperationStatus; // Operation status
  type: OperationType; // Operation type
}

/**
 * Queued message waiting to be injected into agent runtime
 */
export interface QueuedMessage {
  content: string;
  createdAt: number;
  /** Lexical editor JSON state for rich text rendering */
  editorData?: Record<string, any>;
  files?: string[];
  id: string;
  interruptMode: 'soft' | 'hard';
}

/**
 * Merged message ready for injection
 */
export interface MergedQueuedMessage {
  content: string;
  /** Lexical editor JSON state for rich text rendering */
  editorData?: Record<string, any>;
  files: string[];
}

const createTextNode = (text: string) => ({
  detail: 0,
  format: 0,
  mode: 'normal',
  style: '',
  text,
  type: 'text',
  version: 1,
});

const createParagraphNode = (text = '') => ({
  children: text ? [createTextNode(text)] : [],
  direction: 'ltr',
  format: '',
  indent: 0,
  type: 'paragraph',
  version: 1,
});

const createEditorDataFromContent = (content: string): Record<string, any> | undefined => {
  if (!content) return undefined;

  return {
    root: {
      children: content.split('\n').map((line) => createParagraphNode(line)),
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  };
};

const normalizeQueuedEditorData = (message: QueuedMessage): Record<string, any> | undefined => {
  if (message.editorData?.root) return message.editorData;

  return createEditorDataFromContent(message.content);
};

const mergeQueuedEditorData = (messages: QueuedMessage[]): Record<string, any> | undefined => {
  const mergedChildren: any[] = [];
  let baseRoot: Record<string, any> | undefined;

  for (const message of messages) {
    const editorData = normalizeQueuedEditorData(message);
    const root = editorData?.root;
    const children = root?.children;

    if (!Array.isArray(children) || children.length === 0) continue;

    if (!baseRoot) {
      baseRoot = structuredClone(root);
    }

    if (mergedChildren.length > 0) {
      mergedChildren.push(createParagraphNode());
    }

    mergedChildren.push(...structuredClone(children));
  }

  if (mergedChildren.length === 0) return undefined;

  return {
    root: {
      ...baseRoot,
      children: mergedChildren,
      type: 'root',
      version: baseRoot?.version ?? 1,
    },
  };
};

/**
 * Merge multiple queued messages into a single message.
 * Sorted by creation time, content joined with double newlines.
 */
export const mergeQueuedMessages = (messages: QueuedMessage[]): MergedQueuedMessage => {
  const sorted = [...messages].sort((a, b) => a.createdAt - b.createdAt);
  return {
    content: sorted.map((m) => m.content).join('\n\n'),
    editorData: mergeQueuedEditorData(sorted),
    files: sorted.flatMap((m) => m.files ?? []),
  };
};

/**
 * Operation filter for querying operations
 */
export interface OperationFilter {
  agentId?: string;
  groupId?: string;
  messageId?: string;
  status?: OperationStatus | OperationStatus[];
  threadId?: string;
  topicId?: string | null;
  type?: OperationType | OperationType[];
}

// === Operation Type Constants ===

/**
 * Operation types that indicate AI is generating content
 * Used for loading state indicators and animation in UI
 *
 * Includes:
 * - execAgentRuntime: Client-side agent execution (single chat)
 * - execServerAgentRuntime: Server-side agent execution (Group Chat)
 */
export const AI_RUNTIME_OPERATION_TYPES: OperationType[] = [
  'execAgentRuntime',
  'execServerAgentRuntime',
];

/**
 * Operation types that should block input and show loading state
 * Superset of AI_RUNTIME_OPERATION_TYPES, also includes sendMessage
 * since the input should be in loading state from the moment user sends until AI finishes
 */
export const INPUT_LOADING_OPERATION_TYPES: OperationType[] = [
  ...AI_RUNTIME_OPERATION_TYPES,
  'sendMessage',
];
