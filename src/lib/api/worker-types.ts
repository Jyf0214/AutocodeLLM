/**
 * Worker 工作节点 API 类型定义
 */

/**
 * Worker 类型
 */
export type WorkerType = 'compute' | 'storage' | 'inference';

/**
 * Worker 状态
 */
export type WorkerStatus = 'online' | 'offline' | 'busy' | 'error';

/**
 * Worker 工作节点
 */
export interface Worker {
  id: string;
  name: string;
  type: WorkerType;
  status: WorkerStatus;
  url: string;
  lastHeartbeat: string | null;
  metadata: Record<string, unknown> | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Worker 响应
 */
export interface WorkerResponse {
  success: boolean;
  data?: Worker;
  error?: {
    message: string;
    code: string;
  };
}

/**
 * Worker 列表响应
 */
export interface WorkerListResponse {
  success: boolean;
  data?: Worker[];
  error?: {
    message: string;
    code: string;
  };
}

/**
 * 创建 Worker 请求
 */
export interface CreateWorkerRequest {
  name?: string;
  type?: WorkerType;
  url?: string;
  metadata?: Record<string, unknown>;
  enabled?: boolean;
}

/**
 * 更新 Worker 请求
 */
export interface UpdateWorkerRequest {
  id: string;
  name?: string;
  type?: WorkerType;
  status?: WorkerStatus;
  url?: string;
  metadata?: Record<string, unknown>;
  enabled?: boolean;
}
