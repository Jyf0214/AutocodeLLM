/**
 * MCP 服务器管理 API
 * GET /api/mcp - 获取所有 MCP 服务列表
 * POST /api/mcp - 创建 MCP 服务
 * PUT /api/mcp - 更新 MCP 服务
 * DELETE /api/mcp - 删除 MCP 服务
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import {
  successResponse,
  errorResponse,
  handleError,
  validateRequiredFields,
} from '@/lib/api/response';
import type {
  McpServerResponse,
  CreateMcpServerRequest,
  UpdateMcpServerRequest,
  TestMcpServerResponse,
} from '@/lib/api/mcp-types';

/**
 * 解析工具 JSON 字符串
 */
function parseTools(toolsJson: string): string[] {
  try {
    const parsed = JSON.parse(toolsJson) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * GET /api/mcp - 获取所有 MCP 服务列表
 */
export async function GET(): Promise<NextResponse<McpServerResponse>> {
  try {
    const servers = await prisma.mcpServer.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const data = servers.map((server) => ({
      id: server.id,
      name: server.name,
      url: server.url,
      enabled: server.enabled,
      status: server.status,
      tools: parseTools(server.tools),
      createdAt: server.createdAt.toISOString(),
      updatedAt: server.updatedAt.toISOString(),
    }));

    return successResponse(data);
  } catch (error) {
    return handleError(error, '获取 MCP 服务列表');
  }
}

/**
 * POST /api/mcp - 创建 MCP 服务
 */
export async function POST(
  request: Request,
): Promise<NextResponse<McpServerResponse>> {
  try {
    const body = (await request.json()) as CreateMcpServerRequest;
    const { name, url, enabled } = body;

    // 验证必填字段
    const validationError = validateRequiredFields({ name, url });
    if (validationError) {
      return validationError as unknown as NextResponse<McpServerResponse>;
    }

    const existing = await prisma.mcpServer.findUnique({
      where: { name },
    });

    if (existing) {
      return errorResponse('MCP 服务名称已存在', 'DUPLICATE_KEY', 409);
    }

    const newServer = await prisma.mcpServer.create({
      data: {
        name,
        url,
        enabled: enabled ?? true,
        status: 'disconnected',
        tools: '[]',
      },
    });

    return successResponse(
      {
        id: newServer.id,
        name: newServer.name,
        url: newServer.url,
        enabled: newServer.enabled,
        status: newServer.status,
        tools: parseTools(newServer.tools),
        createdAt: newServer.createdAt.toISOString(),
        updatedAt: newServer.updatedAt.toISOString(),
      },
      201,
    );
  } catch (error) {
    return handleError(error, '创建 MCP 服务');
  }
}

/**
 * PUT /api/mcp - 更新 MCP 服务
 */
export async function PUT(
  request: Request,
): Promise<NextResponse<McpServerResponse>> {
  try {
    const body = (await request.json()) as UpdateMcpServerRequest;
    const { id, name, url, enabled, status, tools } = body;

    if (!id) {
      return errorResponse('缺少 ID 字段', 'MISSING_ID', 400);
    }

    const existing = await prisma.mcpServer.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse('MCP 服务不存在', 'NOT_FOUND', 404);
    }

    if (name && name !== existing.name) {
      const duplicateCheck = await prisma.mcpServer.findUnique({
        where: { name },
      });
      if (duplicateCheck && duplicateCheck.id !== id) {
        return errorResponse('MCP 服务名称已存在', 'DUPLICATE_KEY', 409);
      }
    }

    const updatedServer = await prisma.mcpServer.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(url !== undefined && { url }),
        ...(enabled !== undefined && { enabled }),
        ...(status !== undefined && { status }),
        ...(tools !== undefined && { tools: JSON.stringify(toools) }),
      },
    });

    return successResponse({
      id: updatedServer.id,
      name: updatedServer.name,
      url: updatedServer.url,
      enabled: updatedServer.enabled,
      status: updatedServer.status,
      tools: parseTools(updatedServer.tools),
      createdAt: updatedServer.createdAt.toISOString(),
      updatedAt: updatedServer.updatedAt.toISOString(),
    });
  } catch (error) {
    return handleError(error, '更新 MCP 服务');
  }
}

/**
 * DELETE /api/mcp - 删除 MCP 服务
 */
export async function DELETE(
  request: Request,
): Promise<NextResponse<McpServerResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('缺少 ID 参数', 'MISSING_ID', 400);
    }

    const existing = await prisma.mcpServer.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse('MCP 服务不存在', 'NOT_FOUND', 404);
    }

    await prisma.mcpServer.delete({ where: { id } });

    return successResponse({ id });
  } catch (error) {
    return handleError(error, '删除 MCP 服务');
  }
}

/**
 * POST /api/mcp/test - 测试 MCP 服务连通性
 */
export async function testMcp(
  request: Request,
): Promise<NextResponse<TestMcpServerResponse>> {
  try {
    const body = (await request.json()) as { url: string };
    const { url } = body;

    if (!url) {
      return errorResponse('缺少 URL 参数', 'MISSING_URL', 400);
    }

    const startTime = Date.now();

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      const latency = Date.now() - startTime;

      if (response.ok) {
        return successResponse({
          connected: true,
          latency,
          message: `连接成功，响应时间 ${String(latency)}ms`,
        });
      }

      return successResponse({
        connected: false,
        latency,
        message: `连接失败：HTTP ${String(response.status)}`,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      return successResponse({
        connected: false,
        message: `连接超时或失败：${errorMessage}`,
      });
    }
  } catch (error) {
    return handleError(error, '测试请求');
  }
}
