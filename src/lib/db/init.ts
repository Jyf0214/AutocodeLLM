/**
 * 数据库初始化脚本
 * 创建默认管理员账户和默认聊天配置
 */

import { createHash } from 'node:crypto';
import { prisma } from './prisma';

/**
 * 默认管理员密码（仅用于初次安装）
 */
const DEFAULT_PASSWORD = 'admin123';

/**
 * 主函数：初始化数据库
 */
async function main(): Promise<void> {
  console.log('开始初始化数据库...\n');

  try {
    // 1. 创建默认管理员账户
    await initializeAdminUser();

    // 2. 创建默认聊天配置
    await initializeChatConfig();

    console.log('\n✅ 数据库初始化完成！');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * 初始化管理员用户
 */
async function initializeAdminUser(): Promise<void> {
  const existingUser = await prisma.user.findUnique({
    where: { username: 'admin' },
  });

  if (existingUser) {
    console.log('⏭️ 管理员账户已存在');
    return;
  }

  const passwordHash = createHash('sha256')
    .update(DEFAULT_PASSWORD)
    .digest('hex');

  await prisma.user.create({
    data: {
      username: 'admin',
      passwordHash,
      forceChangePassword: true,
      isInitialPassword: true,
    },
  });

  console.log('✅ 创建默认管理员账户 (username: admin)');
  console.log(`🔑 密码：${DEFAULT_PASSWORD}`);
  console.log('⚠️  首次登录后将强制修改密码\n');
}

/**
 * 初始化聊天配置
 */
async function initializeChatConfig(): Promise<void> {
  const existingConfig = await prisma.chatConfig.findFirst();

  if (existingConfig) {
    console.log('⏭️  聊天配置已存在');
    return;
  }

  await prisma.chatConfig.create({
    data: {
      temperature: 0.7,
      maxTokens: 4096,
      topP: 1.0,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
      maxToolCallsPerMessage: 10,
      enableStreaming: true,
      enableFunctionCall: true,
    },
  });

  console.log('✅ 创建默认聊天配置\n');
}

// 执行初始化
main().catch((e: unknown) => {
  const message = e instanceof Error ? e.message : String(e);
  console.error('数据库初始化失败:', message);
  process.exit(1);
});
