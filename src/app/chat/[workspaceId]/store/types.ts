/**
 * 本文件是 AutocodeLLM 项目的原始实现
 *
 * AutocodeLLM 项目许可证：
 * Apache License, Version 2.0
 * Copyright (c) 2026 Jyf0214
 */

import type { MessageToolCall, ModelUsage } from '@lobechat/types';

/**
 * 聊天消息类型定义
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  createdAt: number;
  updatedAt: number;
  
  // 元数据
  meta?: {
    title?: string;
    avatar?: string;
  };
  
  // 模型信息
  model?: string;
  provider?: string;
  
  // 使用量统计
  usage?: ModelUsage;
  
  // 工具调用
  tools?: MessageToolCall[];
  
  // 错误信息
  error?: {
    message: string;
    code?: string;
    body?: Record<string, any>;
  };
  
  // 推理内容
  reasoning?: {
    content?: string;
    signature?: string;
  };
  
  // 父消息ID（用于构建对话树）
  parentId?: string;
  
  // 操作ID（用于追踪Agent操作）
  operationId?: string;
}

/**
 * 工作区信息
 */
export interface WorkspaceInfo {
  id: string;
  name: string;
  description?: string;
  hasPassword: boolean;
}

/**
 * 模型配置
 */
export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  providerId: string;
  enabled: boolean;
  sdkType: string;
  authType: string;
}

/**
 * Agent实例
 */
export interface AgentInstance {
  id: string;
  name: string;
  role: 'supervisor' | 'worker' | 'orchestrator';
  status: 'idle' | 'running' | 'completed' | 'error' | 'cancelled';
  task?: string;
  result?: string;
}

/**
 * 群组编排状态
 */
export interface GroupOrchestrationState {
  supervisor: AgentInstance;
  workers: AgentInstance[];
  status: 'planning' | 'executing' | 'completed' | 'error';
  currentStep?: number;
  totalSteps?: number;
}

/**
 * 监督者状态
 */
export interface SupervisorState {
  status: 'analyzing' | 'planning' | 'waiting_approval' | 'executing' | 'completed';
  pendingDecision?: {
    action: string;
    description: string;
  };
}

/**
 * Agent状态
 */
export interface AgentState {
  activeAgents: AgentInstance[];
  supervisorState?: SupervisorState;
  groupOrchestration?: GroupOrchestrationState;
  currentOperationId?: string;
  status: 'idle' | 'running' | 'completed' | 'error' | 'cancelled';
}

/**
 * 模型状态
 */
export interface ModelState {
  selected: ModelConfig | null;
  available: ModelConfig[];
  loading: boolean;
  error?: string;
}

/**
 * 输入状态
 */
export interface InputState {
  value: string;
  isSending: boolean;
  attachments: FileAttachment[];
}

/**
 * 文件附件
 */
export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  base64?: string;
}

/**
 * UI状态
 */
export interface UIState {
  showAgentPanel: boolean;
  scrollToBottom: boolean;
  loadingMessages: boolean;
  errorDialog: ErrorDialogState | null;
}

/**
 * 错误对话框状态
 */
export interface ErrorDialogState {
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * 聊天错误
 */
export interface ChatError {
  message: string;
  code?: string;
  details?: any;
}

/**
 * 完整的Store状态
 */
export interface ChatStoreState {
  // 聊天核心
  workspaceId: string;
  workspace: WorkspaceInfo | null;
  messages: ChatMessage[];
  messageMap: Map<string, ChatMessage>;
  isLoading: boolean;
  error: ChatError | null;
  
  // Agent
  agents: AgentState;
  
  // 模型
  models: ModelState;
  
  // 输入
  input: InputState;
  
  // UI
  ui: UIState;
}
