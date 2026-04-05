import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { PRESET_PROVIDERS } from '@/lib/providers';
import {
  startQwenDeviceFlow,
  pollQwenToken,
  refreshQwenToken,
  saveQwenOAuthCredentials,
} from '@/lib/providers/qwen-oauth';
import type {
  ProviderResponse,
  CreateProviderRequest,
  UpdateProviderRequest,
  TestProviderRequest,
  TestProviderResponse,
  QwenOAuthStartResponse,
  QwenOAuthPollResponse,
  QwenOAuthRefreshResponse,
  AddPresetProviderResponse,
} from '@/lib/api/provider-types';

/**
 * AES-256-CBC 加密 API Key
 */
function encryptApiKey(apiKey: string): string {
  const keyStr = process.env.ENCRYPTION_KEY ?? 'autocodellm-encryption-key-32b!';
  const key = Buffer.from(keyStr.padEnd(32).slice(0, 32));
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * AES-256-CBC 解密 API Key
 */
function decryptApiKey(encrypted: string): string {
  const keyStr = process.env.ENCRYPTION_KEY ?? 'autocodellm-encryption-key-32b!';
  const key = Buffer.from(keyStr.padEnd(32).slice(0, 32));
  const parts = encrypted.split(':');
  const ivHex = parts[0];
  const encryptedData = parts[1];
  if (!ivHex || !encryptedData) {
    throw new Error('无效的加密数据格式');
  }
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * 脱敏显示 API Key
 */
function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 4) return '****';
  return apiKey.substring(0, 4) + '****' + apiKey.substring(apiKey.length - 4);
}

/**
 * GET /api/providers - 获取所有提供商列表（预置 + 自定义）
 */
export async function GET() {
  try {
    const providers = await prisma.provider.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const customData = providers.map((provider) => ({
      id: provider.id,
      name: provider.name,
      baseUrl: provider.baseUrl,
      apiKey: provider.authType === 'oauth' ? 'oauth' : maskApiKey(decryptApiKey(provider.apiKey)),
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
    }));

    // 合并预置提供商信息
    const presetWithStatus = PRESET_PROVIDERS.map((preset) => {
      const dbProvider = providers.find((p) => p.name === preset.name || p.name === preset.nameEn);
      return {
        ...preset,
        isAdded: !!dbProvider,
        dbId: dbProvider?.id,
      };
    });

    return NextResponse.json({
      success: true,
      data: customData,
      presets: presetWithStatus,
    } as ProviderResponse & { presets: typeof presetWithStatus });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '获取提供商列表失败',
          code: 'FETCH_FAILED',
        },
      } as ProviderResponse,
      { status: 500 }
    );
  }
}

/**
 * POST /api/providers - 创建提供商（支持 API Key 和 OAuth 类型）
 */
async function createProvider(request: Request) {
  try {
    const body = (await request.json()) as CreateProviderRequest & {
      providerType?: string;
      sdkType?: string;
      authType?: string;
    };
    const { name, baseUrl, apiKey, databaseUrl, enabled, providerType, sdkType, authType } = body;

    // OAuth 类型不需要 apiKey
    const isOAuth = authType === 'oauth';

    if (!name || !baseUrl || (!apiKey && !isOAuth)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: isOAuth ? '缺少必填字段：name, baseUrl' : '缺少必填字段：name, baseUrl, apiKey',
            code: 'MISSING_FIELDS',
          },
        } as ProviderResponse,
        { status: 400 }
      );
    }

    const existing = await prisma.provider.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '提供商名称已存在',
            code: 'DUPLICATE_KEY',
          },
        } as ProviderResponse,
        { status: 409 }
      );
    }

    const newProvider = await prisma.provider.create({
      data: {
        name,
        baseUrl,
        apiKey: isOAuth ? '' : encryptApiKey(apiKey),
        databaseUrl: databaseUrl ?? null,
        enabled: enabled ?? true,
        providerType: providerType ?? 'custom',
        sdkType: sdkType ?? 'openai',
        authType: authType ?? 'apiKey',
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newProvider.id,
          name: newProvider.name,
          baseUrl: newProvider.baseUrl,
          apiKey: isOAuth ? 'oauth' : maskApiKey(decryptApiKey(newProvider.apiKey)),
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
      } as ProviderResponse,
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '创建提供商失败',
          code: 'CREATE_FAILED',
        },
      } as ProviderResponse,
      { status: 500 }
    );
  }
}

/**
 * PUT /api/providers - 更新提供商
 */
