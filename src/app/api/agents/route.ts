import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import type { AgentTask, AgentTaskListResponse, UpdateAgentTaskRequest } from '@/lib/api/agent-task-types';

const VALID_MODES = ['read_only', 'yolo'] as const;
const VALID_STATUSES = ['ready', 'running', 'completed', 'failed'] as const;

function parseLogs(logs: unknown): Record<string, unknown>[] | null {
  if (!logs) return null;
  if (typeof logs === 'string') {
    try {
      return JSON.parse(logs) as Record<string, unknown>[];
    } catch {
      return null;
    }
  }
  return logs as Record<string, unknown>[] | null;
}

function serializeLogs(logs: unknown): string | null {
  if (!logs) return null;
  if (typeof logs === 'string') return logs;
  try {
    return JSON.stringify(logs);
  } catch {
    return null;
  }
}

function toAgentTaskResponse(task: {
  id: string;
  name: string;
  description: string;
  mode: string;
  status: string;
  maxAgents: number;
  progress: number;
  logs: unknown;
  result: string | null;
  createdAt: Date;
  updatedAt: Date;
}): AgentTask {
  return {
    id: task.id,
    name: task.name,
    description: task.description,
    mode: task.mode as AgentTask['mode'],
    status: task.status as AgentTask['status'],
    maxAgents: task.maxAgents,
    progress: task.progress,
    logs: parseLogs(task.logs),
    result: task.result,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

/**
 * GET /api/agents - 获取所有任务代理列表
 */
export async function GET() {
  try {
    const tasks = await prisma.agentTask.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const taskList = tasks.map(toAgentTaskResponse);

    const response: AgentTaskListResponse = {
      success: true,
      data: taskList,
    };

    return NextResponse.json(response);
  } catch {
    const response: AgentTaskListResponse = {
      success: false,
      error: {
        message: '获取任务代理列表失败',
        code: 'FETCH_FAILED',
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * POST /api/agents - 创建新的任务代理
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const name = body.name as string | undefined;
    const mode = body.mode as string | undefined;
    const description = body.description as string | undefined;
    const maxAgents = body.maxAgents as number | undefined;

    if (!name || !mode) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '缺少必填字段：name, mode',
            code: 'MISSING_FIELDS',
          },
        } as AgentTaskListResponse,
        { status: 400 }
      );
    }

    if (!VALID_MODES.includes(mode as typeof VALID_MODES[number])) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '无效的执行模式',
            code: 'INVALID_MODE',
          },
        } as AgentTaskListResponse,
        { status: 400 }
      );
    }

    const newTask = await prisma.agentTask.create({
      data: {
        name,
        description: description ?? '',
        mode,
        status: 'ready',
        maxAgents: maxAgents ?? 5,
        progress: 0,
      },
    });

    const response: AgentTaskListResponse = {
      success: true,
      data: toAgentTaskResponse(newTask),
    };
    return NextResponse.json(response, { status: 201 });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '创建任务代理失败',
          code: 'CREATE_FAILED',
        },
      } as AgentTaskListResponse,
      { status: 500 }
    );
  }
}

/**
 * PUT /api/agents - 更新任务代理
 */
export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as UpdateAgentTaskRequest;
    const { id, name, description, mode, status, maxAgents, progress, logs, result } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '缺少 ID 字段',
            code: 'MISSING_ID',
          },
        } as AgentTaskListResponse,
        { status: 400 }
      );
    }

    if (mode && !VALID_MODES.includes(mode)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '无效的执行模式',
            code: 'INVALID_MODE',
          },
        } as AgentTaskListResponse,
        { status: 400 }
      );
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '无效的任务状态',
            code: 'INVALID_STATUS',
          },
        } as AgentTaskListResponse,
        { status: 400 }
      );
    }

    const existingTask = await prisma.agentTask.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '任务代理不存在',
            code: 'NOT_FOUND',
          },
        } as AgentTaskListResponse,
        { status: 404 }
      );
    }

    const updatedTask = await prisma.agentTask.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(mode !== undefined && { mode }),
        ...(status !== undefined && { status }),
        ...(maxAgents !== undefined && { maxAgents }),
        ...(progress !== undefined && { progress }),
        ...(logs !== undefined && { logs: serializeLogs(logs) }),
        ...(result !== undefined && { result }),
      },
    });

    const response: AgentTaskListResponse = {
      success: true,
      data: toAgentTaskResponse(updatedTask),
    };
    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '更新任务代理失败',
          code: 'UPDATE_FAILED',
        },
      } as AgentTaskListResponse,
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/agents - 删除任务代理
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '缺少 ID 参数',
            code: 'MISSING_ID',
          },
        } as AgentTaskListResponse,
        { status: 400 }
      );
    }

    const existingTask = await prisma.agentTask.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '任务代理不存在',
            code: 'NOT_FOUND',
          },
        } as AgentTaskListResponse,
        { status: 404 }
      );
    }

    await prisma.agentTask.delete({
      where: { id },
    });

    const response: AgentTaskListResponse = {
      success: true,
      data: { id },
    };
    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '删除任务代理失败',
          code: 'DELETE_FAILED',
        },
      } as AgentTaskListResponse,
      { status: 500 }
    );
  }
}
