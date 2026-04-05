/**
 * 初始化管理员账户
 * - 仅在账户不存在时创建
 * - 绝不删除或重建已存在的账户
 * - 启动时输出密码审计日志
 */

import { createHash } from 'node:crypto';
import { prisma } from '../src/lib/db/prisma.js';

const DEFAULT_PASSWORD = 'admin123';

/**
 * 输出密码审计日志
 */
async function printPasswordAudit() {
  try {
    const audits = await prisma.passwordAudit.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { user: { select: { username: true } } },
    });

    if (audits.length === 0) {
      console.log('  📋 暂无密码审计记录');
      return;
    }

    console.log('\n========================================');
    console.log('  🔐 密码审计日志（最近 20 条）');
    console.log('========================================');

    for (const audit of audits) {
      const time = new Date(audit.createdAt).toLocaleString('zh-CN');
      console.log(`\n  [${time}] ${audit.action}`);
      console.log(`    用户: ${audit.user.username}`);
      console.log(`    结果: ${audit.success ? '✅ 成功' : '❌ 失败'}`);
      if (audit.submittedHash) {
        console.log(`    提交哈希: ${audit.submittedHash}`);
      }
      if (audit.storedHash) {
        console.log(`    系统哈希: ${audit.storedHash}`);
      }
      if (audit.message) {
        console.log(`    消息: ${audit.message}`);
      }
    }

    console.log('\n========================================\n');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`  ⚠️  读取密码审计日志失败: ${message}`);
  }
}

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
      console.log(`  🔑 密码哈希: ${passwordHash}`);
    } else {
      // 账户已存在，输出诊断信息
      console.log('  ℹ️  管理员账户（admin）已存在');
      console.log(`  📊 当前状态: forceChangePassword=${existingUser.forceChangePassword}, isInitialPassword=${existingUser.isInitialPassword}`);
      console.log(`  🔑 系统哈希: ${existingUser.passwordHash}`);
    }

    // 输出密码审计日志
    await printPasswordAudit();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`  ⚠️  初始化管理员账户失败: ${message}`);
  } finally {
    await prisma.$disconnect();
  }
}
