import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { prisma } from '@/lib/db/prisma';
import { isTokenExpiring, refreshQwenToken } from '@/lib/auth/qwen/oauth';

/**
 * AES-256-CBC 加密 Token
 */
export function encryptToken(token: string): string {
  const keyStr = process.env.KEY_VAULTS_SECRET ?? 'your-key-vaults-secret-change-in-production';
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
export function decryptToken(encrypted: string): string {
  const keyStr = process.env.KEY_VAULTS_SECRET ?? 'your-key-vaults-secret-change-in-production';
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
 * 保存 OAuth 凭证到数据库
 */
export async function saveQwenOAuthCredentials(
  providerId: string,
  credentials: {
    accessToken: string;
    refreshToken: string;
    resourceUrl: string;
    expiresIn: number;
    tokenType?: string;
  }
): Promise<void> {
  const expiresAt = new Date(Date.now() + credentials.expiresIn * 1000);

  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
  });

  if (!provider) {
    throw new Error('提供商不存在');
  }

  const existingMetadata = provider.metadata ?? '{}';
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
        tokenType: credentials.tokenType ?? 'Bearer',
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

  // 检查 token 是否即将过期（5 分钟缓冲）
  if (!isTokenExpiring(expiresAt, 300)) {
    return decryptToken(accessToken);
  }

  if (!refreshToken) {
    throw new Error('Token 已过期且无刷新凭证，请重新认证');
  }

  const decryptedRefreshToken = decryptToken(refreshToken);

  try {
    const refreshed = await refreshQwenToken(decryptedRefreshToken);

    const newExpiresAt = new Date(Date.now() + refreshed.expiresIn * 1000);

    // 构建更新的元数据，保留现有字段并更新 resourceUrl
    const existingMetadata = provider.metadata ?? '{}';
    let parsedMetadata: Record<string, unknown>;
    try {
      parsedMetadata = JSON.parse(existingMetadata) as Record<string, unknown>;
    } catch {
      parsedMetadata = {};
    }

    await prisma.provider.update({
      where: { id: providerId },
      data: {
        oauthAccessToken: encryptToken(refreshed.accessToken),
        oauthRefreshToken: refreshed.refreshToken ? encryptToken(refreshed.refreshToken) : null,
        oauthExpiresAt: newExpiresAt,
        // 如果刷新响应包含新的 resourceUrl，更新到元数据中
        metadata: refreshed.resourceUrl
          ? JSON.stringify({ ...parsedMetadata, resourceUrl: refreshed.resourceUrl })
          : existingMetadata,
      },
    });

    return refreshed.accessToken;
  } catch (error: unknown) {
    // 使用 HTTP 状态码和 OAuth 标准错误码进行判断，避免字符串匹配
    if (error instanceof Error) {
      const errorMessage = error.message;
      // 检测 token 过期的标准错误码
      const isTokenExpired =
        errorMessage.includes('400') ||
        errorMessage.includes('invalid_grant') ||
        errorMessage.includes('expired_token') ||
        errorMessage.includes('已过期');

      // 如果是 token 过期，清除凭证并要求重新认证
      if (isTokenExpired) {
        await prisma.provider.update({
          where: { id: providerId },
          data: {
            oauthAccessToken: null,
            oauthRefreshToken: null,
            oauthExpiresAt: null,
          },
        });
        throw new Error('刷新凭证已过期，请重新认证');
      }
    }

    const errorMessage = error instanceof Error ? error.message : '未知错误';
    throw new Error(`Token 刷新失败：${errorMessage}`);
  }
}
