import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import type {
  McpServerResponse,
  CreateMcpServerRequest,
  UpdateMcpServerRequest,
  TestMcpServerRequest,
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
export async function GET() {
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

    return NextResponse.json({
      success: true,
      data,
    } as McpServerResponse);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '获取 MCP 服务列表失败',
          code: 'FETCH_FAILED',
        },
      } as McpServerResponse,
      { status: 500 }
    );
  }
}

/**
 * POST /api/mcp - 创建 MCP 服务
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateMcpServerRequest;
    const { name, url, enabled } = body;

    if (!name || !url) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '缺少必填字段：name, url',
            code: 'MISSING_FIELDS',
          },
        } as McpServerResponse,
        { status: 400 }
      );
    }

    const existing = await prisma.mcpServer.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'MCP 服务名称已存在',
            code: 'DUPLICATE_KEY',
          },
        } as McpServerResponse,
        { status: 409 }
      );
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

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newServer.id,
          name: newServer.name,
          url: newServer.url,
          enabled: newServer.enabled,
          status: newServer.status,
          tools: parseTools(newServer.tools),
          createdAt: newServer.createdAt.toISOString(),
          updatedAt: newServer.updatedAt.toISOString(),
        },
      } as McpServerResponse,
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '创建 MCP 服务失败',
          code: 'CREATE_FAILED',
        },
      } as McpServerResponse,
      { status: 500 }
    );
  }
}

/**
 * PUT /api/mcp - 更新 MCP 服务
 */
export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as UpdateMcpServerRequest;
    const { id, name, url, enabled, status, tools } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '缺少 ID 字段',
            code: 'MISSING_ID',
          },
        } as McpServerResponse,
        { status: 400 }
      );
    }

    const existing = await prisma.mcpServer.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'MCP 服务不存在',
            code: 'NOT_FOUND',
          },
        } as McpServerResponse,
        { status: 404 }
      );
    }

    if (name && name !== existing.name) {
      const duplicateCheck = await prisma.mcpServer.findUnique({
        where: { name },
      });

      if (duplicateCheck && duplicateCheck.id !== id) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'MCP 服务名称已存在',
              code: 'DUPLICATE_KEY',
            },
          } as McpServerResponse,
          { status: 409 }
        );
      }
    }

    const updatedServer = await prisma.mcpServer.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(url !== undefined && { url }),
        ...(enabled !== undefined && { enabled }),
        ...(status !== undefined && { status }),
        ...(tools !== undefined && { tools: JSON.stringify(tools) }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedServer.id,
        name: updatedServer.name,
        url: updatedServer.url,
        enabled: updatedServer.enabled,
        status: updatedServer.status,
        tools: parseTools(updatedServer.tools),
        createdAt: updatedServer.createdAt.toISOString(),
        updatedAt: updatedServer.updatedAt.toISOString(),
      },
    } as McpServerResponse);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '更新 MCP 服务失败',
          code: 'UPDATE_FAILED',
        },
      } as McpServerResponse,
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/mcp - 删除 MCP 服务
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
        } as McpServerResponse,
        { status: 400 }
      );
    }

    const existing = await prisma.mcpServer.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'MCP 服务不存在',
            code: 'NOT_FOUND',
          },
        } as McpServerResponse,
        { status: 404 }
      );
    }

    await prisma.mcpServer.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { id },
    } as McpServerResponse);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '删除 MCP 服务失败',
          code: 'DELETE_FAILED',
        },
      } as McpServerResponse,
      { status: 500 }
    );
  }
}

/**
 * POST /api/mcp/test - 测试 MCP 服务连通性
 */
export async function testMcp(request: Request) {
  try {
    const body = (await request.json()) as TestMcpServerRequest;
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '缺少 URL 参数',
            code: 'MISSING_URL',
          },
        } as TestMcpServerResponse,
        { status: 400 }
      );
    }

    const startTime = Date.now();

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      const latency = Date.now() - startTime;

      if (response.ok) {
        return NextResponse.json({
          success: true,
          data: {
            connected: true,
            latency,
            message: `连接成功，响应时间 ${String(latency)}ms`,
          },
        } as TestMcpServerResponse);
      }

      return NextResponse.json({
        success: true,
        data: {
          connected: false,
          latency,
          message: `连接失败：HTTP ${String(response.status)}`,
        },
      } as TestMcpServerResponse);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      return NextResponse.json(
        {
          success: true,
          data: {
            connected: false,
            message: `连接超时或失败：${errorMessage}`,
          },
        } as TestMcpServerResponse
      );
    }
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '测试请求失败',
          code: 'TEST_FAILED',
        },
      } as TestMcpServerResponse,
      { status: 500 }
    );
  }
}
