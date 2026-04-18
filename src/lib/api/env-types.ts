/**
 * 环境变量 API 类型定义
 */

/**
 * 环境变量
 */
export interface EnvVariable {
  id: string;
  key: string;
  value: string;
  description: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 环境变量响应
 */
export interface EnvVariableResponse {
  success: boolean;
  data?: EnvVariable | EnvVariable[];
  error?: {
    message: string;
    code: string;
  };
}

/**
 * 创建环境变量请求
 */
export interface CreateEnvVariableRequest {
  key: string;
  value: string;
  description?: string;
  enabled?: boolean;
}

/**
 * 更新环境变量请求
 */
export interface UpdateEnvVariableRequest {
  id: string;
  key?: string;
  value?: string;
  description?: string;
  enabled?: boolean;
}
