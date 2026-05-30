/**
 * 频道列表 / 创建
 * GET /api/channels?projectId=xxx
 * POST /api/channels
 */
import { NextRequest } from 'next/server';
import { withApiLogging } from '@/lib/log';
import {
  successResponse,
  errorResponse,
  handleError,
  validateRequiredFields,
  parseJsonBody,
  isErrorResponse,
} from '@/lib/api/response';
import type { CreateChannelRequest } from '@/lib/api/channel-types';

// 惰性获取 Prisma（动态 import 避免模块加载时实例化，构建阶段不会因 DATABASE_URL 未设置而崩溃）
async function getPrisma() {
  const { default: prisma } = await import('@/lib/db/prisma');
  return prisma;
}


/** 获取频道列表 */
export const GET = withApiLogging('GET channels', async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const projectId = searchParams.get('projectId');

    const db = await getPrisma();
    const channels = await db.channel.findMany({
      where: projectId ? { projectId } : undefined,
      include: {
        project: { select: { id: true, name: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(channels);
  } catch (error) {
    return handleError(error, '获取频道列表');
  }
});

/** 创建频道 */
export const POST = withApiLogging('POST channels', async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody<CreateChannelRequest>(request);
    if (isErrorResponse(body)) return body;

    const validation = validateRequiredFields({
      projectId: body.projectId,
      name: body.name,
      discordGuildId: body.discordGuildId,
      discordChannelId: body.discordChannelId,
    });
    if (validation) return validation;

    const db = await getPrisma();

    // 检查项目是否存在
    const project = await db.project.findUnique({
      where: { id: body.projectId },
    });
    if (!project) {
      return errorResponse('项目不存在', 'NOT_FOUND', 404);
    }

    // 检查 Discord 频道是否已绑定
    const existing = await db.channel.findUnique({
      where: { discordChannelId: body.discordChannelId },
    });
    if (existing) {
      return errorResponse('该 Discord 频道已被绑定', 'ALREADY_BOUND', 409);
    }

    const channel = await db.channel.create({
      data: {
        projectId: body.projectId,
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
});
