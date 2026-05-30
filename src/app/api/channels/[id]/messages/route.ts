/**
 * 频道消息历史 / 发送消息
 * GET / POST /api/channels/[id]/messages
 */
import { NextRequest } from 'next/server';
import { withApiLogging } from '@/lib/log';
import { successResponse, paginatedResponse, errorResponse, handleError, parseJsonBody, isErrorResponse } from '@/lib/api/response';
import { sendMessageToChannel } from '@/lib/discord/bot';
import type { SendMessageRequest } from '@/lib/api/channel-types';

// 惰性获取 Prisma（动态 import 避免模块加载时实例化，构建阶段不会因 DATABASE_URL 未设置而崩溃）
async function getPrisma() {
  const { default: prisma } = await import('@/lib/db/prisma');
  return prisma;
}


interface RouteParams {
  params: Promise<{ id: string }>;
}

/** 获取频道消息历史（分页） */
export const GET = withApiLogging('GET channels/:id/messages', async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '50')));

    // 检查频道是否存在
    const db = await getPrisma();
    const channel = await db.channel.findUnique({ where: { id } });
    if (!channel) {
      return errorResponse('频道不存在', 'NOT_FOUND', 404);
    }

    const [messages, total] = await Promise.all([
      db.channelMessage.findMany({
        where: { channelId: id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.channelMessage.count({ where: { channelId: id } }),
    ]);

    return paginatedResponse(messages, total, page, limit);
  } catch (error) {
    return handleError(error, '获取消息历史');
  }
});

/** 发送消息到 Discord 频道 */
export const POST = withApiLogging('POST channels/:id/messages', async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await parseJsonBody<SendMessageRequest>(request);
    if (isErrorResponse(body)) return body;

    if (!body.content.trim()) {
      return errorResponse('消息内容不能为空', 'EMPTY_CONTENT', 400);
    }

    // 查找频道
    const db = await getPrisma();
    const channel = await db.channel.findUnique({ where: { id } });
    if (!channel) {
      return errorResponse('频道不存在', 'NOT_FOUND', 404);
    }

    if (!channel.enabled) {
      return errorResponse('频道已禁用', 'CHANNEL_DISABLED', 400);
    }

    // 发送到 Discord
    const result = await sendMessageToChannel(channel.discordChannelId, body.content);
    if (!result.success) {
      return errorResponse(result.error ?? '发送失败', 'SEND_FAILED', 500);
    }

    // 持久化发出的消息
    const botStatus = await import('@/lib/discord/bot').then((m) => m.getDiscordBotStatus());
    const message = await db.channelMessage.create({
      data: {
        channelId: id,
        discordMsgId: result.messageId ?? '',
        authorId: 'app',
        authorName: botStatus.tag ?? 'AutocodeLLM Bot',
        authorAvatar: null,
        content: body.content,
        attachments: null,
        sentFromApp: true,
      },
    });

    return successResponse(message, 201);
  } catch (error) {
    return handleError(error, '发送频道消息');
  }
});
