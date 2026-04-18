/**
 * 断开 Discord Bot
 * POST /api/discord/disconnect
 */
import { disconnectDiscordBot } from '@/lib/discord/bot';
import { successResponse, handleError } from '@/lib/api/response';

export async function POST() {
  try {
    await disconnectDiscordBot();
    return successResponse({ disconnected: true });
  } catch (error) {
    return handleError(error, '断开 Discord Bot');
  }
}
