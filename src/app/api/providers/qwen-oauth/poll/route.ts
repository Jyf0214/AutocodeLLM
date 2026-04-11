import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { pollQwenToken } from '@/lib/auth/qwen/oauth';
import { saveQwenOAuthCredentials } from '@/lib/providers/qwen-oauth';
import type { QwenOAuthPollResponse } from '@/lib/api/provider-types';

/**
 * POST /api/providers/qwen-oauth/poll - 轮询获取 Token
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { deviceCode?: string; codeVerifier?: string };
    const { deviceCode, codeVerifier } = body;

    if (!deviceCode) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '缺少 deviceCode',
            code: 'MISSING_DEVICE_CODE',
          },
        } as QwenOAuthPollResponse,
        { status: 400 }
      );
    }

    if (!codeVerifier) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '缺少 codeVerifier',
            code: 'MISSING_CODE_VERIFIER',
          },
        } as QwenOAuthPollResponse,
        { status: 400 }
      );
    }

    const result = await pollQwenToken(deviceCode, codeVerifier);

    const providerName = '通义千问';
    // Qwen Code 官方实际使用的 API 端点（OAuth 认证后）
    // 参考：https://portal.qwen.ai/v1/chat/completions
    const QWEN_OAUTH_API_BASE_URL = 'https://portal.qwen.ai/v1';

    let provider = await prisma.provider.findUnique({
      where: { name: providerName },
    });

    provider ??= await prisma.provider.create({
      data: {
        name: providerName,
        baseUrl: QWEN_OAUTH_API_BASE_URL,
        apiKey: '',
        enabled: true,
        providerType: 'preset',
        sdkType: 'openai',
        authType: 'oauth',
        oauthDeviceCode: deviceCode,
      },
    });

    await saveQwenOAuthCredentials(provider.id, result);

    return NextResponse.json({
      success: true,
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        resourceUrl: result.resourceUrl,
        expiresIn: result.expiresIn,
        providerId: provider.id,
      },
    } as QwenOAuthPollResponse);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';

    if (errorMessage === 'AUTHORIZATION_PENDING') {
      return NextResponse.json({
        success: false,
        error: {
          message: '等待用户授权',
          code: 'AUTHORIZATION_PENDING',
        },
      } as QwenOAuthPollResponse);
    }

    if (errorMessage === 'SLOW_DOWN') {
      return NextResponse.json({
        success: false,
        error: {
          message: '请求过于频繁，请降低轮询频率',
          code: 'SLOW_DOWN',
        },
      } as QwenOAuthPollResponse);
    }

    if (errorMessage === 'DEVICE_CODE_EXPIRED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Device Code 已过期，请重新开始认证',
            code: 'DEVICE_CODE_EXPIRED',
          },
        } as QwenOAuthPollResponse,
        { status: 401 }
      );
    }

    if (errorMessage === 'RATE_LIMITED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '请求过于频繁，请稍后重试',
            code: 'RATE_LIMITED',
          },
        } as QwenOAuthPollResponse,
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          message: errorMessage,
          code: 'OAUTH_POLL_FAILED',
        },
      } as QwenOAuthPollResponse,
      { status: 500 }
    );
  }
}
