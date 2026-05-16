/**
 * 模型管理 API
 * GET /api/models - 获取所有模型配置列表
 * POST /api/models - 创建新的模型配置
 * PUT /api/models - 更新模型配置
 * DELETE /api/models - 删除模型配置
 */

import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/log';
import { prisma } from '@/lib/db/prisma';
import {
  successResponse,
  errorResponse,
  handleError,
  validateRequiredFields,
} from '@/lib/api/response';
import type {
  CreateModelConfigRequest,
  UpdateModelConfigRequest,
} from '@/lib/api/model-types';

/**
 * GET /api/models - 获取所有模型配置列表
 */
export const GET = withApiLogging('GET models', async function GET(): Promise<NextResponse>  {
  try {
    const providers = await prisma.provider.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const models = providers.map((provider) => ({
      id: provider.id,
      name: provider.name,
      provider: provider.name,
      apiKey: provider.apiKey,
      baseUrl: provider.baseUrl,
      enabled: provider.enabled,
      createdAt: provider.createdAt.toISOString(),
      updatedAt: provider.updatedAt.toISOString(),
    }));

    return successResponse(models);
  } catch (error) {
    return handleError(error, '获取模型列表');
  }
});

/**
 * POST /api/models - 创建新的模型配置
 */
export const POST = withApiLogging('POST models', async function POST(
  request: Request,
): Promise<NextResponse>  {
  try {
    const body = (await request.json()) as CreateModelConfigRequest;
    const { name, provider, apiKey, baseUrl, enabled } = body;

    // 验证必填字段
    const validationError = validateRequiredFields({ name, provider, apiKey });
    if (validationError) {
      return validationError;
    }

    const existingProvider = await prisma.provider.findUnique({
      where: { name },
    });

    if (existingProvider) {
      return errorResponse('模型名称已存在', 'DUPLICATE_NAME', 409);
    }

    const newProvider = await prisma.provider.create({
      data: {
        name,
        baseUrl: baseUrl ?? '',
        apiKey,
        enabled: enabled ?? true,
      },
    });

    return successResponse(
      {
        id: newProvider.id,
        name: newProvider.name,
        provider: newProvider.name,
        apiKey: newProvider.apiKey,
        baseUrl: newProvider.baseUrl,
        enabled: newProvider.enabled,
        createdAt: newProvider.createdAt.toISOString(),
        updatedAt: newProvider.updatedAt.toISOString(),
      },
      201,
    );
  } catch (error) {
    return handleError(error, '创建模型配置');
  }
});

/**
 * PUT /api/models - 更新模型配置
 */
export const PUT = withApiLogging('PUT models', async function PUT(
  request: Request,
): Promise<NextResponse>  {
  try {
    const body = (await request.json()) as UpdateModelConfigRequest & {
      id?: string;
    };
    const { id, name, provider, apiKey, baseUrl, enabled } = body;

    if (!id) {
      return errorResponse('缺少 ID 字段', 'MISSING_ID', 400);
    }

    const existingProvider = await prisma.provider.findUnique({
      where: { id },
    });

    if (!existingProvider) {
      return errorResponse('模型配置不存在', 'NOT_FOUND', 404);
    }

    if (name && name !== existingProvider.name) {
      const duplicateCheck = await prisma.provider.findUnique({
        where: { name },
      });
      if (duplicateCheck && duplicateCheck.id !== id) {
        return errorResponse('模型名称已存在', 'DUPLICATE_NAME', 409);
      }
    }

    const updatedProvider = await prisma.provider.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(provider !== undefined && { name: provider }),
        ...(apiKey !== undefined && { apiKey }),
        ...(baseUrl !== undefined && { baseUrl }),
        ...(enabled !== undefined && { enabled }),
      },
    });

    return successResponse({
      id: updatedProvider.id,
      name: updatedProvider.name,
      provider: updatedProvider.name,
      apiKey: updatedProvider.apiKey,
      baseUrl: updatedProvider.baseUrl,
      enabled: updatedProvider.enabled,
      createdAt: updatedProvider.createdAt.toISOString(),
      updatedAt: updatedProvider.updatedAt.toISOString(),
    });
  } catch (error) {
    return handleError(error, '更新模型配置');
  }
});

/**
 * DELETE /api/models - 删除模型配置
 */
export const DELETE = withApiLogging('DELETE models', async function DELETE(
  request: Request,
): Promise<NextResponse>  {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('缺少 ID 参数', 'MISSING_ID', 400);
    }

    const existingProvider = await prisma.provider.findUnique({
      where: { id },
    });

    if (!existingProvider) {
      return errorResponse('模型配置不存在', 'NOT_FOUND', 404);
    }

    await prisma.provider.delete({ where: { id } });

    return successResponse({ id });
  } catch (error) {
    return handleError(error, '删除模型配置');
  }
});
