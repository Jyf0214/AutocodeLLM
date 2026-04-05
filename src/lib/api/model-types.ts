/**
 * 模型配置 API 类型定义
 */

export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  apiKey: string;
  baseUrl?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ModelConfigResponse {
  success: boolean;
  data?: ModelConfig | ModelConfig[];
  error?: {
    message: string;
    code: string;
  };
}

export interface CreateModelConfigRequest {
  name: string;
  provider: string;
  apiKey: string;
  baseUrl?: string;
  enabled?: boolean;
}

export interface UpdateModelConfigRequest {
  name?: string;
  provider?: string;
  apiKey?: string;
  baseUrl?: string;
  enabled?: boolean;
}
