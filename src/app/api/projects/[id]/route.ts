/**
 * 项目详情、更新和删除 API
 * GET /api/projects/[id] - 获取单个项目详情
 * PUT /api/projects/[id] - 更新项目
 * DELETE /api/projects/[id] - 删除项目
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import {
  successResponse,
  errorResponse,
  handleError,
} from '@/lib/api/response';

/**
 * 解析项目 ID 参数
 */
async function getProjectId(params: unknown): Promise<string> {
  const paramsObj = await params as { id: string };
  return paramsObj.id;
}

/**
 * GET /api/projects/[id] - 获取单个项目详情
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const id = await getProjectId(params);

    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return errorResponse('项目不存在', 'NOT_FOUND', 404);
    }

    return successResponse({
      id: project.id,
      name: project.name,
      description: project.description,
      accessPassword: project.accessPassword ? '***' : null,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    });
  } catch (error) {
    return handleError(error, '获取项目详情');
  }
}

/**
 * PUT /api/projects/[id] - 更新项目
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const id = await getProjectId(params);
    const body = (await request.json()) as { name?: string; description?: string };
    const { name, description } = body;

    // 验证项目存在
    const existing = await prisma.project.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse('项目不存在', 'NOT_FOUND', 404);
    }

    // 验证名称不为空
    if (name?.trim().length === 0) {
      return errorResponse('名称不能为空', 'INVALID_NAME', 400);
    }

    // 更新项目
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
      },
    });

    return successResponse({
      id: updatedProject.id,
      name: updatedProject.name,
      description: updatedProject.description,
      accessPassword: updatedProject.accessPassword ? '***' : null,
      createdAt: updatedProject.createdAt.toISOString(),
      updatedAt: updatedProject.updatedAt.toISOString(),
    });
  } catch (error) {
    return handleError(error, '更新项目');
  }
}

/**
 * DELETE /api/projects/[id] - 删除项目
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const id = await getProjectId(params);

    const existing = await prisma.project.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse('项目不存在', 'NOT_FOUND', 404);
    }

    // Prisma 设置了 onDelete: Cascade，会自动删除关联的消息和日志
    await prisma.project.delete({
      where: { id },
    });

    return successResponse({ id });
  } catch (error) {
    return handleError(error, '删除项目');
  }
}
