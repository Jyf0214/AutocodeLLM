/**
 * 设置工作区进入密码 API
 * POST /api/workspaces/[id]/set-password - 设置密码
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import {
  successResponse,
  errorResponse,
  handleError,
} from '@/lib/api/response';
import type { SetPasswordResponse, SetPasswordRequest } from '@/lib/api/workspace-log-types';

/**
 * POST /api/workspaces/[id]/set-password - 设置工作区进入密码
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<SetPasswordResponse>> {
  try {
    const { id } = await params;
    const body = (await request.json()) as SetPasswordRequest;
    const { password } = body;

    const workspace = await prisma.workspace.findUnique({
      where: { id },
    });

    if (!workspace) {
      return errorResponse('工作区不存在', 'WORKSPACE_NOT_FOUND', 404);
    }

    // 空字符串表示清除密码
    await prisma.workspace.update({
      where: { id },
      data: { accessPassword: password || null },
    });

    return successResponse(undefined);
  } catch (error) {
    return handleError(error, '设置密码');
  }
}
