/**
 * Qwen OAuth 认证模块
 * 实现 Device Authorization Grant (RFC 8628) 流程
 * 包含 Device Code 获取、Token 轮询、Token 刷新等功能
 */

const QWEN_OAUTH_CONFIG = {
  clientId: 'f0304373b74a44d2b584a3fb70ca9e56',
  deviceCodeUrl: 'https://chat.qwen.ai/api/v1/oauth2/device/code',
  tokenUrl: 'https://chat.qwen.ai/api/v1/oauth2/token',
  scope: 'openid profile email model.completion',
  defaultApiUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
};

/**
 * 启动 Device Flow 认证
 */
export async function startQwenDeviceFlow(): Promise<{
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  verificationUriComplete: string;
  expiresIn: number;
  interval: number;
}> {
  const response = await fetch(QWEN_OAUTH_CONFIG.deviceCodeUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: QWEN_OAUTH_CONFIG.clientId,
      scope: QWEN_OAUTH_CONFIG.scope,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error('启动 Device Flow 失败：HTTP ' + String(response.status) + ' - ' + errorText);
  }

  const data = (await response.json()) as Record<string, unknown>;

  return {
    deviceCode: data.device_code as string,
    userCode: data.user_code as string,
    verificationUri: data.verification_uri as string,
    verificationUriComplete: data.verification_uri_complete ? (data.verification_uri_complete as string) : '',
    expiresIn: data.expires_in ? (data.expires_in as number) : 1800,
    interval: data.interval ? (data.interval as number) : 5,
  };
}

/**
 * 轮询获取 Token
 */
export async function pollQwenToken(deviceCode: string): Promise<{
  accessToken: string;
  refreshToken: string;
  resourceUrl: string;
  expiresIn: number;
}> {
  const response = await fetch(QWEN_OAUTH_CONFIG.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      device_code: deviceCode,
      client_id: QWEN_OAUTH_CONFIG.clientId,
    }),
  });

  const data = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    const error = data.error as string;
    if (error === 'authorization_pending') throw new Error('AUTHORIZATION_PENDING');
    if (error === 'slow_down') throw new Error('SLOW_DOWN');
    const errorDesc = data.error_description ? (data.error_description as string) : '未知错误';
    throw new Error('获取 Token 失败：' + error + ' - ' + errorDesc);
  }

  return {
    accessToken: data.access_token as string,
    refreshToken: data.refresh_token ? (data.refresh_token as string) : '',
    resourceUrl: data.resource_url ? (data.resource_url as string) : QWEN_OAUTH_CONFIG.defaultApiUrl,
    expiresIn: data.expires_in ? (data.expires_in as number) : 3600,
  };
}

/**
 * 刷新 Token
 */
export async function refreshQwenToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const response = await fetch(QWEN_OAUTH_CONFIG.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: QWEN_OAUTH_CONFIG.clientId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error('刷新 Token 失败：HTTP ' + String(response.status) + ' - ' + errorText);
  }

  const data = (await response.json()) as Record<string, unknown>;

  return {
    accessToken: data.access_token as string,
    refreshToken: data.refresh_token ? (data.refresh_token as string) : refreshToken,
    expiresIn: data.expires_in ? (data.expires_in as number) : 3600,
  };
}

/**
 * 检查 Token 是否即将过期
 */
export function isTokenExpiring(expiresAt: Date, bufferSeconds = 60): boolean {
  const now = new Date();
  const threshold = new Date(now.getTime() + bufferSeconds * 1000);
  return expiresAt <= threshold;
}
