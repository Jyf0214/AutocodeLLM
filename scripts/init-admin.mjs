/**
 * 初始化管理员账户
 * - 仅在账户不存在时创建
 * - 绝不删除或重建已存在的账户
 */

import { createHash } from 'node:crypto';
import { prisma } from '../src/lib/db/prisma.js';

const DEFAULT_PASSWORD = 'admin123';

export async function initAdminAccount() {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { username: 'admin' },
    });

    if (!existingUser) {
      // 仅在全新安装时创建
      const passwordHash = createHash('sha256').update(DEFAULT_PASSWORD).digest('hex');

      await prisma.user.create({
        data: {
          username: 'admin',
          passwordHash,
          forceChangePassword: true,
          isInitialPassword: true,
        },
      });
      console.log('  ✅ 已创建默认管理员账户（admin）');
    } else {
      // 账户已存在，诊断输出
      console.log('  ℹ️  管理员账户（admin）已存在');
      console.log(`  📊 当前状态: forceChangePassword=${existingUser.forceChangePassword}, isInitialPassword=${existingUser.isInitialPassword}`);
      console.log('  ⚠️  此代码不会修改已有账户的密码');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`  ⚠️  初始化管理员账户失败: ${message}`);
  } finally {
    await prisma.$disconnect();
  }
}
