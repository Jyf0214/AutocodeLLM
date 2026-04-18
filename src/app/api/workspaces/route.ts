/**
 * 工作区列表和创建工作区 API
 * GET /api/workspaces - 获取所有工作空间列表
 * POST /api/workspaces - 创建工作空间
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import {
  successResponse,
  errorResponse,
  handleError,
  validateRequiredFields,
} from '@/lib/api/response';
import type { WorkspaceResponse, CreateWorkspaceRequest } from '@/lib/api/workspace-types';

/**
 * GET /api/workspaces - 获取所有工作空间列表
 */
export async function GET(): Promise<NextResponse<WorkspaceResponse>> {
  try {
    const workspaces = await prisma.workspace.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const data = workspaces.map((workspace) => ({
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      accessPassword: workspace.accessPassword ? '***' : null,
      createdAt: workspace.createdAt.toISOString(),
      updatedAt: workspace.updatedAt.toISOString(),
    }));

    return successResponse(data);
  } catch (error) {
    return handleError(error, '获取工作空间列表');
  }
}

/**
 * POST /api/workspaces - 创建工作空间
 */
export async function POST(
  request: Request,
): Promise<NextResponse<WorkspaceResponse>> {
  try {
    const body = (await request.json()) as CreateWorkspaceRequest;

    // 验证必填字段
    const validationError = validateRequiredFields({ name: body.name });
    if (validationError) {
      return validationError as unknown as NextResponse<WorkspaceResponse>;
    }

    const { name, description } = body;

    const newWorkspace = await prisma.workspace.create({
      data: {
        name,
        description: description ?? '',
      },
    });

    return successResponse(
      {
        id: newWorkspace.id,
        name: newWorkspace.name,
        description: newWorkspace.description,
        accessPassword: newWorkspace.accessPassword ? '***' : null,
        createdAt: newWorkspace.createdAt.toISOString(),
        updatedAt: newWorkspace.updatedAt.toISOString(),
      },
      201,
    );
  } catch (error) {
    return handleError(error, '创建工作空间');
  }
}
