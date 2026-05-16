/**
 * 断开 Discord Bot
 * POST /api/discord/disconnect
 */
import { disconnectDiscordBot } from '@/lib/discord/bot';
import { withApiLogging } from '@/lib/log';
import { successResponse, handleError } from '@/lib/api/response';

export const POST = withApiLogging('POST discord/disconnect', async function POST() {
  try {
    await disconnectDiscordBot();
    return successResponse({ disconnected: true });
  } catch (error) {
    return handleError(error, '断开 Discord Bot');
  }
});
