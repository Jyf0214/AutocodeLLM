/**
 * 提供商管理 API
 * GET /api/providers - 获取所有提供商列表
 * POST /api/providers - 创建提供商
 * PUT /api/providers - 更新提供商
 * DELETE /api/providers - 删除提供商
 */

import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/log';
import { prisma } from '@/lib/db/prisma';
import {
  successResponse,
  errorResponse,
  handleError,
  maskValue,
} from '@/lib/api/response';
import { PRESET_PROVIDERS } from '@/lib/providers';
import { encryptValue } from '@/lib/providers/api-client';
import type {
  ProviderResponse,
  CreateProviderRequest,
  UpdateProviderRequest,
  TestProviderRequest,
  TestProviderResponse,
} from '@/lib/api/provider-types';

/**
 * GET /api/providers - 获取所有提供商列表（预置 + 自定义）
 */
export const GET = withApiLogging('GET providers', async function GET(): Promise<NextResponse>  {
  try {
    const providers = await prisma.provider.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const customData = providers.map((provider) => {
      try {
        return {
          id: provider.id,
          name: provider.name,
          baseUrl: provider.baseUrl,
          apiKey:
            provider.authType === 'oauth'
              ? 'oauth'
              : maskValue(provider.apiKey),
          databaseUrl: provider.databaseUrl,
          enabled: provider.enabled,
          providerType: provider.providerType,
          sdkType: provider.sdkType,
          authType: provider.authType,
          oauthAccessToken: provider.oauthAccessToken ? '****' : null,
          oauthRefreshToken: provider.oauthRefreshToken ? '****' : null,
          oauthExpiresAt: provider.oauthExpiresAt?.toISOString() ?? null,
          oauthClientId: provider.oauthClientId,
          oauthDeviceCode: provider.oauthDeviceCode,
          metadata: provider.metadata,
          createdAt: provider.createdAt.toISOString(),
          updatedAt: provider.updatedAt.toISOString(),
        };
      } catch (decryptError) {
        console.error(
          `[Provider] 解密 apiKey 失败 for provider ${provider.id}:`,
          decryptError,
        );
        return {
          id: provider.id,
          name: provider.name,
          baseUrl: provider.baseUrl,
          apiKey: '****',
          databaseUrl: provider.databaseUrl,
          enabled: provider.enabled,
          providerType: provider.providerType,
          sdkType: provider.sdkType,
          authType: provider.authType,
          oauthAccessToken: provider.oauthAccessToken ? '****' : null,
          oauthRefreshToken: provider.oauthRefreshToken ? '****' : null,
          oauthExpiresAt: provider.oauthExpiresAt?.toISOString() ?? null,
          oauthClientId: provider.oauthClientId,
          oauthDeviceCode: provider.oauthDeviceCode,
          metadata: provider.metadata,
          createdAt: provider.createdAt.toISOString(),
          updatedAt: provider.updatedAt.toISOString(),
        };
      }
    });

    // 合并预置提供商信息
    const presetWithStatus = PRESET_PROVIDERS.map((preset) => {
      const dbProvider = providers.find(
        (p) => p.name === preset.name || p.name === preset.nameEn,
      );
      return {
        ...preset,
        isAdded: !!dbProvider,
        dbId: dbProvider?.id,
      };
    });

    return successResponse({
      data: customData,
      presets: presetWithStatus,
    } as unknown as ProviderResponse);
  } catch (error) {
    return handleError(error, '获取提供商列表');
  }
});

/**
 * POST /api/providers - 创建提供商
 */
export const POST = withApiLogging('POST providers', async function POST(
  request: Request,
): Promise<NextResponse>  {
  try {
    const body = (await request.json()) as CreateProviderRequest;
    const {
      name,
      baseUrl,
      apiKey,
      databaseUrl,
      enabled,
      providerType,
      sdkType,
      authType,
      oauthAccessToken,
      oauthRefreshToken,
      oauthDeviceCode,
      oauthExpiresAt,
      metadata,
    } = body;

    const isOAuth = authType === 'oauth';

    // 验证必填字段
    if (!name || !baseUrl || (!apiKey && !isOAuth)) {
      return errorResponse(
        isOAuth ? '缺少必填字段：name, baseUrl' : '缺少必填字段：name, baseUrl, apiKey',
        'MISSING_FIELDS',
        400,
      );
    }

    // 检查名称是否已存在
    const existing = await prisma.provider.findUnique({
      where: { name },
    });

    if (existing) {
      return errorResponse('提供商名称已存在', 'DUPLICATE_KEY', 409);
    }

    const encryptedKey = isOAuth || !apiKey ? '' : encryptValue(apiKey);

    const newProvider = await prisma.provider.create({
      data: {
        name,
        baseUrl,
        apiKey: encryptedKey,
        databaseUrl: databaseUrl ?? null,
        enabled: enabled ?? true,
        providerType: providerType ?? 'custom',
        sdkType: sdkType ?? 'openai',
        authType: authType ?? 'apiKey',
        oauthAccessToken: oauthAccessToken
          ? encryptValue(oauthAccessToken)
          : null,
        oauthRefreshToken: oauthRefreshToken
          ? encryptValue(oauthRefreshToken)
          : null,
        oauthDeviceCode: oauthDeviceCode
          ? encryptValue(oauthDeviceCode)
          : null,
        oauthExpiresAt: oauthExpiresAt ? new Date(oauthExpiresAt) : null,
        metadata: metadata ?? null,
      },
    });

    return successResponse(
      {
        id: newProvider.id,
        name: newProvider.name,
        baseUrl: newProvider.baseUrl,
        apiKey:
          isOAuth || newProvider.apiKey === ''
            ? 'oauth'
            : maskValue(newProvider.apiKey),
        databaseUrl: newProvider.databaseUrl,
        enabled: newProvider.enabled,
        providerType: newProvider.providerType,
        sdkType: newProvider.sdkType,
        authType: newProvider.authType,
        oauthAccessToken: newProvider.oauthAccessToken ? '****' : null,
        oauthRefreshToken: newProvider.oauthRefreshToken ? '****' : null,
        oauthExpiresAt: newProvider.oauthExpiresAt?.toISOString() ?? null,
        oauthClientId: newProvider.oauthClientId,
        oauthDeviceCode: newProvider.oauthDeviceCode,
        metadata: newProvider.metadata,
        createdAt: newProvider.createdAt.toISOString(),
        updatedAt: newProvider.updatedAt.toISOString(),
      },
      201,
    );
  } catch (error) {
    return handleError(error, '创建提供商');
  }
});

