/**
 * 数据库初始化脚本
 * 创建默认管理员账户和默认聊天配置
 */

import { prisma } from './prisma';
import { hash } from 'node:crypto';

async function main() {
  console.log('开始初始化数据库...');

  // 1. 创建默认管理员账户
  const existingUser = await prisma.user.findUnique({
    where: { username: 'admin' },
  });

  if (!existingUser) {
    // 使用 SHA-256 哈希密码（生产环境应使用 bcrypt）
    const defaultPassword = 'admin123';
    const passwordHash = hash('sha256', defaultPassword);

    await prisma.user.create({
      data: {
        username: 'admin',
        passwordHash,
        forceChangePassword: true,
        isInitialPassword: true,
      },
    });
    console.log('✅ 创建默认管理员账户 (username: admin, password: admin123)');
  } else {
    console.log('⏭️  管理员账户已存在');
  }

  // 2. 创建默认聊天配置
  const existingConfig = await prisma.chatConfig.findFirst();

  if (!existingConfig) {
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
    console.log('✅ 创建默认聊天配置');
  } else {
    console.log('⏭️  聊天配置已存在');
  }

  console.log('数据库初始化完成！');
}

main()
  .catch((e: unknown) => {
    const message = e instanceof Error ? e.message : String(e);
    console.error('数据库初始化失败:', message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
