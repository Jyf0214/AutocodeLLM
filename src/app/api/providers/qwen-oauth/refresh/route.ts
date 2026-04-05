import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createDecipheriv, createCipheriv, randomBytes } from 'crypto';
import { refreshQwenToken } from '@/lib/auth/qwen/oauth';
import type { QwenOAuthRefreshResponse } from '@/lib/api/provider-types';

/**
 * POST /api/providers/qwen-oauth/refresh - 刷新 Token
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { providerId?: string };
    const { providerId } = body;

    if (!providerId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '缺少 providerId',
            code: 'MISSING_PROVIDER_ID',
          },
        } as QwenOAuthRefreshResponse,
        { status: 400 }
      );
    }

    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
    });

    if (!provider?.oauthRefreshToken) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '未找到有效的刷新凭证',
            code: 'NO_REFRESH_TOKEN',
          },
        } as QwenOAuthRefreshResponse,
        { status: 400 }
      );
    }

    const keyStr = process.env.ENCRYPTION_KEY ?? 'autocodellm-encryption-key-32b!';
    const key = Buffer.from(keyStr.padEnd(32).slice(0, 32));
    const parts = provider.oauthRefreshToken.split(':');
    const ivHex = parts[0];
    const encryptedData = parts[1];
    if (!ivHex || !encryptedData) {
      throw new Error('无效的加密数据格式');
    }
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    const result = await refreshQwenToken(decrypted);
    const expiresAt = new Date(Date.now() + result.expiresIn * 1000);

    const encryptToken = (token: string): string => {
      const newIv = randomBytes(16);
      const cipher = createCipheriv('aes-256-cbc', key, newIv);
      let encrypted = cipher.update(token, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return newIv.toString('hex') + ':' + encrypted;
    };

    await prisma.provider.update({
      where: { id: providerId },
      data: {
        oauthAccessToken: encryptToken(result.accessToken),
        oauthRefreshToken: result.refreshToken ? encryptToken(result.refreshToken) : provider.oauthRefreshToken,
        oauthExpiresAt: expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
        expiresAt: expiresAt.toISOString(),
      },
    } as QwenOAuthRefreshResponse);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json(
      {
        success: false,
        error: {
          message: errorMessage,
          code: 'OAUTH_REFRESH_FAILED',
        },
      } as QwenOAuthRefreshResponse,
      { status: 500 }
    );
  }
}
