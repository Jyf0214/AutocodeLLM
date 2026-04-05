/**
 * 工作区日志 API 类型定义
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

export interface WorkspaceLogListResponse {
  success: boolean;
  data?: WorkspaceLog[];
  error?: {
    message: string;
    code: string;
  };
}

export interface CreateWorkspaceLogRequest {
  type?: 'function_call' | 'chat_message';
  functionName?: string;
  summary?: string;
  status?: 'success' | 'error' | 'pending';
}

export interface WorkspaceLogResponse {
  success: boolean;
  data?: WorkspaceLog;
  error?: {
    message: string;
    code: string;
  };
}

export interface VerifyPasswordRequest {
  password: string;
}

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