export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as UpdateProviderRequest;
    const { id, name, baseUrl, apiKey, databaseUrl, enabled } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '缺少 ID 字段',
            code: 'MISSING_ID',
          },
        } as ProviderResponse,
        { status: 400 }
      );
    }

    const existing = await prisma.provider.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '提供商不存在',
            code: 'NOT_FOUND',
          },
        } as ProviderResponse,
        { status: 404 }
      );
    }

    if (name && name !== existing.name) {
      const duplicateCheck = await prisma.provider.findUnique({
        where: { name },
      });

      if (duplicateCheck && duplicateCheck.id !== id) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: '提供商名称已存在',
              code: 'DUPLICATE_KEY',
            },
          } as ProviderResponse,
          { status: 409 }
        );
      }
    }

    const updatedProvider = await prisma.provider.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(baseUrl !== undefined && { baseUrl }),
        ...(apiKey !== undefined && { apiKey: encryptApiKey(apiKey) }),
        ...(databaseUrl !== undefined && { databaseUrl }),
        ...(enabled !== undefined && { enabled }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedProvider.id,
        name: updatedProvider.name,
        baseUrl: updatedProvider.baseUrl,
        apiKey: maskApiKey(decryptApiKey(updatedProvider.apiKey)),
        databaseUrl: updatedProvider.databaseUrl,
        enabled: updatedProvider.enabled,
        createdAt: updatedProvider.createdAt.toISOString(),
        updatedAt: updatedProvider.updatedAt.toISOString(),
      },
    } as ProviderResponse);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '更新提供商失败',
          code: 'UPDATE_FAILED',
        },
      } as ProviderResponse,
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/providers - 删除提供商
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '缺少 ID 参数',
            code: 'MISSING_ID',
          },
        } as ProviderResponse,
        { status: 400 }
      );
    }

    const existing = await prisma.provider.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '提供商不存在',
            code: 'NOT_FOUND',
          },
        } as ProviderResponse,
        { status: 404 }
      );
    }

    await prisma.provider.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { id },
    } as ProviderResponse);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '删除提供商失败',
          code: 'DELETE_FAILED',
        },
      } as ProviderResponse,
      { status: 500 }
    );
  }
}

/**
 * POST /api/providers/test - 测试 API Key 连通性
 */
export async function testProvider(request: Request) {
  try {
    const body = (await request.json()) as TestProviderRequest;
    const { baseUrl, apiKey } = body;

    if (!baseUrl || !apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '缺少 baseUrl 或 apiKey',
            code: 'MISSING_FIELDS',
          },
        } as TestProviderResponse,
        { status: 400 }
      );
    }

    const startTime = Date.now();

    try {
      const url = baseUrl.endsWith('/') ? `${baseUrl}models` : `${baseUrl}/models`;
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
        return NextResponse.json({
          success: true,
          data: {
            connected: true,
            latency,
            message: `连接成功，响应时间 ${String(latency)}ms`,
          },
        } as TestProviderResponse);
      }

      const errorText = await response.text();
      return NextResponse.json({
        success: true,
        data: {
          connected: false,
          latency,
          message: `连接失败：HTTP ${String(response.status)} - ${errorText.substring(0, 100)}`,
        },
      } as TestProviderResponse);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      return NextResponse.json(
        {
          success: true,
          data: {
            connected: false,
            message: `连接超时或失败：${errorMessage}`,
          },
        } as TestProviderResponse
      );
    }
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '测试请求失败',
          code: 'TEST_FAILED',
        },
      } as TestProviderResponse,
      { status: 500 }
    );
  }
}

/**
 * POST /api/providers/qwen-oauth/start - 启动 Qwen Device Flow
 * POST /api/providers/qwen-oauth/poll - 轮询获取 token
 * POST /api/providers/qwen-oauth/refresh - 刷新 token
 * POST /api/providers/preset - 从预置配置添加提供商
 * 注意：此函数通过 URL 路径区分处理不同的 OAuth 和预置提供商请求
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  const lastSegment = pathSegments[pathSegments.length - 1];

  if (lastSegment === 'start') {
    return handleQwenOAuthStart();
  }

  if (lastSegment === 'poll') {
    const body = await request.json() as Record<string, unknown>;
    return handleQwenOAuthPoll(body.deviceCode as string);
  }

  if (lastSegment === 'refresh') {
    const body = await request.json() as Record<string, unknown>;
    return handleQwenOAuthRefresh(body.providerId as string);
  }

  if (lastSegment === 'preset') {
    const body = await request.json() as Record<string, unknown>;
    return handleAddPresetProvider(body);
  }

  return createProvider(request);
}

async function handleQwenOAuthStart() {
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
      },
    } as QwenOAuthStartResponse);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
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

async function handleQwenOAuthPoll(deviceCode: string) {
  try {
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

    const result = await pollQwenToken(deviceCode);

    const providerName = '通义千问';
    let provider = await prisma.provider.findUnique({
      where: { name: providerName },
    });

    provider ??= await prisma.provider.create({
      data: {
        name: providerName,
        baseUrl: result.resourceUrl,
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

async function handleQwenOAuthRefresh(providerId: string) {
  try {
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

    if (provider?.oauthRefreshToken == null) {
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

async function handleAddPresetProvider(body: Record<string, unknown>) {
  try {
    const presetId = body.presetId as string;

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

