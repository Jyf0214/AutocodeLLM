import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import type {
  WorkspaceLogListResponse,
  CreateWorkspaceLogRequest,
  WorkspaceLogResponse,
} from '@/lib/api/workspace-log-types';

/**
 * GET /api/workspaces/[id]/logs - 获取工作区日志
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '工作区不存在',
            code: 'WORKSPACE_NOT_FOUND',
          },
        } as WorkspaceLogListResponse,
        { status: 404 }
      );
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

    return NextResponse.json({
      success: true,
      data,
    } as WorkspaceLogListResponse);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '获取日志失败',
          code: 'FETCH_LOGS_FAILED',
        },
      } as WorkspaceLogListResponse,
      { status: 500 }
    );
  }
}

/**
 * POST /api/workspaces/[id]/logs - 记录工作区日志
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as CreateWorkspaceLogRequest;
    const { type, functionName, summary, status } = body;

    if (!type) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '缺少日志类型参数',
            code: 'MISSING_TYPE',
          },
        } as WorkspaceLogResponse,
        { status: 400 }
      );
    }

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
        } as WorkspaceLogResponse,
        { status: 404 }
      );
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

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newLog.id,
          workspaceId: newLog.workspaceId,
          type: newLog.type as 'function_call' | 'chat_message',
          functionName: newLog.functionName,
          summary: newLog.summary,
          status: newLog.status as 'success' | 'error' | 'pending' | null,
          createdAt: newLog.createdAt.toISOString(),
        },
      } as WorkspaceLogResponse,
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '记录日志失败',
          code: 'CREATE_LOG_FAILED',
        },
      } as WorkspaceLogResponse,
      { status: 500 }
    );
  }
}
