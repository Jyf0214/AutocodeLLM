/**
 * Qwen OAuth 认证模块
 * 实现 Device Authorization Grant (RFC 8628) + PKCE (RFC 7636) 流程
 * 参考 Qwen Code 官方实现：/tmp/qwen-code/packages/core/src/qwen/qwenOAuth2.ts
 */

import crypto from 'crypto';

const QWEN_OAUTH_CONFIG = {
  clientId: 'f0304373b74a44d2b584a3fb70ca9e56',
  deviceCodeUrl: 'https://chat.qwen.ai/api/v1/oauth2/device/code',
  tokenUrl: 'https://chat.qwen.ai/api/v1/oauth2/token',
  scope: 'openid profile email model.completion',
  defaultApiUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  grantType: 'urn:ietf:params:oauth:grant-type:device_code',
};

/**
 * PKCE 工具函数：生成 code_verifier 和 code_challenge
 */
function generatePKCEPair(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const hash = crypto.createHash('sha256');
  hash.update(codeVerifier);
  const codeChallenge = hash.digest('base64url');
  return { codeVerifier, codeChallenge };
}

/**
 * 将对象转换为 URL-encoded 字符串
 */
function objectToUrlEncoded(data: Record<string, string>): string {
  return Object.entries(data)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

/**
 * Device Code 响应类型
 */
export interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete: string;
  expires_in: number;
  interval?: number;
}

/**
 * Token 响应类型
 */
export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  resource_url?: string;
}

/**
 * OAuth 错误响应类型
 */
export interface OAuthErrorResponse {
  error: string;
  error_description: string;
}

/**
 * 启动 Device Flow 认证（支持 PKCE）
 */
export async function startQwenDeviceFlow(): Promise<{
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  verificationUriComplete: string;
  expiresIn: number;
  interval: number;
  codeVerifier: string;
}> {
  const { codeVerifier, codeChallenge } = generatePKCEPair();

  const bodyData = {
    client_id: QWEN_OAUTH_CONFIG.clientId,
    scope: QWEN_OAUTH_CONFIG.scope,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  };

  const response = await fetch(QWEN_OAUTH_CONFIG.deviceCodeUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      'x-request-id': crypto.randomUUID(),
    },
    body: objectToUrlEncoded(bodyData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `启动 Device Flow 失败：HTTP ${String(response.status)}`;
    try {
      const errorData = JSON.parse(errorText) as OAuthErrorResponse;
      errorMessage += ` - ${errorData.error}: ${errorData.error_description}`;
    } catch {
      errorMessage += ` - ${errorText}`;
    }
    throw new Error(errorMessage);
  }

  const data = (await response.json()) as DeviceCodeResponse;

  return {
    deviceCode: data.device_code,
    userCode: data.user_code,
    verificationUri: data.verification_uri,
    verificationUriComplete: data.verification_uri_complete,
    expiresIn: data.expires_in,
    interval: data.interval ?? 2, // Qwen Code 官方使用 2 秒
    codeVerifier,
  };
}

/**
 * 轮询获取 Token（支持 PKCE code_verifier）
 */
export async function pollQwenToken(
  deviceCode: string,
  codeVerifier: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  resourceUrl: string;
  expiresIn: number;
  tokenType: string;
}> {
  const bodyData = {
    grant_type: QWEN_OAUTH_CONFIG.grantType,
    client_id: QWEN_OAUTH_CONFIG.clientId,
    device_code: deviceCode,
    code_verifier: codeVerifier,
  };

  const response = await fetch(QWEN_OAUTH_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: objectToUrlEncoded(bodyData),
  });

  // 尝试解析 JSON 响应
  let responseData: TokenResponse | OAuthErrorResponse;
  try {
    responseData = (await response.json()) as TokenResponse | OAuthErrorResponse;
  } catch {
    throw new Error(`获取 Token 失败：HTTP ${String(response.status)} - 响应格式错误`);
  }

  // 检查是否是错误响应
  if ('error' in responseData) {
    const errorData = responseData;

    // OAuth RFC 8628 标准错误处理
    if (response.status === 400 && errorData.error === 'authorization_pending') {
      throw new Error('AUTHORIZATION_PENDING');
    }

    if (response.status === 429 && errorData.error === 'slow_down') {
      throw new Error('SLOW_DOWN');
    }

    // 401 表示 device code 已过期或无效
    if (response.status === 401) {
      throw new Error('DEVICE_CODE_EXPIRED');
    }

    // 429 表示速率限制
    if (response.status === 429) {
      throw new Error('RATE_LIMITED');
    }

    throw new Error(`获取 Token 失败：${errorData.error} - ${errorData.error_description}`);
  }

  // responseData 在这里已经被 TypeScript 缩小类型为 TokenResponse
  const tokenData = responseData;

  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token ?? '',
    resourceUrl: tokenData.resource_url ?? QWEN_OAUTH_CONFIG.defaultApiUrl,
    expiresIn: tokenData.expires_in,
    tokenType: tokenData.token_type,
  };
}

/**
 * 刷新 Token（使用 application/x-www-form-urlencoded）
 */
export async function refreshQwenToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const bodyData = {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: QWEN_OAUTH_CONFIG.clientId,
  };

  const response = await fetch(QWEN_OAUTH_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: objectToUrlEncoded(bodyData),
  });

  // 尝试解析 JSON 响应
  let responseData: TokenResponse | OAuthErrorResponse;
  try {
    responseData = (await response.json()) as TokenResponse | OAuthErrorResponse;
  } catch {
    const errorText = await response.text();
    throw new Error(`刷新 Token 失败：HTTP ${String(response.status)} - ${errorText}`);
  }

  // 检查是否是错误响应
  if ('error' in responseData) {
    const errorData = responseData;

    // 400 错误通常表示 refresh token 已过期或无效
    if (response.status === 400) {
      throw new Error(`刷新 Token 已过期或无效：${errorData.error} - ${errorData.error_description}`);
    }

    throw new Error(`刷新 Token 失败：${errorData.error} - ${errorData.error_description}`);
  }

  // responseData 在这里已经被 TypeScript 缩小类型为 TokenResponse
  const tokenData = responseData;

  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token ?? refreshToken,
    expiresIn: tokenData.expires_in,
  };
}

/**
 * 检查 Token 是否即将过期（带缓冲时间）
 */
export function isTokenExpiring(expiresAt: Date, bufferSeconds = 300): boolean {
  const now = new Date();
  const threshold = new Date(now.getTime() + bufferSeconds * 1000);
  return expiresAt <= threshold;
}
