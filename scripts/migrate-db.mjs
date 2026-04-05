#!/usr/bin/env node

/**
 * 数据库迁移脚本
 * 运行 Prisma migrate deploy 并初始化默认数据
 */

import { execSync } from 'node:child_process';

console.log('========================================');
console.log('开始数据库迁移...');
console.log('========================================');

try {
  // 1. 运行 Prisma db push
  console.log('执行 Prisma db push...');
  execSync('bunx prisma db push', { stdio: 'inherit' });
  console.log('✅ 数据库同步完成');

  // 2. 生成 Prisma Client
  console.log('生成 Prisma Client...');
  execSync('bunx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma Client 生成完成');

  // 3. 初始化默认数据
  console.log('初始化默认数据...');
  execSync('bun run src/lib/db/init.ts', { stdio: 'inherit' });

  console.log('========================================');
  console.log('✅ 数据库设置完成！');
  console.log('========================================');
} catch (error) {
  console.error('❌ 数据库迁移失败:', error.message);
  process.exit(1);
}