/**
 * PUT /api/providers - 更新提供商
 */
export const PUT = withApiLogging('PUT providers', async function PUT(
  request: Request,
): Promise<NextResponse>  {
  try {
    const body = (await request.json()) as UpdateProviderRequest;
    const {
      id,
      name,
      baseUrl,
      apiKey,
      databaseUrl,
      enabled,
      authType,
      sdkType,
      oauthAccessToken,
      oauthRefreshToken,
      oauthDeviceCode,
      oauthExpiresAt,
      metadata,
    } = body;

    if (!id) {
      return errorResponse('缺少 ID 字段', 'MISSING_ID', 400);
    }

    const existing = await prisma.provider.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse('提供商不存在', 'NOT_FOUND', 404);
    }

    // 检查名称是否重复
    if (name && name !== existing.name) {
      const duplicateCheck = await prisma.provider.findUnique({
        where: { name },
      });
      if (duplicateCheck && duplicateCheck.id !== id) {
        return errorResponse('提供商名称已存在', 'DUPLICATE_KEY', 409);
      }
    }

    const updatedProvider = await prisma.provider.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(baseUrl !== undefined && { baseUrl }),
        ...(apiKey !== undefined && { apiKey: encryptValue(apiKey) }),
        ...(databaseUrl !== undefined && { databaseUrl }),
        ...(enabled !== undefined && { enabled }),
        ...(authType !== undefined && { authType }),
        ...(sdkType !== undefined && { sdkType }),
        ...(oauthAccessToken !== undefined && {
          oauthAccessToken: oauthAccessToken
            ? encryptValue(oauthAccessToken)
            : undefined,
        }),
        ...(oauthRefreshToken !== undefined && {
          oauthRefreshToken: oauthRefreshToken
            ? encryptValue(oauthRefreshToken)
            : undefined,
        }),
        ...(oauthDeviceCode !== undefined && {
          oauthDeviceCode: oauthDeviceCode
            ? encryptValue(oauthDeviceCode)
            : undefined,
        }),
        ...(oauthExpiresAt !== undefined && {
          oauthExpiresAt: oauthExpiresAt ? new Date(oauthExpiresAt) : undefined,
        }),
        ...(metadata !== undefined && { metadata }),
      },
    });

    return successResponse({
      id: updatedProvider.id,
      name: updatedProvider.name,
      baseUrl: updatedProvider.baseUrl,
      apiKey: maskValue(updatedProvider.apiKey),
      databaseUrl: updatedProvider.databaseUrl,
      enabled: updatedProvider.enabled,
      createdAt: updatedProvider.createdAt.toISOString(),
      updatedAt: updatedProvider.updatedAt.toISOString(),
    });
  } catch (error) {
    return handleError(error, '更新提供商');
  }
});

/**
 * DELETE /api/providers - 删除提供商
 */
export const DELETE = withApiLogging('DELETE providers', async function DELETE(
  request: Request,
): Promise<NextResponse>  {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('缺少 ID 参数', 'MISSING_ID', 400);
    }

    const existing = await prisma.provider.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse('提供商不存在', 'NOT_FOUND', 404);
    }

    await prisma.provider.delete({
      where: { id },
    });

    return successResponse({ id });
  } catch (error) {
    return handleError(error, '删除提供商');
  }
});

/**
 * POST /api/providers/test - 测试 API Key 连通性
 */
export async function testProvider(
  request: Request,
): Promise<NextResponse<TestProviderResponse>> {
  try {
    const body = (await request.json()) as TestProviderRequest;
    const { baseUrl, apiKey } = body;

    if (!baseUrl || !apiKey) {
      return errorResponse('缺少 baseUrl 或 apiKey', 'MISSING_FIELDS', 400);
    }

    // 确保 baseUrl 包含协议前缀
    let normalizedBaseUrl = baseUrl;
    if (
      !normalizedBaseUrl.startsWith('http://') &&
      !normalizedBaseUrl.startsWith('https://')
    ) {
      normalizedBaseUrl = `https://${normalizedBaseUrl}`;
    }

    const startTime = Date.now();

    try {
      const url = normalizedBaseUrl.endsWith('/models')
        ? normalizedBaseUrl
        : normalizedBaseUrl.endsWith('/')
          ? `${normalizedBaseUrl}models`
          : `${normalizedBaseUrl}/models`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      });

      const latency = Date.now() - startTime;

      if (response.ok) {
        return successResponse({
          connected: true,
          latency,
          message: `连接成功，响应时间 ${String(latency)}ms`,
        });
      }

      const errorText = await response.text();
      return successResponse({
        connected: false,
        latency,
        message: `连接失败：HTTP ${String(response.status)} - ${errorText.substring(0, 100)}`,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      return successResponse({
        connected: false,
        message: `连接超时或失败：${errorMessage}`,
      });
    }
  } catch (error) {
    return handleError(error, '测试请求');
  }
}
