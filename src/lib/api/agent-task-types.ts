export interface AgentTask {
  id: string;
  name: string;
  description: string;
  mode: 'read_only' | 'yolo';
  status: 'ready' | 'running' | 'completed' | 'failed';
  maxAgents: number;
  progress: number;
  logs: Record<string, unknown>[] | null;
  result: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentTaskListResponse {
  success: boolean;
  data?: AgentTask[] | { id: string };
  error?: {
    message: string;
    code: string;
  };
}

export interface CreateAgentTaskRequest {
  name: string;
  description?: string;
  mode: 'read_only' | 'yolo';
  maxAgents?: number;
}

export interface UpdateAgentTaskRequest {
  id: string;
  name?: string;
  description?: string;
  mode?: 'read_only' | 'yolo';
  status?: 'ready' | 'running' | 'completed' | 'failed';
  maxAgents?: number;
  progress?: number;
  logs?: Record<string, unknown>[];
  result?: string;
}
