/**
 * 工作区日志 API
 * GET /api/workspaces/[id]/logs - 获取工作区日志
 * POST /api/workspaces/[id]/logs - 记录工作区日志
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import {
  successResponse,
  errorResponse,
  handleError,
} from '@/lib/api/response';
import type {
  WorkspaceLogListResponse,
  WorkspaceLogResponse,
  CreateWorkspaceLogRequest,
} from '@/lib/api/workspace-log-types';

/**
 * GET /api/workspaces/[id]/logs - 获取工作区日志
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<WorkspaceLogListResponse>> {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') ?? '50', 10);
    const type = searchParams.get('type') ?? undefined;

    const workspace = await prisma.workspace.findUnique({
      where: { id },
    });

    if (!workspace) {
      return errorResponse('工作区不存在', 'WORKSPACE_NOT_FOUND', 404) as unknown as NextResponse<WorkspaceLogListResponse>;
    }

    const logs = await prisma.workspaceLog.findMany({
      where: {
        workspaceId: id,
        ...(type ? { type } : {}),
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const data = logs.map((log) => ({
      id: log.id,
      workspaceId: log.workspaceId,
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
 * POST /api/workspaces/[id]/logs - 记录工作区日志
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<WorkspaceLogResponse>> {
  try {
    const { id } = await params;
    const body = (await request.json()) as CreateWorkspaceLogRequest;
    const { type, functionName, summary, status } = body;

    // 验证必填字段
    if (!type) {
      return errorResponse('缺少日志类型参数', 'MISSING_TYPE', 400);
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id },
    });

    if (!workspace) {
      return errorResponse('工作区不存在', 'WORKSPACE_NOT_FOUND', 404) as unknown as NextResponse<WorkspaceLogResponse>;
    }

    const newLog = await prisma.workspaceLog.create({
      data: {
        workspaceId: id,
        type,
        functionName: functionName ?? null,
        summary: summary ?? null,
        status: status ?? null,
      },
    });

    return successResponse(
      {
        id: newLog.id,
        workspaceId: newLog.workspaceId,
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
