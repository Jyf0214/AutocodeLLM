/**
 * Discord 斜杠命令处理器
 * /connect — 生成绑定码，用户在 Web 端输入完成绑定
 */
import type { ChatInputCommandInteraction } from 'discord.js';
import { randomBytes } from 'crypto';
import prisma from '@/lib/db/prisma';

/** 生成 6 位随机绑定码 */
function generateBindingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去除易混淆字符 I/O/0/1
  let code = '';
  const bytes = randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i]! % chars.length];
  }
  return code;
}

/** 处理 /connect 命令 */
export async function handleConnectCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const discordUserId = interaction.user.id;
  const discordUserName = interaction.user.username;

  try {
    // 检查是否已有绑定
    const existing = await prisma.discordBinding.findUnique({
      where: { discordUserId },
      include: { workspace: { select: { name: true } } },
    });

    if (existing && !existing.code) {
      // 已完成绑定
      await interaction.reply({
        content: `✅ 你已绑定到工作区「${existing.workspace.name}」。如需重新绑定，请先在 Web 端解绑。`,
        ephemeral: true,
      });
      return;
    }

    // 生成新绑定码（10 分钟有效）
    const code = generateBindingCode();
    const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    if (existing) {
      // 更新已有记录的绑定码
      await prisma.discordBinding.update({
        where: { id: existing.id },
        data: { code, codeExpiresAt },
      });
    } else {
      // 创建新记录（workspaceId 临时占位，Web 端确认时更新）
      await prisma.discordBinding.create({
        data: {
          discordUserId,
          discordUserName,
          workspaceId: 'pending', // 待 Web 端确认时覆盖
          code,
          codeExpiresAt,
        },
      });
    }

    await interaction.reply({
      content:
        `🔗 **绑定码**: \`${code}\`\n\n` +
        `请在 AutocodeLLM Web 端「频道管理」页面输入此绑定码完成绑定。\n` +
        `⏰ 绑定码 10 分钟内有效。`,
      ephemeral: true,
    });
  } catch (error) {
    console.error('[Discord] /connect 命令处理失败:', error);
    await interaction.reply({
      content: '❌ 生成绑定码失败，请稍后重试。',
      ephemeral: true,
    });
  }
}
