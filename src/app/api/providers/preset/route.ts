/**
 * 添加预置提供商 API
 * POST /api/providers/preset - 从预置配置添加提供商
 */

import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/log';
import { prisma } from '@/lib/db/prisma';
import {
  successResponse,
  errorResponse,
  handleError,
} from '@/lib/api/response';
import { PRESET_PROVIDERS } from '@/lib/providers';
import type { AddPresetProviderResponse } from '@/lib/api/provider-types';

/**
 * POST /api/providers/preset - 从预置配置添加提供商
 */
export const POST = withApiLogging('POST providers/preset', async function POST(
  request: Request,
): Promise<NextResponse<AddPresetProviderResponse>>  {
  try {
    const body = (await request.json()) as { presetId?: string };
    const { presetId } = body;

    if (!presetId) {
      return errorResponse('缺少 presetId', 'MISSING_PRESET_ID', 400);
    }

    const preset = PRESET_PROVIDERS.find((p) => p.id === presetId);

    if (!preset) {
      return errorResponse('预置提供商不存在', 'PRESET_NOT_FOUND', 404);
    }

    const existing = await prisma.provider.findFirst({
      where: {
        OR: [
          { name: preset.name },
          ...(preset.nameEn ? [{ name: preset.nameEn }] : []),
        ],
      },
    });

    if (existing) {
      return errorResponse('该提供商已添加', 'ALREADY_EXISTS', 409);
    }

    const newProvider = await prisma.provider.create({
      data: {
        name: preset.name,
        baseUrl: preset.baseUrl ?? '',
        apiKey: '',
        enabled: true,
        providerType: 'preset',
        sdkType: preset.sdkType,
        authType: preset.authType,
        metadata: JSON.stringify({
          checkModel: preset.checkModel,
          openaiCompatible: preset.openaiCompatible,
          apiKeyUrl: preset.apiKeyUrl,
        }),
      },
    });

    return successResponse(
      {
        id: newProvider.id,
        name: newProvider.name,
        baseUrl: newProvider.baseUrl,
        apiKey: '',
        databaseUrl: newProvider.databaseUrl,
        enabled: newProvider.enabled,
        providerType: newProvider.providerType,
        sdkType: newProvider.sdkType,
        authType: newProvider.authType,
        oauthAccessToken: null,
        oauthRefreshToken: null,
        oauthExpiresAt: null,
        oauthClientId: newProvider.oauthClientId,
        oauthDeviceCode: newProvider.oauthDeviceCode,
        metadata: newProvider.metadata,
        createdAt: newProvider.createdAt.toISOString(),
        updatedAt: newProvider.updatedAt.toISOString(),
      },
      201,
    );
  } catch (error) {
    return handleError(error, '添加预置提供商');
  }
});
