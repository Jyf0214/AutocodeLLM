/**
 * 初始化管理员账户
 * - 全新安装：生成 40 位数字密码，明文打印，存储哈希
 * - 旧版本升级：强制删除旧账户，重新创建
 * - 有 isInitialPassword 标志：启动时打印明文密码
 * - 登录后强制修改密码，修改后清除标志
 */

import { randomBytes, createHash } from 'node:crypto';
import { prisma } from '../src/lib/db/prisma.js';

/**
 * 生成 40 位数字密码
 */
function generateNumericPassword(length = 40) {
  const bytes = randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += (bytes[i] % 10).toString();
  }
  return password;
}

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

    if (!existingUser) {
      // 情况 1：全新安装 - 创建默认管理员账户
      const defaultPassword = generateNumericPassword(40);
      const passwordHash = createHash('sha256').update(defaultPassword).digest('hex');

      const newUser = await prisma.user.create({
        data: {
          username: 'admin',
          passwordHash,
          forceChangePassword: true,
          isInitialPassword: true,
        },
      });

      // 保存明文密码到内存（仅用于打印）
      console.log('  ✅ 创建默认管理员账户');
      console.log('  ⚠️  用户名: admin');
      console.log(`  🔑 密码: ${defaultPassword}`);
      console.log('  ⚠️  首次登录后将强制修改密码');

      // 将明文密码附加到用户对象（仅用于本次启动打印）
      existingUser = { ...newUser, _plainPassword: defaultPassword };
    } else if (existingUser.isInitialPassword && isHashedPassword(existingUser.passwordHash)) {
      // 情况 2：已有 isInitialPassword 标志，但密码是哈希（从数据库恢复或重启）
      // 无法还原明文密码，强制删除重建
      console.log('  ⚠️  检测到初始密码冲突，重新生成管理员账户...');

      await prisma.user.delete({
        where: { username: 'admin' },
      });

      const defaultPassword = generateNumericPassword(40);
      const passwordHash = createHash('sha256').update(defaultPassword).digest('hex');

      const newUser = await prisma.user.create({
        data: {
          username: 'admin',
          passwordHash,
          forceChangePassword: true,
          isInitialPassword: true,
        },
      });

      console.log('  ✅ 重新生成管理员账户');
      console.log('  ⚠️  用户名: admin');
      console.log(`  🔑 密码: ${defaultPassword}`);
      console.log('  ⚠️  首次登录后将强制修改密码');

      existingUser = { ...newUser, _plainPassword: defaultPassword };
    } else if (!existingUser.isInitialPassword || existingUser.isInitialPassword === false) {
      // 情况 3：旧版本升级 - 管理员账户存在但没有 isInitialPassword 标志
      console.log('  ⚠️  检测到旧版本管理员账户，强制重建...');

      await prisma.user.delete({
        where: { username: 'admin' },
      });

      const defaultPassword = generateNumericPassword(40);
      const passwordHash = createHash('sha256').update(defaultPassword).digest('hex');

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
      console.log(`  🔑 密码: ${defaultPassword}`);
      console.log('  ⚠️  首次登录后将强制修改密码');
    } else {
      // 情况 4：正常运行，isInitialPassword 为 true（首次启动后已打印过密码）
      console.log('  ⏭️  管理员账户已存在，等待首次登录修改密码');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`  ⚠️  初始化管理员账户失败: ${message}`);
  } finally {
    await prisma.$disconnect();
  }
}
