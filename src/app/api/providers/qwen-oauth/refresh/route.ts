/**
 * Qwen OAuth 刷新 Token API
 * POST /api/providers/qwen-oauth/refresh - 刷新 Token
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import {
  successResponse,
  errorResponse,
  handleError,
} from '@/lib/api/response';
import { encryptToken } from '@/lib/providers/qwen-oauth';
import { refreshQwenToken } from '@/lib/auth/qwen/oauth';
import type { QwenOAuthRefreshResponse } from '@/lib/api/provider-types';

/**
 * POST /api/providers/qwen-oauth/refresh - 刷新 Token
 */
export async function POST(
  request: Request,
): Promise<NextResponse<QwenOAuthRefreshResponse>> {
  try {
    const body = (await request.json()) as { providerId?: string };
    const { providerId } = body;

    if (!providerId) {
      return errorResponse('缺少 providerId', 'MISSING_PROVIDER_ID', 400);
    }

    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
    });

    if (!provider?.oauthRefreshToken) {
      return errorResponse('未找到有效的刷新凭证', 'NO_REFRESH_TOKEN', 400);
    }

    const decryptedRefreshToken = encryptToken(provider.oauthRefreshToken);
    const result = await refreshQwenToken(decryptedRefreshToken);
    const expiresAt = new Date(Date.now() + result.expiresIn * 1000);

    await prisma.provider.update({
      where: { id: providerId },
      data: {
        oauthAccessToken: encryptToken(result.accessToken),
        oauthRefreshToken: result.refreshToken
          ? encryptToken(result.refreshToken)
          : provider.oauthRefreshToken,
        oauthExpiresAt: expiresAt,
      },
    });

    return successResponse({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error: unknown) {
    return handleError(error, 'Qwen OAuth 刷新');
  }
}
