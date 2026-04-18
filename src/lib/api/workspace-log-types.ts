/**
 * 工作区日志 API 类型定义
 */

/**
 * 工作区日志记录
 */
export interface WorkspaceLog {
  id: string;
  workspaceId: string;
  type: 'function_call' | 'chat_message';
  functionName: string | null;
  summary: string | null;
  status: 'success' | 'error' | 'pending' | null;
  createdAt: string;
}

/**
 * 创建工作区日志请求
 */
export interface CreateWorkspaceLogRequest {
  type?: 'function_call' | 'chat_message';
  functionName?: string;
  summary?: string;
  status?: 'success' | 'error' | 'pending';
}

/**
 * 验证密码请求
 */
export interface VerifyPasswordRequest {
  password: string;
}

/**
 * 验证密码响应
 */
export interface VerifyPasswordResponse {
  success: boolean;
  data?: {
    verified: boolean;
  };
  error?: {
    message: string;
    code: string;
  };
}

/**
 * 设置密码请求和响应
 */
export interface SetPasswordRequest {
  password: string;
}

export interface SetPasswordResponse {
  success: boolean;
  error?: {
    message: string;
    code: string;
  };
}

/**
 * 工作区日志列表响应
 */
export interface WorkspaceLogListResponse {
  success: boolean;
  data?: WorkspaceLog[];
  error?: {
    message: string;
    code: string;
  };
}

/**
 * 单条日志响应
 */
export interface WorkspaceLogResponse {
  success: boolean;
  data?: WorkspaceLog;
  error?: {
    message: string;
    code: string;
  };
}
