import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import type { ModelConfigResponse, CreateModelConfigRequest, UpdateModelConfigRequest } from '@/lib/api/model-types';

/**
 * GET /api/models - 获取所有模型配置列表
 */
export async function GET() {
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

    return NextResponse.json({
      success: true,
      data: models,
    } as ModelConfigResponse);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '获取模型列表失败',
          code: 'FETCH_FAILED',
        },
      } as ModelConfigResponse,
      { status: 500 }
    );
  }
}

/**
 * POST /api/models - 创建新的模型配置
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateModelConfigRequest;
    const { name, provider, apiKey, baseUrl, enabled } = body;

    if (!name || !provider || !apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '缺少必填字段：name, provider, apiKey',
            code: 'MISSING_FIELDS',
          },
        } as ModelConfigResponse,
        { status: 400 }
      );
    }

    const existingProvider = await prisma.provider.findUnique({
      where: { name },
    });

    if (existingProvider) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '模型名称已存在',
            code: 'DUPLICATE_NAME',
          },
        } as ModelConfigResponse,
        { status: 409 }
      );
    }

    const newProvider = await prisma.provider.create({
      data: {
        name,
        baseUrl: baseUrl ?? '',
        apiKey,
        enabled: enabled ?? true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newProvider.id,
          name: newProvider.name,
          provider: newProvider.name,
          apiKey: newProvider.apiKey,
          baseUrl: newProvider.baseUrl,
          enabled: newProvider.enabled,
          createdAt: newProvider.createdAt.toISOString(),
          updatedAt: newProvider.updatedAt.toISOString(),
        },
      } as ModelConfigResponse,
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '创建模型配置失败',
          code: 'CREATE_FAILED',
        },
      } as ModelConfigResponse,
      { status: 500 }
    );
  }
}

/**
 * PUT /api/models - 更新模型配置
 */
export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as UpdateModelConfigRequest & { id: string };
    const { id, name, provider, apiKey, baseUrl, enabled } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '缺少 ID 字段',
            code: 'MISSING_ID',
          },
        } as ModelConfigResponse,
        { status: 400 }
      );
    }

    const existingProvider = await prisma.provider.findUnique({
      where: { id },
    });

    if (!existingProvider) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '模型配置不存在',
            code: 'NOT_FOUND',
          },
        } as ModelConfigResponse,
        { status: 404 }
      );
    }

    if (name && name !== existingProvider.name) {
      const duplicateCheck = await prisma.provider.findUnique({
        where: { name },
      });

      if (duplicateCheck && duplicateCheck.id !== id) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: '模型名称已存在',
              code: 'DUPLICATE_NAME',
            },
          } as ModelConfigResponse,
          { status: 409 }
        );
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

    return NextResponse.json({
      success: true,
      data: {
        id: updatedProvider.id,
        name: updatedProvider.name,
        provider: updatedProvider.name,
        apiKey: updatedProvider.apiKey,
        baseUrl: updatedProvider.baseUrl,
        enabled: updatedProvider.enabled,
        createdAt: updatedProvider.createdAt.toISOString(),
        updatedAt: updatedProvider.updatedAt.toISOString(),
      },
    } as ModelConfigResponse);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '更新模型配置失败',
          code: 'UPDATE_FAILED',
        },
      } as ModelConfigResponse,
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/models - 删除模型配置
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
        } as ModelConfigResponse,
        { status: 400 }
      );
    }

    const existingProvider = await prisma.provider.findUnique({
      where: { id },
    });

    if (!existingProvider) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '模型配置不存在',
            code: 'NOT_FOUND',
          },
        } as ModelConfigResponse,
        { status: 404 }
      );
    }

    await prisma.provider.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { id },
    } as ModelConfigResponse);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '删除模型配置失败',
          code: 'DELETE_FAILED',
        },
      } as ModelConfigResponse,
      { status: 500 }
    );
  }
}
