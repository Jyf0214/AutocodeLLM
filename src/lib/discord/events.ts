/**
 * Discord 事件处理器
 * 处理 messageCreate 事件，将消息持久化到数据库
 */
import type { Message } from 'discord.js';

// 惰性获取 Prisma（动态 import 避免模块加载时实例化，构建阶段不会因 DATABASE_URL 未设置而崩溃）
async function getPrisma() {
  const { default: prisma } = await import('@/lib/db/prisma');
  return prisma;
}

/** 处理 Discord 新消息事件 */
export async function handleDiscordMessage(message: Message): Promise<void> {
  // 忽略 Bot 自身消息
  if (message.author.bot) return;

  // 检查该频道是否已绑定
  const db = await getPrisma();
  const channel = await db.channel.findUnique({
    where: { discordChannelId: message.channelId },
  });

  if (!channel || !channel.enabled) return;

  try {
    // 提取附件 URL
    const attachments = message.attachments.size > 0
      ? JSON.stringify(message.attachments.map((a) => a.url))
      : null;

    // 写入消息记录
    await db.channelMessage.upsert({
      where: { discordMsgId: message.id },
      create: {
        channelId: channel.id,
        discordMsgId: message.id,
        authorId: message.author.id,
        authorName: message.author.username,
        authorAvatar: message.author.displayAvatarURL({ size: 64 }),
        content: message.content,
        attachments,
        sentFromApp: false,
      },
      update: {
        content: message.content,
        attachments,
      },
    });

    // 更新频道最后同步时间
    await db.channel.update({
      where: { id: channel.id },
      data: { lastSyncedAt: new Date() },
    });
  } catch (error) {
    console.error('[Discord] 消息持久化失败:', error);
  }
}
