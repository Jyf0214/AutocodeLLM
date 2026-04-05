import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import type {
  WorkspaceResponse,
  CreateWorkspaceRequest,
} from '@/lib/api/workspace-types';

/**
 * GET /api/workspaces - 获取所有工作空间列表
 */
export async function GET() {
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

    return NextResponse.json({
      success: true,
      data,
    } as WorkspaceResponse);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '获取工作空间列表失败',
          code: 'FETCH_FAILED',
        },
      } as WorkspaceResponse,
      { status: 500 }
    );
  }
}

/**
 * POST /api/workspaces - 创建工作空间
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateWorkspaceRequest;
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '缺少必填字段：name',
            code: 'MISSING_FIELDS',
          },
        } as WorkspaceResponse,
        { status: 400 }
      );
    }

    const newWorkspace = await prisma.workspace.create({
      data: {
        name,
        description: description ?? '',
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newWorkspace.id,
          name: newWorkspace.name,
          description: newWorkspace.description,
          accessPassword: newWorkspace.accessPassword ? '***' : null,
          createdAt: newWorkspace.createdAt.toISOString(),
          updatedAt: newWorkspace.updatedAt.toISOString(),
        },
      } as WorkspaceResponse,
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '创建工作空间失败',
          code: 'CREATE_FAILED',
        },
      } as WorkspaceResponse,
      { status: 500 }
    );
  }
}
