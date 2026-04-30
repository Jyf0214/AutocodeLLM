/**
 * Qwen OAuth 启动认证 API
 * POST /api/providers/qwen-oauth/start - 启动 Device Flow
 */

import { NextResponse } from 'next/server';
import { successResponse, handleError } from '@/lib/api/response';
import { startQwenDeviceFlow } from '@/lib/auth/qwen/oauth';
import type { QwenOAuthStartResponse } from '@/lib/api/provider-types';

/**
 * POST /api/providers/qwen-oauth/start - 启动 Qwen Device Flow
 */
export async function POST(): Promise<NextResponse<QwenOAuthStartResponse>> {
  try {
    const result = await startQwenDeviceFlow();

    return successResponse({
      deviceCode: result.deviceCode,
      userCode: result.userCode,
      verificationUri: result.verificationUri,
      verificationUriComplete: result.verificationUriComplete,
      authorizationUrl: result.authorizationUrl,
      expiresIn: result.expiresIn,
      interval: result.interval,
      codeVerifier: result.codeVerifier,
    });
  } catch (error: unknown) {
    return handleError(error, 'Qwen OAuth 启动');
  }
}
