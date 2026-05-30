/**
 * 项目详情、更新和删除 API
 * GET /api/projects/[id] - 获取单个项目详情
 * PUT /api/projects/[id] - 更新项目
 * DELETE /api/projects/[id] - 删除项目
 */

import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/log';
import {

  successResponse,
  errorResponse,
  handleError,
} from '@/lib/api/response';

// 惰性获取 Prisma（动态 import 避免模块加载时实例化，构建阶段不会因 DATABASE_URL 未设置而崩溃）
async function getPrisma() {
  const { prisma } = await import('@/lib/db/prisma');
  return prisma;
}

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
export const GET = withApiLogging('GET projects/:id', async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const id = await getProjectId(params);

    const db = await getPrisma();
    const project = await db.project.findUnique({
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
});

/**
 * PUT /api/projects/[id] - 更新项目
 */
export const PUT = withApiLogging('PUT projects/:id', async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const id = await getProjectId(params);
    const body = (await request.json()) as { name?: string; description?: string };
    const { name, description } = body;

    const db = await getPrisma();
    const existing = await db.project.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse('项目不存在', 'NOT_FOUND', 404);
    }

    if (name?.trim().length === 0) {
      return errorResponse('名称不能为空', 'INVALID_NAME', 400);
    }

    const updatedProject = await db.project.update({
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
});

/**
 * DELETE /api/projects/[id] - 删除项目
 */
export const DELETE = withApiLogging('DELETE projects/:id', async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const id = await getProjectId(params);

    const db = await getPrisma();
    const existing = await db.project.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse('项目不存在', 'NOT_FOUND', 404);
    }

    await db.project.delete({
      where: { id },
    });

    return successResponse({ id });
  } catch (error) {
    return handleError(error, '删除项目');
  }
});
