/**
 * 验证项目进入密码 API
 * POST /api/projects/[id]/verify - 验证密码
 */

import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/log';
import { compareSync } from 'bcryptjs';
import {
  successResponse,
  errorResponse,
  handleError,
} from '@/lib/api/response';
import type { VerifyPasswordRequest, VerifyPasswordResponse } from '@/lib/api/project-log-types';

// 惰性获取 Prisma（动态 import 避免模块加载时实例化，构建阶段不会因 DATABASE_URL 未设置而崩溃）
async function getPrisma() {
  const { prisma } = await import('@/lib/db/prisma');
  return prisma;
}

/**
 * POST /api/projects/[id]/verify - 验证项目进入密码
 */
export const POST = withApiLogging('POST projects/:id/verify', async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<VerifyPasswordResponse>>  {
  try {
    const { id } = await params;
    const body = (await request.json()) as VerifyPasswordRequest;
    const { password } = body;

    // 验证必填字段
    if (!password) {
      return errorResponse('缺少密码参数', 'MISSING_PASSWORD', 400);
    }

    const db = await getPrisma();
    const project = await db.project.findUnique({
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

    // 使用 bcrypt 验证密码（替代原来的明文比对）
    const verified = compareSync(password, project.accessPassword);

    return successResponse({ verified });
  } catch (error) {
    return handleError(error, '验证密码');
  }
});
