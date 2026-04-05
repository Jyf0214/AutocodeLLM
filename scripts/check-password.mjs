#!/usr/bin/env bun
/**
 * 检查数据库 admin 密码
 */

import { createHash } from 'node:crypto';
import { prisma } from '../src/lib/db/prisma.js';

const ADMIN123_HASH = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';

try {
  const user = await prisma.user.findUnique({
    where: { username: 'admin' },
  });

  if (!user) {
    console.log('❌ admin 用户不存在');
  } else {
    console.log('\n========================================');
    console.log('  🔐 数据库密码检查');
    console.log('========================================');
    console.log(`  数据库哈希: ${user.passwordHash}`);
    console.log(`  admin123 哈希: ${ADMIN123_HASH}`);
    console.log(`  匹配: ${user.passwordHash === ADMIN123_HASH ? '✅ 是' : '❌ 否'}`);
    console.log(`  forceChangePassword: ${user.forceChangePassword}`);
    console.log(`  isInitialPassword: ${user.isInitialPassword}`);
    console.log('========================================\n');
  }
} catch (error) {
  console.error(`❌ 查询失败: ${error.message}`);
} finally {
  await prisma.$disconnect();
}
