/**
 * Agent 任务 API 类型定义
 */

/**
 * Agent 任务执行模式
 */
export type AgentTaskMode = 'read_only' | 'yolo';

/**
 * Agent 任务状态
 */
export type AgentTaskStatus = 'ready' | 'running' | 'completed' | 'failed';

/**
 * Agent 任务
 */
export interface AgentTask {
  id: string;
  name: string;
  description: string;
  mode: AgentTaskMode;
  status: AgentTaskStatus;
  maxAgents: number;
  progress: number;
  logs: Record<string, unknown>[] | null;
  result: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Agent 任务列表响应
 */
export interface AgentTaskListResponse {
  success: boolean;
  data?: AgentTask[] | { id: string };
  error?: {
    message: string;
    code: string;
  };
}

/**
 * 创建 Agent 任务请求
 */
export interface CreateAgentTaskRequest {
  name: string;
  description?: string;
  mode: AgentTaskMode;
  maxAgents?: number;
}

/**
 * 更新 Agent 任务请求
 */
export interface UpdateAgentTaskRequest {
  id: string;
  name?: string;
  description?: string;
  mode?: AgentTaskMode;
  status?: AgentTaskStatus;
  maxAgents?: number;
  progress?: number;
  logs?: Record<string, unknown>[];
  result?: string;
}
