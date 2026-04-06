import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import type { WorkspaceResponse } from '@/lib/api/workspace-types';

/**
 * DELETE /api/workspaces/[id] - 删除工作空间
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
            message: '工作空间不存在',
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
          message: '删除工作空间失败',
          code: 'DELETE_FAILED',
        },
      } as WorkspaceResponse,
      { status: 500 }
    );
  }
}
