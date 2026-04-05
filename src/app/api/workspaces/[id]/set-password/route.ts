import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import type { SetPasswordResponse, SetPasswordRequest } from '@/lib/api/workspace-log-types';

/**
 * POST /api/workspaces/[id]/set-password - 设置工作区进入密码
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as SetPasswordRequest;
    const { password } = body;

    const workspace = await prisma.workspace.findUnique({
      where: { id },
    });

    if (!workspace) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '工作区不存在',
            code: 'WORKSPACE_NOT_FOUND',
          },
        } as SetPasswordResponse,
        { status: 404 }
      );
    }

    // 空字符串表示清除密码
    await prisma.workspace.update({
      where: { id },
      data: {
        accessPassword: password || null,
      },
    });

    return NextResponse.json({
      success: true,
    } as SetPasswordResponse);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '设置密码失败',
          code: 'SET_PASSWORD_FAILED',
        },
      } as SetPasswordResponse,
      { status: 500 }
    );
  }
}
