/**
 * Discord Bot 连接状态
 * GET /api/discord/status
 */
import { getDiscordBotStatus, getDiscordGuilds } from '@/lib/discord/bot';
import { withApiLogging } from '@/lib/log';
import { successResponse, handleError } from '@/lib/api/response';

export const GET = withApiLogging('GET discord/status', async function GET() {
  try {
    const status = getDiscordBotStatus();
    const guilds = status.connected ? await getDiscordGuilds() : [];

    return successResponse({
      ...status,
      guildList: guilds,
    });
  } catch (error) {
    return handleError(error, '获取 Bot 状态');
  }
});
