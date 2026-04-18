/**
 * 工作区详情、更新和删除 API
 * GET /api/workspaces/[id] - 获取单个工作区详情
 * PUT /api/workspaces/[id] - 更新工作区
 * DELETE /api/workspaces/[id] - 删除工作区
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import {
  successResponse,
  errorResponse,
  handleError,
} from '@/lib/api/response';
import type { WorkspaceResponse } from '@/lib/api/workspace-types';

/**
 * 解析工作区 ID 参数
 */
async function getWorkspaceId(params: unknown): Promise<string> {
  const paramsObj = await params;
  return paramsObj.id as string;
}

/**
 * GET /api/workspaces/[id] - 获取单个工作区详情
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<WorkspaceResponse>> {
  try {
    const id = await getWorkspaceId(params);

    const workspace = await prisma.workspace.findUnique({
      where: { id },
    });

    if (!workspace) {
      return errorResponse('工作区不存在', 'NOT_FOUND', 404);
    }

    return successResponse({
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      accessPassword: workspace.accessPassword ? '***' : null,
      createdAt: workspace.createdAt.toISOString(),
      updatedAt: workspace.updatedAt.toISOString(),
    });
  } catch (error) {
    return handleError(error, '获取工作区详情');
  }
}

/**
 * PUT /api/workspaces/[id] - 更新工作区
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<WorkspaceResponse>> {
  try {
    const id = await getWorkspaceId(params);
    const body = (await request.json()) as { name?: string; description?: string };
    const { name, description } = body;

    // 验证工作区存在
    const existing = await prisma.workspace.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse('工作区不存在', 'NOT_FOUND', 404);
    }

    // 验证名称不为空
    if (name?.trim().length === 0) {
      return errorResponse('名称不能为空', 'INVALID_NAME', 400);
    }

    // 更新工作区
    const updatedWorkspace = await prisma.workspace.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
      },
    });

    return successResponse({
      id: updatedWorkspace.id,
      name: updatedWorkspace.name,
      description: updatedWorkspace.description,
      accessPassword: updatedWorkspace.accessPassword ? '***' : null,
      createdAt: updatedWorkspace.createdAt.toISOString(),
      updatedAt: updatedWorkspace.updatedAt.toISOString(),
    });
  } catch (error) {
    return handleError(error, '更新工作区');
  }
}

/**
 * DELETE /api/workspaces/[id] - 删除工作区
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<WorkspaceResponse>> {
  try {
    const id = await getWorkspaceId(params);

    const existing = await prisma.workspace.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse('工作区不存在', 'NOT_FOUND', 404);
    }

    // Prisma 设置了 onDelete: Cascade，会自动删除关联的消息和日志
    await prisma.workspace.delete({
      where: { id },
    });

    return successResponse({ id });
  } catch (error) {
    return handleError(error, '删除工作区');
  }
}
