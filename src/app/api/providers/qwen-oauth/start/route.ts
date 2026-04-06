import { NextResponse } from 'next/server';
import { startQwenDeviceFlow } from '@/lib/auth/qwen/oauth';
import type { QwenOAuthStartResponse } from '@/lib/api/provider-types';

/**
 * POST /api/providers/qwen-oauth/start - 启动 Qwen Device Flow
 */
export async function POST() {
  try {
    const result = await startQwenDeviceFlow();

    return NextResponse.json({
      success: true,
      data: {
        deviceCode: result.deviceCode,
        userCode: result.userCode,
        verificationUri: result.verificationUri,
        verificationUriComplete: result.verificationUriComplete,
        expiresIn: result.expiresIn,
        interval: result.interval,
        codeVerifier: result.codeVerifier,
      },
    } as QwenOAuthStartResponse);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';

    console.error('[Qwen OAuth] 启动失败:', errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: errorMessage,
          code: 'OAUTH_START_FAILED',
        },
      } as QwenOAuthStartResponse,
      { status: 500 }
    );
  }
}
