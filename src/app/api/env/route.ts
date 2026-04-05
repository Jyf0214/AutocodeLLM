import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import type { EnvVariableResponse, CreateEnvVariableRequest, UpdateEnvVariableRequest } from '@/lib/api/env-types';
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

/**
 * 从环境变量派生 32 字节 AES-256 密钥（使用 SHA-256）
 */
function deriveKey(): Buffer {
  const keyStr = process.env.ENCRYPTION_KEY ?? 'autocodellm-encryption-key-32b!';
  return createHash('sha256').update(keyStr).digest();
}

/**
 * AES-256-CBC 加密函数（生产级别加密）
 * @param value 明文值
 * @returns iv:encrypted 格式（hex 编码）
 */
function encryptValue(value: string): string {
  const key = deriveKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(value, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * AES-256-CBC 解密函数
 * @param encrypted 密文（iv:encrypted 格式）
 * @returns 明文值
 * @throws 错误：当格式无效或解密失败时
 */
function decryptValue(encrypted: string): string {
  const key = deriveKey();
  const parts = encrypted.split(':');
  if (parts.length !== 2) {
    throw new Error('无效的加密数据格式：应为 iv:encrypted');
  }
  const [ivHex, encryptedData] = parts;
  if (!ivHex || !encryptedData) {
    throw new Error('无效的加密数据：iv 或加密数据为空');
  }
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * 脱敏显示变量值
 */
function maskValue(value: string): string {
  if (value.length <= 2) return '**';
  return value.substring(0, 2) + '*'.repeat(Math.max(value.length - 2, 4));
}

/**
 * GET /api/env - 获取所有环境变量列表
 */
export async function GET() {
  try {
    const envVars = await prisma.environmentVariable.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const maskedEnvVars = envVars.map((envVar) => ({
      id: envVar.id,
      key: envVar.key,
      value: maskValue(decryptValue(envVar.value)),
      description: envVar.description,
      enabled: envVar.enabled,
      createdAt: envVar.createdAt.toISOString(),
      updatedAt: envVar.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: maskedEnvVars,
    } as EnvVariableResponse);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '获取环境变量列表失败',
          code: 'FETCH_FAILED',
        },
      } as EnvVariableResponse,
      { status: 500 }
    );
  }
}

/**
 * POST /api/env - 创建新的环境变量
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateEnvVariableRequest;
    const { key, value, description, enabled } = body;

    if (!key || !value) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '缺少必填字段：key, value',
            code: 'MISSING_FIELDS',
          },
        } as EnvVariableResponse,
        { status: 400 }
      );
    }

    const existingEnvVar = await prisma.environmentVariable.findUnique({
      where: { key },
    });

    if (existingEnvVar) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '环境变量名已存在',
            code: 'DUPLICATE_KEY',
          },
        } as EnvVariableResponse,
        { status: 409 }
      );
    }

    const newEnvVar = await prisma.environmentVariable.create({
      data: {
        key,
        value: encryptValue(value),
        description: description ?? '',
        enabled: enabled ?? true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newEnvVar.id,
          key: newEnvVar.key,
          value: maskValue(decryptValue(newEnvVar.value)),
          description: newEnvVar.description,
          enabled: newEnvVar.enabled,
          createdAt: newEnvVar.createdAt.toISOString(),
          updatedAt: newEnvVar.updatedAt.toISOString(),
        },
      } as EnvVariableResponse,
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '创建环境变量失败',
          code: 'CREATE_FAILED',
        },
      } as EnvVariableResponse,
      { status: 500 }
    );
  }
}

/**
 * PUT /api/env - 更新环境变量
 */
export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as UpdateEnvVariableRequest;
    const { id, key, value, description, enabled } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '缺少 ID 字段',
            code: 'MISSING_ID',
          },
        } as EnvVariableResponse,
        { status: 400 }
      );
    }

    const existingEnvVar = await prisma.environmentVariable.findUnique({
      where: { id },
    });

    if (!existingEnvVar) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '环境变量不存在',
            code: 'NOT_FOUND',
          },
        } as EnvVariableResponse,
        { status: 404 }
      );
    }

    if (key && key !== existingEnvVar.key) {
      const duplicateCheck = await prisma.environmentVariable.findUnique({
        where: { key },
      });

      if (duplicateCheck && duplicateCheck.id !== id) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: '环境变量名已存在',
              code: 'DUPLICATE_KEY',
            },
          } as EnvVariableResponse,
          { status: 409 }
        );
      }
    }

    const updatedEnvVar = await prisma.environmentVariable.update({
      where: { id },
      data: {
        ...(key !== undefined && { key }),
        ...(value !== undefined && { value: encryptValue(value) }),
        ...(description !== undefined && { description }),
        ...(enabled !== undefined && { enabled }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedEnvVar.id,
        key: updatedEnvVar.key,
        value: maskValue(decryptValue(updatedEnvVar.value)),
        description: updatedEnvVar.description,
        enabled: updatedEnvVar.enabled,
        createdAt: updatedEnvVar.createdAt.toISOString(),
        updatedAt: updatedEnvVar.updatedAt.toISOString(),
      },
    } as EnvVariableResponse);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '更新环境变量失败',
          code: 'UPDATE_FAILED',
        },
      } as EnvVariableResponse,
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/env - 删除环境变量
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
        } as EnvVariableResponse,
        { status: 400 }
      );
    }

    const existingEnvVar = await prisma.environmentVariable.findUnique({
      where: { id },
    });

    if (!existingEnvVar) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '环境变量不存在',
            code: 'NOT_FOUND',
          },
        } as EnvVariableResponse,
        { status: 404 }
      );
    }

    await prisma.environmentVariable.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { id },
    } as EnvVariableResponse);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '删除环境变量失败',
          code: 'DELETE_FAILED',
        },
      } as EnvVariableResponse,
      { status: 500 }
    );
  }
}
