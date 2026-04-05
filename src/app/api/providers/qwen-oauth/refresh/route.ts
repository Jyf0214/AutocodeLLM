import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { encryptToken, decryptToken } from '@/lib/providers/qwen-oauth';
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

    const decryptedRefreshToken = decryptToken(provider.oauthRefreshToken);

    const result = await refreshQwenToken(decryptedRefreshToken);
    const expiresAt = new Date(Date.now() + result.expiresIn * 1000);

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
