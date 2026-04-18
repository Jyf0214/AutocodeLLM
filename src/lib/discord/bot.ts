/**
 * Discord Bot 全局单例管理
 * 通过 globalThis 管理单实例 Bot 客户端生命周期
 */
import { Client, GatewayIntentBits, type ClientEvents } from 'discord.js';
import { handleDiscordMessage } from './events';

/** 全局 Bot 实例存储类型 */
const globalForDiscord = globalThis as unknown as {
  __discordBot: Client<true> | undefined;
  __discordBotToken: string | undefined;
};

/** 获取当前 Bot 实例（可能为空） */
export function getDiscordBot(): Client<true> | undefined {
  return globalForDiscord.__discordBot;
}

/** 获取 Bot 连接状态 */
export function getDiscordBotStatus(): {
  connected: boolean;
  tag: string | null;
  guilds: number;
} {
  const bot = globalForDiscord.__discordBot;
  if (!bot?.isReady()) {
    return { connected: false, tag: null, guilds: 0 };
  }
  return {
    connected: true,
    tag: bot.user.tag,
    guilds: bot.guilds.cache.size,
  };
}

/** 连接 Discord Bot */
export async function connectDiscordBot(
  token: string,
): Promise<{ success: boolean; tag?: string; error?: string }> {
  // 如果已有实例且 Token 相同，直接返回
  if (globalForDiscord.__discordBot?.isReady() && globalForDiscord.__discordBotToken === token) {
    return { success: true, tag: globalForDiscord.__discordBot.user.tag };
  }

  // 如果已有实例但 Token 不同，先断开
  if (globalForDiscord.__discordBot) {
    await disconnectDiscordBot();
  }

  try {
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    // 注册消息事件
    client.on('messageCreate', handleDiscordMessage);

    // 登录
    await client.login(token);

    // 存储到全局
    globalForDiscord.__discordBot = client as Client<true>;
    globalForDiscord.__discordBotToken = token;

    return { success: true, tag: client.user?.tag };
  } catch (error) {
    const message = error instanceof Error ? error.message : '连接失败';
    return { success: false, error: message };
  }
}

/** 断开 Discord Bot */
export async function disconnectDiscordBot(): Promise<void> {
  const bot = globalForDiscord.__discordBot;
  if (bot) {
    bot.removeAllListeners();
    bot.destroy();
    globalForDiscord.__discordBot = undefined;
    globalForDiscord.__discordBotToken = undefined;
  }
}

/** 获取 Bot 所在服务器的频道列表 */
export async function getDiscordGuildChannels(guildId: string) {
  const bot = globalForDiscord.__discordBot;
  if (!bot?.isReady()) {
    return [];
  }

  try {
    const guild = await bot.guilds.fetch(guildId);
    const channels = await guild.channels.fetch();
    return channels
      .filter((ch): ch is NonNullable<typeof ch> => ch !== null && ch.isTextBased())
      .map((ch) => ({
        id: ch.id,
        name: ch.name,
        type: ch.type,
      }));
  } catch {
    return [];
  }
}

/** 获取 Bot 所在的所有服务器 */
export async function getDiscordGuilds() {
  const bot = globalForDiscord.__discordBot;
  if (!bot?.isReady()) {
    return [];
  }

  return bot.guilds.cache.map((guild) => ({
    id: guild.id,
    name: guild.name,
    icon: guild.iconURL({ size: 64 }),
  }));
}

/** 向指定频道发送消息 */
export async function sendMessageToChannel(
  channelId: string,
  content: string,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const bot = globalForDiscord.__discordBot;
  if (!bot?.isReady()) {
    return { success: false, error: 'Bot 未连接' };
  }

  try {
    const channel = await bot.channels.fetch(channelId);
    if (!channel?.isTextBased()) {
      return { success: false, error: '频道不存在或非文本频道' };
    }

    const message = await channel.send(content);
    return { success: true, messageId: message.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : '发送失败';
    return { success: false, error: message };
  }
}
