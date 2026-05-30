/**
 * 初始化管理员账户
 * - 仅在账户不存在时创建
 * - 绝不删除或重建已存在的账户
 *
 * 安全修复：移除硬编码 DEFAULT_PASSWORD
 * - 优先使用 INIT_ADMIN_PASSWORD 环境变量
 * - 未设置时生成随机密码并打印到 stdout
 */

import { createHash, randomBytes } from 'node:crypto';
import { prisma } from '../src/lib/db/prisma.js';

/**
 * 获取初始管理员密码
 * 优先使用环境变量，否则生成随机密码
 */
function getInitialAdminPassword() {
  const envPassword = process.env.INIT_ADMIN_PASSWORD;
  if (envPassword) {
    return envPassword;
  }
  const randomPassword = randomBytes(12).toString('hex');
  console.log('[INIT] 未设置 INIT_ADMIN_PASSWORD，已生成随机密码');
  return randomPassword;
}

export async function initAdminAccount() {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { username: 'admin' },
    });

    if (!existingUser) {
      // 仅在全新安装时创建
      const adminPassword = getInitialAdminPassword();
      const passwordHash = createHash('sha256').update(adminPassword).digest('hex');

      await prisma.user.create({
        data: {
          username: 'admin',
          passwordHash,
          role: 'admin',
          forceChangePassword: true,
          isInitialPassword: true,
        },
      });
      console.log('  ✅ 已创建默认管理员账户（admin）');
      console.log(`  🔑 密码：${adminPassword}`);
      console.log('  ⚠️  首次登录后将强制修改密码');
    } else {
      // 账户已存在
      console.log('  ℹ️  管理员账户（admin）已存在');
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`  ⚠️  初始化管理员账户失败: ${message}`);
  } finally {
    await prisma.$disconnect();
  }
}
