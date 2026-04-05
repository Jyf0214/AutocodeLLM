/**
 * 环境变量 API 类型定义
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

export interface EnvVariableResponse {
  success: boolean;
  data?: EnvVariable | EnvVariable[];
  error?: {
    message: string;
    code: string;
  };
}

export interface CreateEnvVariableRequest {
  key: string;
  value: string;
  description?: string;
  enabled?: boolean;
}

export interface UpdateEnvVariableRequest {
  id: string;
  key?: string;
  value?: string;
  description?: string;
  enabled?: boolean;
}
