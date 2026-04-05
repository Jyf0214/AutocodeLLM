/**
 * 数据库同步脚本
 * 使用 Prisma db push 进行 schema 同步
 */

import { execSync } from 'node:child_process';

export async function runMigration() {
  try {
    console.log('  执行 Prisma db push...');
    execSync('bunx prisma db push', { stdio: 'inherit' });
    console.log('  ✅ 数据库同步完成');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Prisma db push 失败: ${message}`);
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
