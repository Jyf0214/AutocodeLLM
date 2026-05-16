/**
 * 获取 Discord 服务器的频道列表
 * GET /api/discord/guilds/[guildId]/channels
 */
import { getDiscordGuildChannels } from '@/lib/discord/bot';
import { withApiLogging } from '@/lib/log';
import { successResponse, errorResponse, handleError } from '@/lib/api/response';

interface RouteParams {
  params: Promise<{ guildId: string }>;
}

export const GET = withApiLogging('GET discord/guilds/:guildId/channels', async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { guildId } = await params;

    const channels = await getDiscordGuildChannels(guildId);

    if (channels.length === 0) {
      return errorResponse('未找到频道或 Bot 未连接', 'NO_CHANNELS', 404);
    }

    return successResponse(channels);
  } catch (error) {
    return handleError(error, '获取 Discord 频道列表');
  }
});
