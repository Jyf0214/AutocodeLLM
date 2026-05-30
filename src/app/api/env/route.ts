/**
 * 环境变量管理 API
 * GET /api/env - 获取所有环境变量列表
 * POST /api/env - 创建新的环境变量
 * PUT /api/env - 更新环境变量
 * DELETE /api/env - 删除环境变量
 */

import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/log';
import {
  successResponse,
  errorResponse,
  handleError,
  validateRequiredFields,
} from '@/lib/api/response';
import { encryptValue, decryptValue } from '@/lib/providers/api-client';
import { maskValue } from '@/lib/api/response';
import type {

  CreateEnvVariableRequest,
  UpdateEnvVariableRequest,
} from '@/lib/api/env-types';


// 惰性获取 Prisma（动态 import 避免模块加载时实例化，构建阶段不会因 DATABASE_URL 未设置而崩溃）
async function getPrisma() {
  const { prisma } = await import('@/lib/db/prisma');
  return prisma;
}
/**
 * GET /api/env - 获取所有环境变量列表
 */
export const GET = withApiLogging('GET env', async function GET(): Promise<NextResponse>  {
  try {
    const db = await getPrisma();
    const envVars = await db.environmentVariable.findMany({
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

    return successResponse(maskedEnvVars);
  } catch (error) {
    return handleError(error, '获取环境变量列表');
  }
});

/**
 * POST /api/env - 创建新的环境变量
 */
export const POST = withApiLogging('POST env', async function POST(
  request: Request,
): Promise<NextResponse>  {
  try {
    const body = (await request.json()) as CreateEnvVariableRequest;
    const { key, value, description, enabled } = body;

    // 验证必填字段
    const validationError = validateRequiredFields({ key, value });
    if (validationError) {
      return validationError;
    }

    const db = await getPrisma();
    const existingEnvVar = await db.environmentVariable.findUnique({
      where: { key },
    });

    if (existingEnvVar) {
      return errorResponse('环境变量名已存在', 'DUPLICATE_KEY', 409);
    }

    const newEnvVar = await db.environmentVariable.create({
      data: {
        key,
        value: encryptValue(value),
        description: description ?? '',
        enabled: enabled ?? true,
      },
    });

    return successResponse(
      {
        id: newEnvVar.id,
        key: newEnvVar.key,
        value: maskValue(decryptValue(newEnvVar.value)),
        description: newEnvVar.description,
        enabled: newEnvVar.enabled,
        createdAt: newEnvVar.createdAt.toISOString(),
        updatedAt: newEnvVar.updatedAt.toISOString(),
      },
      201,
    );
  } catch (error) {
    return handleError(error, '创建环境变量');
  }
});

/**
 * PUT /api/env - 更新环境变量
 */
export const PUT = withApiLogging('PUT env', async function PUT(
  request: Request,
): Promise<NextResponse>  {
  try {
    const body = (await request.json()) as UpdateEnvVariableRequest;
    const { id, key, value, description, enabled } = body;

    if (!id) {
      return errorResponse('缺少 ID 字段', 'MISSING_ID', 400);
    }

    const db = await getPrisma();
    const existingEnvVar = await db.environmentVariable.findUnique({
      where: { id },
    });

    if (!existingEnvVar) {
      return errorResponse('环境变量不存在', 'NOT_FOUND', 404);
    }

    if (key && key !== existingEnvVar.key) {
      const duplicateCheck = await db.environmentVariable.findUnique({
        where: { key },
      });
      if (duplicateCheck && duplicateCheck.id !== id) {
        return errorResponse('环境变量名已存在', 'DUPLICATE_KEY', 409);
      }
    }

    const updatedEnvVar = await db.environmentVariable.update({
      where: { id },
      data: {
        ...(key !== undefined && { key }),
        ...(value !== undefined && { value: encryptValue(value) }),
        ...(description !== undefined && { description }),
        ...(enabled !== undefined && { enabled }),
      },
    });

    return successResponse({
      id: updatedEnvVar.id,
      key: updatedEnvVar.key,
      value: maskValue(decryptValue(updatedEnvVar.value)),
      description: updatedEnvVar.description,
      enabled: updatedEnvVar.enabled,
      createdAt: updatedEnvVar.createdAt.toISOString(),
      updatedAt: updatedEnvVar.updatedAt.toISOString(),
    });
  } catch (error) {
    return handleError(error, '更新环境变量');
  }
});

/**
 * DELETE /api/env - 删除环境变量
 */
export const DELETE = withApiLogging('DELETE env', async function DELETE(
  request: Request,
): Promise<NextResponse>  {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('缺少 ID 参数', 'MISSING_ID', 400);
    }

    const db = await getPrisma();
    const existingEnvVar = await db.environmentVariable.findUnique({
      where: { id },
    });

    if (!existingEnvVar) {
      return errorResponse('环境变量不存在', 'NOT_FOUND', 404);
    }

    await db.environmentVariable.delete({ where: { id } });

    return successResponse({ id });
  } catch (error) {
    return handleError(error, '删除环境变量');
  }
});
