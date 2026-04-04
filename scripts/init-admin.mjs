/**
 * 初始化管理员账户
 */

import { createHash } from 'node:crypto';
import { prisma } from '../src/lib/db/prisma.js';

export async function initAdminAccount() {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { username: 'admin' },
    });

    if (!existingUser) {
      const defaultPassword = 'admin123';
      const passwordHash = createHash('sha256').update(defaultPassword).digest('hex');

      await prisma.user.create({
        data: {
          username: 'admin',
          passwordHash,
          forceChangePassword: true,
          isInitialPassword: true,
        },
      });
      console.log('  ✅ 创建默认管理员账户 (username: admin, password: admin123)');
    } else {
      console.log('  ⏭️  管理员账户已存在');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`  ⚠️  初始化管理员账户失败: ${message}`);
  } finally {
    await prisma.$disconnect();
  }
}
