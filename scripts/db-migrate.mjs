/**
 * 数据库迁移脚本
 */

import { execSync } from 'node:child_process';

export async function runMigration() {
  try {
    console.log('  执行 Prisma migrate deploy...');
    execSync('bunx prisma migrate deploy', { stdio: 'inherit' });
    console.log('  ✅ 数据库迁移完成');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Prisma migrate deploy 失败: ${message}`);
  }
}

export function generatePrismaClient() {
  try {
    console.log('  生成 Prisma Client...');
    execSync('bunx prisma generate', { stdio: 'inherit' });
    console.log('  ✅ Prisma Client 生成完成');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Prisma generate 失败: ${message}`);
  }
}
