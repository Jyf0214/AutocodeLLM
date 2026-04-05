/**
 * Provider API 类型定义
 */

export interface Provider {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  databaseUrl: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderResponse {
  success: boolean;
  data?: Provider | Provider[];
  error?: {
    message: string;
    code: string;
  };
}

export interface CreateProviderRequest {
  name: string;
  baseUrl: string;
  apiKey: string;
  databaseUrl?: string;
  enabled?: boolean;
}

export interface UpdateProviderRequest {
  id: string;
  name?: string;
  baseUrl?: string;
  apiKey?: string;
  databaseUrl?: string;
  enabled?: boolean;
}

export interface TestProviderRequest {
  id: string;
  baseUrl: string;
  apiKey: string;
}

export interface TestProviderResponse {
  success: boolean;
  data?: {
    connected: boolean;
    latency?: number;
    message: string;
  };
  error?: {
    message: string;
    code: string;
  };
}
