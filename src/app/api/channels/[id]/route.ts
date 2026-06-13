/**
 * 频道详情 / 更新 / 删除
 * GET / PUT / DELETE /api/channels/[id]
 */
import { NextRequest } from 'next/server';
import { withApiLogging } from '@/lib/log';
import { successResponse, errorResponse, handleError, parseJsonBody, isErrorResponse } from '@/lib/api/response';
import type { UpdateChannelRequest } from '@/lib/api/channel-types';
import { getPrisma } from '@/lib/db/get-prisma';



interface RouteParams {
  params: Promise<{ id: string }>;
}

/** 获取频道详情 */
export const GET = withApiLogging('GET channels/:id', async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const db = await getPrisma();
    const channel = await db.channel.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        _count: { select: { messages: true } },
      },
    });

    if (!channel) {
      return errorResponse('频道不存在', 'NOT_FOUND', 404);
    }

    return successResponse(channel);
  } catch (error) {
    return handleError(error, '获取频道详情');
  }
});

/** 更新频道 */
export const PUT = withApiLogging('PUT channels/:id', async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await parseJsonBody<UpdateChannelRequest>(request);
    if (isErrorResponse(body)) return body;

    const db = await getPrisma();
    const channel = await db.channel.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.enabled !== undefined && { enabled: body.enabled }),
        ...(body.type !== undefined && { type: body.type }),
      },
    });

    return successResponse(channel);
  } catch (error) {
    return handleError(error, '更新频道');
  }
});

/** 删除频道 */
export const DELETE = withApiLogging('DELETE channels/:id', async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const db = await getPrisma();
    await db.channel.delete({ where: { id } });
    return successResponse({ deleted: true });
  } catch (error) {
    return handleError(error, '删除频道');
  }
});
