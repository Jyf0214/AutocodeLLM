/**
 * 本文件是 AutocodeLLM 项目的原始实现
 *
 * AutocodeLLM 项目许可证：
 * Apache License, Version 2.0
 * Copyright (c) 2026 Jyf0214
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import type { WorkspaceResponse } from '@/lib/api/workspace-types';

/**
 * GET /api/workspaces/[id] - 获取单个工作区详情
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const workspace = await prisma.workspace.findUnique({
      where: { id },
    });

    if (!workspace) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '工作区不存在',
            code: 'NOT_FOUND',
          },
        } as WorkspaceResponse,
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: workspace.id,
        name: workspace.name,
        description: workspace.description,
        accessPassword: workspace.accessPassword ? '***' : null,
        createdAt: workspace.createdAt.toISOString(),
        updatedAt: workspace.updatedAt.toISOString(),
      },
    } as WorkspaceResponse);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '获取工作区详情失败',
          code: 'FETCH_FAILED',
        },
      } as WorkspaceResponse,
      { status: 500 }
    );
  }
}

/**
 * PUT /api/workspaces/[id] - 更新工作区
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description } = body;

    // 验证工作区存在
    const existing = await prisma.workspace.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '工作区不存在',
            code: 'NOT_FOUND',
          },
        } as WorkspaceResponse,
        { status: 404 }
      );
    }

    // 验证必填字段
    if (name && name.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '名称不能为空',
            code: 'INVALID_NAME',
          },
        } as WorkspaceResponse,
        { status: 400 }
      );
    }

    // 更新工作区
    const updatedWorkspace = await prisma.workspace.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedWorkspace.id,
        name: updatedWorkspace.name,
        description: updatedWorkspace.description,
        accessPassword: updatedWorkspace.accessPassword ? '***' : null,
        createdAt: updatedWorkspace.createdAt.toISOString(),
        updatedAt: updatedWorkspace.updatedAt.toISOString(),
      },
    } as WorkspaceResponse);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '更新工作区失败',
          code: 'UPDATE_FAILED',
        },
      } as WorkspaceResponse,
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workspaces/[id] - 删除工作区
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.workspace.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '工作区不存在',
            code: 'NOT_FOUND',
          },
        } as WorkspaceResponse,
        { status: 404 }
      );
    }

    // Prisma 设置了 onDelete: Cascade，会自动删除关联的消息和日志
    await prisma.workspace.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { id },
    } as WorkspaceResponse);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '删除工作区失败',
          code: 'DELETE_FAILED',
        },
      } as WorkspaceResponse,
      { status: 500 }
    );
  }
}
