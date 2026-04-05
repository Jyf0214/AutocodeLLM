import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { PRESET_PROVIDERS } from '@/lib/providers';
import type { AddPresetProviderResponse } from '@/lib/api/provider-types';

/**
 * POST /api/providers/preset - 从预置配置添加提供商
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { presetId?: string };
    const { presetId } = body;

    if (!presetId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '缺少 presetId',
            code: 'MISSING_PRESET_ID',
          },
        } as AddPresetProviderResponse,
        { status: 400 }
      );
    }

    const preset = PRESET_PROVIDERS.find((p) => p.id === presetId);

    if (!preset) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '预置提供商不存在',
            code: 'PRESET_NOT_FOUND',
          },
        } as AddPresetProviderResponse,
        { status: 404 }
      );
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
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '该提供商已添加',
            code: 'ALREADY_EXISTS',
          },
        } as AddPresetProviderResponse,
        { status: 409 }
      );
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

    return NextResponse.json(
      {
        success: true,
        data: {
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
      } as AddPresetProviderResponse,
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '添加预置提供商失败',
          code: 'ADD_PRESET_FAILED',
        },
      } as AddPresetProviderResponse,
      { status: 500 }
    );
  }
}
