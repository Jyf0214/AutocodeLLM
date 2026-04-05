import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import type { VerifyPasswordResponse, VerifyPasswordRequest } from '@/lib/api/workspace-log-types';

/**
 * POST /api/workspaces/[id]/verify - 验证工作区进入密码
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as VerifyPasswordRequest;
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '缺少密码参数',
            code: 'MISSING_PASSWORD',
          },
        } as VerifyPasswordResponse,
        { status: 400 }
      );
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      select: { accessPassword: true },
    });

    if (!workspace) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '工作区不存在',
            code: 'WORKSPACE_NOT_FOUND',
          },
        } as VerifyPasswordResponse,
        { status: 404 }
      );
    }

    // 如果没有设置密码，直接验证通过
    if (!workspace.accessPassword) {
      return NextResponse.json({
        success: true,
        data: { verified: true },
      } as VerifyPasswordResponse);
    }

    // 验证密码（简单文本对比，生产环境应使用 bcrypt）
    const verified = workspace.accessPassword === password;

    return NextResponse.json({
      success: true,
      data: { verified },
    } as VerifyPasswordResponse);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '验证密码失败',
          code: 'VERIFY_FAILED',
        },
      } as VerifyPasswordResponse,
      { status: 500 }
    );
  }
}
