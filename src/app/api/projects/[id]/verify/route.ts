/**
 * 验证项目进入密码 API
 * POST /api/projects/[id]/verify - 验证密码
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import {
  successResponse,
  errorResponse,
  handleError,
} from '@/lib/api/response';
import type { VerifyPasswordRequest, VerifyPasswordResponse } from '@/lib/api/project-log-types';

/**
 * POST /api/projects/[id]/verify - 验证项目进入密码
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

    const project = await prisma.project.findUnique({
      where: { id },
      select: { accessPassword: true },
    });

    if (!project) {
      return errorResponse('项目不存在', 'PROJECT_NOT_FOUND', 404);
    }

    // 如果没有设置密码，直接验证通过
    if (!project.accessPassword) {
      return successResponse({ verified: true });
    }

    // 验证密码（简单文本对比，生产环境应使用 bcrypt）
    const verified = project.accessPassword === password;

    return successResponse({ verified });
  } catch (error) {
    return handleError(error, '验证密码');
  }
}
