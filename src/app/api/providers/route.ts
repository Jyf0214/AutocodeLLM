import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { PRESET_PROVIDERS } from '@/lib/providers';
import type {
  ProviderResponse,
  CreateProviderRequest,
  UpdateProviderRequest,
  TestProviderRequest,
  TestProviderResponse,
} from '@/lib/api/provider-types';

/**
 * AES-256-CBC 加密 API Key
 */
function encryptApiKey(apiKey: string): string {
  const keyStr = process.env.KEY_VAULTS_SECRET ?? 'your-key-vaults-secret-change-in-production';
  const key = Buffer.from(keyStr.padEnd(32).slice(0, 32));
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * AES-256-CBC 加密（通用值）
 */
function encryptValue(value: string): string {
  const keyStr = process.env.KEY_VAULTS_SECRET ?? 'your-key-vaults-secret-change-in-production';
  const key = Buffer.from(keyStr.padEnd(32).slice(0, 32));
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(value, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * AES-256-CBC 解密 API Key
 */
function decryptApiKey(encrypted: string): string {
  const keyStr = process.env.KEY_VAULTS_SECRET ?? 'your-key-vaults-secret-change-in-production';
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

    const customData = providers.map((provider) => {
      try {
        return {
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
        };
      } catch (decryptError) {
        // 如果解密失败，返回脱敏的原始值
        console.error(`[Provider] 解密apiKey失败 for provider ${provider.id}:`, decryptError);
        return {
          id: provider.id,
          name: provider.name,
          baseUrl: provider.baseUrl,
          apiKey: '****', // 解密失败时返回脱敏显示
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    console.error('[Provider] 获取提供商列表失败:', errorMessage);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          message: `获取提供商列表失败: ${errorMessage}`,
          code: 'FETCH_FAILED',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        },
      } as ProviderResponse,
      { status: 500 }
    );
  }
}

/**
 * POST /api/providers - 创建提供商
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateProviderRequest & {
      providerType?: string;
      sdkType?: string;
      authType?: string;
      oauthAccessToken?: string;
      oauthRefreshToken?: string;
      oauthDeviceCode?: string;
      oauthExpiresAt?: string;
      metadata?: string;
    };
    const { name, baseUrl, apiKey, databaseUrl, enabled, providerType, sdkType, authType, oauthAccessToken, oauthRefreshToken, oauthDeviceCode, oauthExpiresAt, metadata } = body;

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
        oauthAccessToken: oauthAccessToken ? encryptValue(oauthAccessToken) : null,
        oauthRefreshToken: oauthRefreshToken ? encryptValue(oauthRefreshToken) : null,
        oauthDeviceCode: oauthDeviceCode ? encryptValue(oauthDeviceCode) : null,
        oauthExpiresAt: oauthExpiresAt ? new Date(oauthExpiresAt) : null,
        metadata: metadata ?? null,
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
    const body = (await request.json()) as UpdateProviderRequest & {
      authType?: string;
      sdkType?: string;
      oauthAccessToken?: string;
      oauthRefreshToken?: string;
      oauthDeviceCode?: string;
      oauthExpiresAt?: string;
      metadata?: string;
    };
    const { id, name, baseUrl, apiKey, databaseUrl, enabled, authType, sdkType, oauthAccessToken, oauthRefreshToken, oauthDeviceCode, oauthExpiresAt, metadata } = body;

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
        ...(authType !== undefined && { authType }),
        ...(sdkType !== undefined && { sdkType }),
        ...(oauthAccessToken !== undefined && { oauthAccessToken: oauthAccessToken ? encryptValue(oauthAccessToken) : null }),
        ...(oauthRefreshToken !== undefined && { oauthRefreshToken: oauthRefreshToken ? encryptValue(oauthRefreshToken) : null }),
        ...(oauthDeviceCode !== undefined && { oauthDeviceCode: oauthDeviceCode ? encryptValue(oauthDeviceCode) : null }),
        ...(oauthExpiresAt !== undefined && { oauthExpiresAt: oauthExpiresAt ? new Date(oauthExpiresAt) : null }),
        ...(metadata !== undefined && { metadata }),
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

    // 确保 baseUrl 包含协议前缀
    let normalizedBaseUrl = baseUrl;
    if (!normalizedBaseUrl.startsWith('http://') && !normalizedBaseUrl.startsWith('https://')) {
      normalizedBaseUrl = `https://${normalizedBaseUrl}`;
    }

    const startTime = Date.now();

    try {
      const url = normalizedBaseUrl.endsWith('/') ? `${normalizedBaseUrl}models` : `${normalizedBaseUrl}/models`;
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
