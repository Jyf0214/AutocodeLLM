import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
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
 * GET /api/providers - 获取所有提供商列表
 */
export async function GET() {
  try {
    const providers = await prisma.provider.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const data = providers.map((provider) => ({
      id: provider.id,
      name: provider.name,
      baseUrl: provider.baseUrl,
      apiKey: maskApiKey(decryptApiKey(provider.apiKey)),
      databaseUrl: provider.databaseUrl,
      enabled: provider.enabled,
      createdAt: provider.createdAt.toISOString(),
      updatedAt: provider.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data,
    } as ProviderResponse);
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
 * POST /api/providers - 创建提供商
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateProviderRequest;
    const { name, baseUrl, apiKey, databaseUrl, enabled } = body;

    if (!name || !baseUrl || !apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '缺少必填字段：name, baseUrl, apiKey',
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
        apiKey: encryptApiKey(apiKey),
        databaseUrl: databaseUrl ?? null,
        enabled: enabled ?? true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newProvider.id,
          name: newProvider.name,
          baseUrl: newProvider.baseUrl,
          apiKey: maskApiKey(decryptApiKey(newProvider.apiKey)),
          databaseUrl: newProvider.databaseUrl,
          enabled: newProvider.enabled,
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
