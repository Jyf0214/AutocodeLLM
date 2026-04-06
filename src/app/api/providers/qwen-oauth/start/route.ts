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

    // 检测是否是阿里云 WAF 拦截
    let userMessage = errorMessage;
    if (errorMessage.includes('405') && errorMessage.includes('aliyun')) {
      userMessage = '启动 OAuth 失败：阿里云 WAF 拦截了服务器请求。请在阿里云控制台将服务器 IP 加入白名单，或使用代理服务器。';
    } else if (errorMessage.includes('405')) {
      userMessage = '启动 OAuth 失败：HTTP 405 Method Not Allowed。这通常是由于阿里云 WAF 拦截了请求。';
    }

    console.error('[Qwen OAuth] 启动失败:', errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: userMessage,
          code: 'OAUTH_START_FAILED',
        },
      } as QwenOAuthStartResponse,
      { status: 500 }
    );
  }
}
