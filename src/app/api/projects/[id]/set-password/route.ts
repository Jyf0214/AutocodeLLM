/**
 * 设置项目进入密码 API
 * POST /api/projects/[id]/set-password - 设置密码
 */

import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/log';
import { hashSync } from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import {
  successResponse,
  errorResponse,
  handleError,
} from '@/lib/api/response';
import type { SetPasswordResponse, SetPasswordRequest } from '@/lib/api/project-log-types';

/**
 * POST /api/projects/[id]/set-password - 设置项目进入密码
 */
export const POST = withApiLogging('POST projects/:id/set-password', async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<SetPasswordResponse>>  {
  try {
    const { id } = await params;
    const body = (await request.json()) as SetPasswordRequest;
    const { password } = body;

    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return errorResponse('项目不存在', 'PROJECT_NOT_FOUND', 404);
    }

    // 使用 bcrypt 哈希项目密码后存储（空字符串表示清除密码）
    await prisma.project.update({
      where: { id },
      data: { accessPassword: password ? hashSync(password, 10) : null },
    });

    return successResponse(undefined);
  } catch (error) {
    return handleError(error, '设置密码');
  }
});
