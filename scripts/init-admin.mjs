/**
 * 初始化管理员账户
 * - 无管理员账户时自动创建
 * - 已存在时提示"忘记密码请使用验证码登录"
 * - 始终使用默认密码: admin123（不打印）
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
      console.log('  ✅ 已创建默认管理员账户（admin）');
    } else if (!existingUser.isInitialPassword || existingUser.isInitialPassword === false) {
      // 情况 2：旧版本升级 - 没有 isInitialPassword 标志
      console.log('  ⚠️  检测到旧版本管理员账户，正在重建...');

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

      console.log('  ✅ 已重建管理员账户（admin）');
    } else {
      // 情况 3：管理员账户已存在
      console.log('  ℹ️  管理员账户（admin）已存在');
      console.log('  💡 忘记密码请使用验证码登录');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`  ⚠️  初始化管理员账户失败: ${message}`);
  } finally {
    await prisma.$disconnect();
  }
}
