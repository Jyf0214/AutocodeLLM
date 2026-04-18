/**
 * 频道列表 / 创建
 * GET /api/channels?workspaceId=xxx
 * POST /api/channels
 */
import { NextRequest } from 'next/server';
import prisma from '@/lib/db/prisma';
import {
  successResponse,
  errorResponse,
  handleError,
  validateRequiredFields,
  parseJsonBody,
  isErrorResponse,
} from '@/lib/api/response';
import type { CreateChannelRequest } from '@/lib/api/channel-types';

/** 获取频道列表 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const workspaceId = searchParams.get('workspaceId');

    const channels = await prisma.channel.findMany({
      where: workspaceId ? { workspaceId } : undefined,
      include: {
        workspace: { select: { id: true, name: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(channels);
  } catch (error) {
    return handleError(error, '获取频道列表');
  }
}

/** 创建频道 */
export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody<CreateChannelRequest>(request);
    if (isErrorResponse(body)) return body;

    const validation = validateRequiredFields({
      workspaceId: body.workspaceId,
      name: body.name,
      discordGuildId: body.discordGuildId,
      discordChannelId: body.discordChannelId,
    });
    if (validation) return validation;

    // 检查工作区是否存在
    const workspace = await prisma.workspace.findUnique({
      where: { id: body.workspaceId },
    });
    if (!workspace) {
      return errorResponse('工作区不存在', 'NOT_FOUND', 404);
    }

    // 检查 Discord 频道是否已绑定
    const existing = await prisma.channel.findUnique({
      where: { discordChannelId: body.discordChannelId },
    });
    if (existing) {
      return errorResponse('该 Discord 频道已被绑定', 'ALREADY_BOUND', 409);
    }

    const channel = await prisma.channel.create({
      data: {
        workspaceId: body.workspaceId,
        name: body.name,
        discordGuildId: body.discordGuildId,
        discordChannelId: body.discordChannelId,
        type: body.type ?? 'TEXT',
      },
    });

    return successResponse(channel, 201);
  } catch (error) {
    return handleError(error, '创建频道');
  }
}
