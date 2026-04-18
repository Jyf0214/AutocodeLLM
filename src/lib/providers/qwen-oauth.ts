/**
 * Qwen OAuth 认证工具
 * 提供 Token 加密、解密和刷新功能
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { prisma } from '@/lib/db/prisma';
import { isTokenExpiring, refreshQwenToken } from '@/lib/auth/qwen/oauth';

/**
 * AES-256-CBC 加密 Token
 * @param token 要加密的 Token
 * @returns 加密后的 Token（格式：iv:encrypted）
 */
export function encryptToken(token: string): string {
  const keyStr =
    process.env.KEY_VAULTS_SECRET ?? 'your-key-vaults-secret-change-in-production';
  const key = Buffer.from(keyStr.padEnd(32).slice(0, 32));
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * AES-256-CBC 加密（通用值）
 * @param value 要加密的值
 * @returns 加密后的值
 */
export function encryptValue(value: string): string {
  const keyStr =
    process.env.KEY_VAULTS_SECRET ?? 'your-key-vaults-secret-change-in-production';
  const key = Buffer.from(keyStr.padEnd(32).slice(0, 32));
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(value, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * AES-256-CBC 解密（通用值）
 * @param encrypted 加密的值
 * @returns 解密后的值
 */
export function decryptValue(encrypted: string): string {
  const keyStr =
    process.env.KEY_VAULTS_SECRET ?? 'your-key-vaults-secret-change-in-production';
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
 * AES-256-CBC 解密 Token
 * @param encrypted 加密的 Token
 * @returns 解密后的 Token
 */
export function decryptToken(encrypted: string): string {
  const keyStr =
    process.env.KEY_VAULTS_SECRET ?? 'your-key-vaults-secret-change-in-production';
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
 * 脱敏显示值
 * @param value 要脱敏的值
 * @returns 脱敏后的值
 */
export function maskValue(value: string): string {
  if (value.length <= 4) return '****';
  return value.substring(0, 4) + '****' + value.substring(value.length - 4);
}

/**
 * 保存 OAuth 凭证到数据库
 * @param providerId 提供商 ID
 * @param credentials OAuth 凭证
 */
export async function saveQwenOAuthCredentials(
  providerId: string,
  credentials: {
    accessToken: string;
    refreshToken: string;
    resourceUrl: string;
    expiresIn: number;
    tokenType?: string;
  },
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
      oauthRefreshToken: credentials.refreshToken
        ? encryptToken(credentials.refreshToken)
        : null,
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
 * @param providerId 提供商 ID
 * @returns 有效的 Token
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
        oauthRefreshToken: refreshed.refreshToken
          ? encryptToken(refreshed.refreshToken)
          : provider.oauthRefreshToken,
        oauthExpiresAt: newExpiresAt,
        metadata: refreshed.resourceUrl
          ? JSON.stringify({
              ...parsedMetadata,
              resourceUrl: refreshed.resourceUrl,
            })
          : existingMetadata,
      },
    });

    return refreshed.accessToken;
  } catch (error: unknown) {
    if (error instanceof Error) {
      const errorMessage = error.message;
      const isTokenExpired =
        errorMessage.includes('400') ||
        errorMessage.includes('invalid_grant') ||
        errorMessage.includes('expired_token') ||
        errorMessage.includes('已过期');

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
