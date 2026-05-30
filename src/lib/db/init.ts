/**
 * 数据库初始化脚本
 * 创建默认管理员账户
 *
 * 安全修复：移除硬编码 DEFAULT_PASSWORD
 * - 优先使用 INIT_ADMIN_PASSWORD 环境变量
 * - 未设置时生成随机密码并打印到 stdout
 */

import { createHash, randomBytes } from 'node:crypto';
import { prisma } from './prisma';

/**
 * 获取初始管理员密码
 * 优先使用环境变量，否则生成随机密码
 */
function getInitialAdminPassword(): string {
  const envPassword = process.env.INIT_ADMIN_PASSWORD;
  if (envPassword) {
    return envPassword;
  }
  const randomPassword = randomBytes(12).toString('hex');
  console.log(`[INIT] 未设置 INIT_ADMIN_PASSWORD，已生成随机密码`);
  return randomPassword;
}

/**
 * 主函数：初始化数据库
 */
async function main(): Promise<void> {
  console.log('开始初始化数据库...\n');

  try {
    // 1. 创建默认管理员账户
    await initializeAdminUser();

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

  const adminPassword = getInitialAdminPassword();

  const passwordHash = createHash('sha256')
    .update(adminPassword)
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
  console.log(`🔑 密码：${adminPassword}`);
  console.log('⚠️  首次登录后将强制修改密码\n');
}

// 执行初始化
main().catch((e: unknown) => {
  const message = e instanceof Error ? e.message : String(e);
  console.error('数据库初始化失败:', message);
  process.exit(1);
});
