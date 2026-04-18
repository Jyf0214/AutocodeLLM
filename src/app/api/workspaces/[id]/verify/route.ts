/**
 * 验证工作区进入密码 API
 * POST /api/workspaces/[id]/verify - 验证密码
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import {
  successResponse,
  errorResponse,
  handleError,
} from '@/lib/api/response';
import type { VerifyPasswordRequest, VerifyPasswordResponse } from '@/lib/api/workspace-log-types';

/**
 * POST /api/workspaces/[id]/verify - 验证工作区进入密码
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<VerifyPasswordResponse>> {
  try {
    const { id } = await params;
    const body = (await request.json()) as VerifyPasswordRequest;
    const { password } = body;

    // 验证必填字段
    if (!password) {
      return errorResponse('缺少密码参数', 'MISSING_PASSWORD', 400);
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      select: { accessPassword: true },
    });

    if (!workspace) {
      return errorResponse('工作区不存在', 'WORKSPACE_NOT_FOUND', 404);
    }

    // 如果没有设置密码，直接验证通过
    if (!workspace.accessPassword) {
      return successResponse({ verified: true });
    }

    // 验证密码（简单文本对比，生产环境应使用 bcrypt）
    const verified = workspace.accessPassword === password;

    return successResponse({ verified });
  } catch (error) {
    return handleError(error, '验证密码');
  }
}
