/**
 * Agent 任务管理 API
 * GET /api/agents - 获取所有任务代理列表
 * POST /api/agents - 创建新的任务代理
 * PUT /api/agents - 更新任务代理
 * DELETE /api/agents - 删除任务代理
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import {
  successResponse,
  errorResponse,
  handleError,
  validateRequiredFields,
  validateEnum,
} from '@/lib/api/response';
import type {
  AgentTask,
  AgentTaskListResponse,
  UpdateAgentTaskRequest,
} from '@/lib/api/agent-task-types';

const VALID_MODES = ['read_only', 'yolo'] as const;
const VALID_STATUSES = ['ready', 'running', 'completed', 'failed'] as const;

/**
 * 解析日志
 */
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

/**
 * 序列化日志
 */
function serializeLogs(logs: unknown): string | null {
  if (!logs) return null;
  if (typeof logs === 'string') return logs;
  try {
    return JSON.stringify(logs);
  } catch {
    return null;
  }
}

/**
 * 转换为 AgentTask 响应格式
 */
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
export async function GET(): Promise<NextResponse<AgentTaskListResponse>> {
  try {
    const tasks = await prisma.agentTask.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const taskList = tasks.map(toAgentTaskResponse);

    return successResponse(taskList);
  } catch (error) {
    return handleError(error, '获取任务代理列表');
  }
}

/**
 * POST /api/agents - 创建新的任务代理
 */
export async function POST(
  request: Request,
): Promise<NextResponse<AgentTaskListResponse>> {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const name = body.name as string | undefined;
    const mode = body.mode as string | undefined;
    const description = body.description as string | undefined;
    const maxAgents = body.maxAgents as number | undefined;

    // 验证必填字段
    const validationError = validateRequiredFields({ name, mode });
    if (validationError) {
      return validationError as unknown as NextResponse<AgentTaskListResponse>;
    }

    // 验证模式
    const modeValidation = validateEnum(
      mode as 'read_only' | 'yolo',
      VALID_MODES,
      'mode',
    );
    if (modeValidation) {
      return modeValidation as unknown as NextResponse<AgentTaskListResponse>;
    }

    const taskName = name ?? '';

    const newTask = await prisma.agentTask.create({
      data: {
        name: taskName,
        description: description ?? '',
        mode: mode as 'read_only' | 'yolo',
        status: 'ready',
        maxAgents: maxAgents ?? 5,
        progress: 0,
      },
    });

    return successResponse(toAgentTaskResponse(newTask), 201);
  } catch (error) {
    return handleError(error, '创建任务代理');
  }
}

/**
 * PUT /api/agents - 更新任务代理
 */
export async function PUT(
  request: Request,
): Promise<NextResponse<AgentTaskListResponse>> {
  try {
    const body = (await request.json()) as UpdateAgentTaskRequest;
    const {
      id,
      name,
      description,
      mode,
      status,
      maxAgents,
      progress,
      logs,
      result,
    } = body;

    if (!id) {
      return errorResponse('缺少 ID 字段', 'MISSING_ID', 400);
    }

    // 验证模式
    if (mode) {
      const modeValidation = validateEnum(mode, VALID_MODES, 'mode');
      if (modeValidation) {
        return modeValidation as unknown as NextResponse<AgentTaskListResponse>;
      }
    }

    // 验证状态
    if (status) {
      const statusValidation = validateEnum(status, VALID_STATUSES, 'status');
      if (statusValidation) {
        return statusValidation as unknown as NextResponse<AgentTaskListResponse>;
      }
    }

    const existingTask = await prisma.agentTask.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return errorResponse('任务代理不存在', 'NOT_FOUND', 404);
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

    return successResponse(toAgentTaskResponse(updatedTask));
  } catch (error) {
    return handleError(error, '更新任务代理');
  }
}

/**
 * DELETE /api/agents - 删除任务代理
 */
export async function DELETE(
  request: Request,
): Promise<NextResponse<AgentTaskListResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('缺少 ID 参数', 'MISSING_ID', 400);
    }

    const existingTask = await prisma.agentTask.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return errorResponse('任务代理不存在', 'NOT_FOUND', 404);
    }

    await prisma.agentTask.delete({ where: { id } });

    return successResponse({ id });
  } catch (error) {
    return handleError(error, '删除任务代理');
  }
}
