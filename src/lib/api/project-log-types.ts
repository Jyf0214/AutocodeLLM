/**
 * 项目日志 API 类型定义
 */

/**
 * 项目日志记录
 */
export interface ProjectLog {
  id: string;
  projectId: string;
  type: 'FUNCTION_CALL' | 'CHAT_MESSAGE';
  functionName: string | null;
  summary: string | null;
  status: 'SUCCESS' | 'ERROR' | 'PENDING' | null;
  createdAt: string;
}

/**
 * 创建项目日志请求
 */
export interface CreateProjectLogRequest {
  type?: 'FUNCTION_CALL' | 'CHAT_MESSAGE';
  functionName?: string;
  summary?: string;
  status?: 'SUCCESS' | 'ERROR' | 'PENDING';
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
 * 项目日志列表响应
 */
export interface ProjectLogListResponse {
  success: boolean;
  data?: ProjectLog[];
  error?: {
    message: string;
    code: string;
  };
}

/**
 * 单条日志响应
 */
export interface ProjectLogResponse {
  success: boolean;
  data?: ProjectLog;
  error?: {
    message: string;
    code: string;
  };
}
