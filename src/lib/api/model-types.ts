/**
 * 模型配置 API 类型定义
 */

/**
 * 模型配置
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

/**
 * 模型配置响应
 */
export interface ModelConfigResponse {
  success: boolean;
  data?: ModelConfig | ModelConfig[];
  error?: {
    message: string;
    code: string;
  };
}

/**
 * 创建模型配置请求
 */
export interface CreateModelConfigRequest {
  name: string;
  provider: string;
  apiKey: string;
  baseUrl?: string;
  enabled?: boolean;
}

/**
 * 更新模型配置请求
 */
export interface UpdateModelConfigRequest {
  id?: string;
  name?: string;
  provider?: string;
  apiKey?: string;
  baseUrl?: string;
  enabled?: boolean;
}

/**
 * 批量添加请求和响应
 */
export interface BulkAddRequest {
  models: {
    name: string;
    provider: string;
    apiKey: string;
    baseUrl?: string;
  }[];
}

export interface BulkAddResponse {
  success: boolean;
  data?: {
    added: number;
    skipped: number;
    errors: string[];
  };
  error?: {
    message: string;
    code: string;
  };
}

/**
 * 发现模型相关类型
 */
export interface DiscoveredModel {
  id: string;
  name: string;
  owner?: string;
  created?: number;
}

export interface DiscoverRequest {
  baseUrl: string;
  apiKey: string;
}

export interface DiscoverResponse {
  success: boolean;
  data?: DiscoveredModel[];
  error?: {
    message: string;
    code: string;
  };
}
