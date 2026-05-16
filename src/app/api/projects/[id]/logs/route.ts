/**
 * 项目日志 API
 * GET /api/projects/[id]/logs - 获取项目日志
 * POST /api/projects/[id]/logs - 记录项目日志
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import {
  successResponse,
  errorResponse,
  handleError,
} from '@/lib/api/response';
import type {
  ProjectLogListResponse,
  ProjectLogResponse,
  CreateProjectLogRequest,
} from '@/lib/api/project-log-types';

/**
 * GET /api/projects/[id]/logs - 获取项目日志
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ProjectLogListResponse>> {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') ?? '50', 10);
    const type = searchParams.get('type') ?? undefined;

    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return errorResponse('项目不存在', 'PROJECT_NOT_FOUND', 404);
    }

    const logs = await prisma.projectLog.findMany({
      where: {
        projectId: id,
        ...(type ? { type } : {}),
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const data = logs.map((log) => ({
      id: log.id,
      projectId: log.projectId,
      type: log.type as 'function_call' | 'chat_message',
      functionName: log.functionName,
      summary: log.summary,
      status: log.status as 'success' | 'error' | 'pending' | null,
      createdAt: log.createdAt.toISOString(),
    }));

    return successResponse(data);
  } catch (error) {
    return handleError(error, '获取日志');
  }
}

/**
 * POST /api/projects/[id]/logs - 记录项目日志
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ProjectLogResponse>> {
  try {
    const { id } = await params;
    const body = (await request.json()) as CreateProjectLogRequest;
    const { type, functionName, summary, status } = body;

    // 验证必填字段
    if (!type) {
      return errorResponse('缺少日志类型参数', 'MISSING_TYPE', 400);
    }

    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return errorResponse('项目不存在', 'PROJECT_NOT_FOUND', 404);
    }

    const newLog = await prisma.projectLog.create({
      data: {
        projectId: id,
        type,
        functionName: functionName ?? null,
        summary: summary ?? null,
        status: status ?? null,
      },
    });

    return successResponse(
      {
        id: newLog.id,
        projectId: newLog.projectId,
        type: newLog.type as 'function_call' | 'chat_message',
        functionName: newLog.functionName,
        summary: newLog.summary,
        status: newLog.status as 'success' | 'error' | 'pending' | null,
        createdAt: newLog.createdAt.toISOString(),
      },
      201,
    );
  } catch (error) {
    return handleError(error, '记录日志');
  }
}
