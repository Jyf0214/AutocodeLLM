import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import type { Worker, WorkerListResponse, WorkerResponse, CreateWorkerRequest, UpdateWorkerRequest } from '@/lib/api/worker-types';

const VALID_TYPES = ['compute', 'storage', 'inference'] as const;
const VALID_STATUSES = ['online', 'offline', 'busy', 'error'] as const;

/**
 * GET /api/workers - 获取所有工作节点列表
 */
export async function GET() {
  try {
    const workers = await prisma.worker.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const workerList = workers.map((worker) => ({
      id: worker.id,
      name: worker.name,
      type: worker.type as Worker['type'],
      status: worker.status as Worker['status'],
      url: worker.url,
      lastHeartbeat: worker.lastHeartbeat ? worker.lastHeartbeat.toISOString() : null,
      metadata: worker.metadata ? (JSON.parse(worker.metadata) as Record<string, unknown>) : null,
      enabled: worker.enabled,
      createdAt: worker.createdAt.toISOString(),
      updatedAt: worker.updatedAt.toISOString(),
    }));

    const response: WorkerListResponse = {
      success: true,
      data: workerList,
    };

    return NextResponse.json(response);
  } catch {
    const response: WorkerListResponse = {
      success: false,
      error: {
        message: '获取工作节点列表失败',
        code: 'FETCH_FAILED',
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * POST /api/workers - 创建工作节点
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateWorkerRequest;
    const { name, type, url, metadata, enabled } = body;

    // 运行时验证（外部数据可能不符合类型定义）
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (name === undefined || type === undefined || url === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '缺少必填字段：name, type, url',
            code: 'MISSING_FIELDS',
          },
        } as WorkerListResponse,
        { status: 400 }
      );
    }

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '无效的节点类型',
            code: 'INVALID_TYPE',
          },
        } as WorkerListResponse,
        { status: 400 }
      );
    }

    const existingWorker = await prisma.worker.findUnique({
      where: { name },
    });

    if (existingWorker) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '工作节点名称已存在',
            code: 'DUPLICATE_NAME',
          },
        } as WorkerListResponse,
        { status: 409 }
      );
    }

    const newWorker = await prisma.worker.create({
      data: {
        name,
        type,
        url,
        status: 'offline',
        metadata: metadata !== undefined ? JSON.stringify(metadata) : null,
        enabled: enabled ?? true,
      },
    });

    const response: WorkerResponse = {
      success: true,
      data: {
        id: newWorker.id,
        name: newWorker.name,
        type: newWorker.type as Worker['type'],
        status: newWorker.status as Worker['status'],
        url: newWorker.url,
        lastHeartbeat: newWorker.lastHeartbeat ? newWorker.lastHeartbeat.toISOString() : null,
        metadata: newWorker.metadata ? (JSON.parse(newWorker.metadata) as Record<string, unknown>) : null,
        enabled: newWorker.enabled,
        createdAt: newWorker.createdAt.toISOString(),
        updatedAt: newWorker.updatedAt.toISOString(),
      },
    };
    return NextResponse.json(response, { status: 201 });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '创建工作节点失败',
          code: 'CREATE_FAILED',
        },
      } as WorkerResponse,
      { status: 500 }
    );
  }
}

/**
 * PUT /api/workers - 更新工作节点
 */
export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as UpdateWorkerRequest;
    const { id, name, type, status, url, metadata, enabled } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '缺少 ID 字段',
            code: 'MISSING_ID',
          },
        } as WorkerListResponse,
        { status: 400 }
      );
    }

    if (type && !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '无效的节点类型',
            code: 'INVALID_TYPE',
          },
        } as WorkerListResponse,
        { status: 400 }
      );
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '无效的节点状态',
            code: 'INVALID_STATUS',
          },
        } as WorkerListResponse,
        { status: 400 }
      );
    }

    const existingWorker = await prisma.worker.findUnique({
      where: { id },
    });

    if (!existingWorker) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '工作节点不存在',
            code: 'NOT_FOUND',
          },
        } as WorkerListResponse,
        { status: 404 }
      );
    }

    if (name && name !== existingWorker.name) {
      const duplicateCheck = await prisma.worker.findUnique({
        where: { name },
      });

      if (duplicateCheck && duplicateCheck.id !== id) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: '工作节点名称已存在',
              code: 'DUPLICATE_NAME',
            },
          } as WorkerListResponse,
          { status: 409 }
        );
      }
    }

    const updatedWorker = await prisma.worker.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(status !== undefined && { status }),
        ...(url !== undefined && { url }),
        ...(metadata !== undefined ? { metadata } : {}),
        ...(enabled !== undefined && { enabled }),
      },
    });

    const response: WorkerResponse = {
      success: true,
      data: {
        id: updatedWorker.id,
        name: updatedWorker.name,
        type: updatedWorker.type as Worker['type'],
        status: updatedWorker.status as Worker['status'],
        url: updatedWorker.url,
        lastHeartbeat: updatedWorker.lastHeartbeat ? updatedWorker.lastHeartbeat.toISOString() : null,
        metadata: updatedWorker.metadata ? (JSON.parse(updatedWorker.metadata) as Record<string, unknown>) : null,
        enabled: updatedWorker.enabled,
        createdAt: updatedWorker.createdAt.toISOString(),
        updatedAt: updatedWorker.updatedAt.toISOString(),
      },
    };
    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '更新工作节点失败',
          code: 'UPDATE_FAILED',
        },
      } as WorkerResponse,
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workers - 删除工作节点
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
        } as WorkerListResponse,
        { status: 400 }
      );
    }

    const existingWorker = await prisma.worker.findUnique({
      where: { id },
    });

    if (!existingWorker) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '工作节点不存在',
            code: 'NOT_FOUND',
          },
        } as WorkerListResponse,
        { status: 404 }
      );
    }

    await prisma.worker.delete({
      where: { id },
    });

    const response: WorkerListResponse = {
      success: true,
      data: [],
    };
    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '删除工作节点失败',
          code: 'DELETE_FAILED',
        },
      } as WorkerListResponse,
      { status: 500 }
    );
  }
}
