/**
 * 连接 Discord Bot
 * POST /api/discord/connect
 */
import { connectDiscordBot } from '@/lib/discord/bot';
import { withApiLogging } from '@/lib/log';
import { successResponse, errorResponse, handleError, parseJsonBody, isErrorResponse } from '@/lib/api/response';

interface ConnectRequest {
  token: string;
}

export const POST = withApiLogging('POST discord/connect', async function POST(request: Request) {
  try {
    const body = await parseJsonBody<ConnectRequest>(request);
    if (isErrorResponse(body)) return body;

    if (!body.token.trim()) {
      return errorResponse('Bot Token 不能为空', 'EMPTY_TOKEN', 400);
    }

    const result = await connectDiscordBot(body.token.trim());

    if (!result.success) {
      return errorResponse(result.error ?? '连接失败', 'CONNECT_FAILED', 400);
    }

    return successResponse({ tag: result.tag });
  } catch (error) {
    return handleError(error, '连接 Discord Bot');
  }
});
