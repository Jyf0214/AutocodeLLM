/**
 * Provider API 类型定义
 */

/**
 * 提供商数据
 */
export interface Provider {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  databaseUrl: string | null;
  enabled: boolean;
  providerType: string;
  sdkType: string;
  authType: string;
  oauthAccessToken: string | null;
  oauthRefreshToken: string | null;
  oauthExpiresAt: string | null;
  oauthClientId: string | null;
  oauthDeviceCode: string | null;
  metadata: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 提供商响应
 */
export interface ProviderResponse {
  success: boolean;
  data?: Provider | Provider[];
  error?: {
    message: string;
    code: string;
  };
}

/**
 * 创建提供商请求
 */
export interface CreateProviderRequest {
  name: string;
  baseUrl: string;
  apiKey?: string;
  databaseUrl?: string;
  enabled?: boolean;
  providerType?: string;
  sdkType?: string;
  authType?: string;
  oauthAccessToken?: string;
  oauthRefreshToken?: string;
  oauthDeviceCode?: string;
  oauthExpiresAt?: string;
  metadata?: string;
}

/**
 * 更新提供商请求
 */
export interface UpdateProviderRequest {
  id: string;
  name?: string;
  baseUrl?: string;
  apiKey?: string;
  databaseUrl?: string;
  enabled?: boolean;
  authType?: string;
  sdkType?: string;
  oauthAccessToken?: string;
  oauthRefreshToken?: string;
  oauthDeviceCode?: string;
  oauthExpiresAt?: string;
  metadata?: string;
}

/**
 * 测试提供商请求和响应
 */
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

/**
 * 预置提供商数据
 */
export interface PresetProviderData {
  id: string;
  name: string;
  nameEn?: string;
  baseUrl?: string;
  apiKeyUrl?: string;
  sdkType: string;
  authType: string;
  openaiCompatible: boolean;
  checkModel?: string;
  icon?: string;
  description?: string;
  isAdded?: boolean;
  dbId?: string;
}

/**
 * Qwen OAuth 相关类型
 */
export interface QwenOAuthStartResponse {
  success: boolean;
  data?: {
    deviceCode: string;
    userCode: string;
    verificationUri: string;
    verificationUriComplete: string;
    authorizationUrl: string;
    expiresIn: number;
    interval: number;
    codeVerifier: string;
  };
  error?: {
    message: string;
    code: string;
  };
}

export interface QwenOAuthPollResponse {
  success: boolean;
  data?: {
    accessToken: string;
    refreshToken: string;
    resourceUrl: string;
    expiresIn: number;
    providerId: string;
  };
  error?: {
    message: string;
    code: string;
  };
}

export interface QwenOAuthRefreshResponse {
  success: boolean;
  data?: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    expiresAt: string;
  };
  error?: {
    message: string;
    code: string;
  };
}

/**
 * 添加预置提供商响应
 */
export interface AddPresetProviderResponse {
  success: boolean;
  data?: Provider;
  error?: {
    message: string;
    code: string;
  };
}
