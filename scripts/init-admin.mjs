/**
 * 初始化管理员账户
 * 自动创建时生成随机密码并在控制台打印
 * 登录后强制修改密码
 */

import { randomBytes, createHash } from 'node:crypto';
import { prisma } from '../src/lib/db/prisma.js';

/**
 * 生成随机密码
 */
function generatePassword(length = 16) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const bytes = randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

export async function initAdminAccount() {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { username: 'admin' },
    });

    if (!existingUser) {
      // 生成随机初始密码
      const defaultPassword = generatePassword(16);
      const passwordHash = createHash('sha256').update(defaultPassword).digest('hex');

      await prisma.user.create({
        data: {
          username: 'admin',
          passwordHash,
          forceChangePassword: true,
          isInitialPassword: true,
        },
      });
      console.log('  ✅ 创建默认管理员账户');
      console.log('  ⚠️  用户名: admin');
      console.log(`  🔑 密码: ${defaultPassword}`);
      console.log('  ⚠️  首次登录后将强制修改密码');
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
