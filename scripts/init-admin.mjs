/**
 * 初始化管理员账户
 * - 始终使用默认密码: admin123
 * - 存储哈希，登录时强制修改密码
 * - 旧版本升级：强制删除旧账户，重新创建
 */

import { createHash } from 'node:crypto';
import { prisma } from '../src/lib/db/prisma.js';

const DEFAULT_PASSWORD = 'admin123';

/**
 * 检查密码是否为哈希值（64 位十六进制）
 */
function isHashedPassword(password) {
  return typeof password === 'string' && /^[a-f0-9]{64}$/i.test(password);
}

export async function initAdminAccount() {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { username: 'admin' },
    });

    const passwordHash = createHash('sha256').update(DEFAULT_PASSWORD).digest('hex');

    if (!existingUser) {
      // 情况 1：全新安装
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
      console.log(`  🔑 密码: ${DEFAULT_PASSWORD}`);
      console.log('  ⚠️  首次登录后将强制修改密码');
    } else if (!existingUser.isInitialPassword || existingUser.isInitialPassword === false) {
      // 情况 2：旧版本升级 - 没有 isInitialPassword 标志
      console.log('  ⚠️  检测到旧版本管理员账户，强制重建...');

      await prisma.user.delete({
        where: { username: 'admin' },
      });

      await prisma.user.create({
        data: {
          username: 'admin',
          passwordHash,
          forceChangePassword: true,
          isInitialPassword: true,
        },
      });

      console.log('  ✅ 重建管理员账户');
      console.log('  ⚠️  用户名: admin');
      console.log(`  🔑 密码: ${DEFAULT_PASSWORD}`);
      console.log('  ⚠️  首次登录后将强制修改密码');
    } else {
      // 情况 3：isInitialPassword 为 true，始终打印默认密码
      console.log('  ⚠️  管理员账户存在（初始密码状态）');
      console.log('  ⚠️  用户名: admin');
      console.log(`  🔑 密码: ${DEFAULT_PASSWORD}`);
      console.log('  ⚠️  首次登录后将强制修改密码');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`  ⚠️  初始化管理员账户失败: ${message}`);
  } finally {
    await prisma.$disconnect();
  }
}
