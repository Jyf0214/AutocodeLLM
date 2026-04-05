import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { prisma } from '@/lib/db/prisma';

const QWEN_OAUTH_CONFIG = {
  clientId: 'f0304373b74a44d2b584a3fb70ca9e56',
  deviceCodeUrl: 'https://chat.qwen.ai/api/v1/oauth2/device/code',
  tokenUrl: 'https://chat.qwen.ai/api/v1/oauth2/token',
  scope: 'openid profile email model.completion',
  defaultApiUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
};

/**
 * AES-256-CBC 加密 Token
 */
function encryptToken(token: string): string {
  const keyStr = process.env.ENCRYPTION_KEY ?? 'autocodellm-encryption-key-32b!';
  const key = Buffer.from(keyStr.padEnd(32).slice(0, 32));
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * AES-256-CBC 解密 Token
 */
function decryptToken(encrypted: string): string {
  const keyStr = process.env.ENCRYPTION_KEY ?? 'autocodellm-encryption-key-32b!';
  const key = Buffer.from(keyStr.padEnd(32).slice(0, 32));
  const parts = encrypted.split(':');
  const ivHex = parts[0];
  const encryptedData = parts[1];
  if (!ivHex || !encryptedData) {
    throw new Error('无效的加密数据格式');
  }
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * 检查 Token 是否即将过期
 * @param expiresAt - Token 过期时间
 * @param bufferSeconds - 提前多少秒视为过期（默认 60 秒）
 */
function isTokenExpiring(expiresAt: Date, bufferSeconds = 60): boolean {
  const now = new Date();
  const threshold = new Date(now.getTime() + bufferSeconds * 1000);
  return expiresAt <= threshold;
}

/**
 * 启动 Device Flow 认证
 * 返回 device_code, user_code, verification_uri 等信息
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
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: QWEN_OAUTH_CONFIG.clientId,
      scope: QWEN_OAUTH_CONFIG.scope,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`启动 Device Flow 失败：HTTP ${String(response.status)} - ${errorText}`);
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
 * 处理 authorization_pending 和 slow_down 错误
 */
export async function pollQwenToken(
  deviceCode: string,
  codeVerifier?: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  resourceUrl: string;
  expiresIn: number;
}> {
  const body: Record<string, string> = {
    grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
    device_code: deviceCode,
    client_id: QWEN_OAUTH_CONFIG.clientId,
  };

  if (codeVerifier) {
    body.code_verifier = codeVerifier;
  }

  const response = await fetch(QWEN_OAUTH_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    const error = data.error as string;

    if (error === 'authorization_pending') {
      throw new Error('AUTHORIZATION_PENDING');
    }

    if (error === 'slow_down') {
      throw new Error('SLOW_DOWN');
    }

    const errorDesc = data.error_description ? (data.error_description as string) : '未知错误';
    throw new Error(`获取 Token 失败：${error} - ${errorDesc}`);
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
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: QWEN_OAUTH_CONFIG.clientId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`刷新 Token 失败：HTTP ${String(response.status)} - ${errorText}`);
  }

  const data = (await response.json()) as Record<string, unknown>;

  return {
    accessToken: data.access_token as string,
    refreshToken: data.refresh_token ? (data.refresh_token as string) : refreshToken,
    expiresIn: data.expires_in ? (data.expires_in as number) : 3600,
  };
}

/**
 * 保存 OAuth 凭证到数据库
 */
export async function saveQwenOAuthCredentials(
  providerId: string,
  credentials: {
    accessToken: string;
    refreshToken: string;
    resourceUrl: string;
    expiresIn: number;
  }
): Promise<void> {
  const expiresAt = new Date(Date.now() + credentials.expiresIn * 1000);

  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
  });

  const existingMetadata: string = provider?.metadata ?? '{}';
  let parsedMetadata: Record<string, unknown>;
  try {
    parsedMetadata = JSON.parse(existingMetadata) as Record<string, unknown>;
  } catch {
    parsedMetadata = {};
  }

  await prisma.provider.update({
    where: { id: providerId },
    data: {
      oauthAccessToken: encryptToken(credentials.accessToken),
      oauthRefreshToken: credentials.refreshToken ? encryptToken(credentials.refreshToken) : null,
      oauthExpiresAt: expiresAt,
      metadata: JSON.stringify({
        ...parsedMetadata,
        resourceUrl: credentials.resourceUrl,
      }),
    },
  });
}

/**
 * 获取有效的 Token（自动刷新）
 */
export async function getValidQwenToken(providerId: string): Promise<string> {
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
  });

  if (!provider) {
    throw new Error('提供商不存在');
  }

  const accessToken: string | null = provider.oauthAccessToken;
  const expiresAt: Date | null = provider.oauthExpiresAt;
  const refreshToken: string | null = provider.oauthRefreshToken;

  if (!accessToken || !expiresAt) {
    throw new Error('未找到 OAuth 凭证，请先完成认证');
  }

  if (!isTokenExpiring(expiresAt)) {
    return decryptToken(accessToken);
  }

  if (!refreshToken) {
    throw new Error('Token 已过期且无刷新凭证，请重新认证');
  }

  const decryptedRefreshToken = decryptToken(refreshToken);

  try {
    const refreshed = await refreshQwenToken(decryptedRefreshToken);

    const newExpiresAt = new Date(Date.now() + refreshed.expiresIn * 1000);

    await prisma.provider.update({
      where: { id: providerId },
      data: {
        oauthAccessToken: encryptToken(refreshed.accessToken),
        oauthRefreshToken: refreshed.refreshToken ? encryptToken(refreshed.refreshToken) : null,
        oauthExpiresAt: newExpiresAt,
      },
    });

    return refreshed.accessToken;
  } catch {
    throw new Error('Token 刷新失败，请重新认证');
  }
}

export { isTokenExpiring };
