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
  providerType: string;
  sdkType: string;
  authType: string;
  oauthAccessToken: string | null;
  oauthRefreshToken: string | null;
  oauthExpiresAt: string | null;
  oauthClientId: string | null;
  oauthDeviceCode: string | null;
  metadata: string;
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

export interface QwenOAuthStartResponse {
  success: boolean;
  data?: {
    deviceCode: string;
    userCode: string;
    verificationUri: string;
    verificationUriComplete: string;
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

export interface AddPresetProviderResponse {
  success: boolean;
  data?: Provider;
  error?: {
    message: string;
    code: string;
  };
}
