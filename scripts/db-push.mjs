/**
 * 数据库同步脚本
 * 使用 Prisma db push 进行 schema 同步
 */

import { execSync } from 'node:child_process';

export async function runDbPush() {
  try {
    console.log('  正在检查数据库同步状态 (Prisma db push)...');
    // 使用 npx 替代 bunx，确保在所有环境中可用
    execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
    console.log('  ✅ 数据库结构已同步');
  } catch (error) {
    // 如果同步失败，通常是因为 Prisma 检测到了破坏性变更
    console.error('\n  ⚠️ 数据库同步警告: 同步可能存在数据丢失风险，已自动终止以保护数据。');
    console.error('  提示: 如果您确定要应用变更且不在乎数据丢失，请手动运行 npx prisma db push --accept-data-loss');
    console.log('  ℹ️ 尝试跳过同步并继续启动应用...\n');
    // 这里不抛出错误，允许应用尝试在现有结构上启动
  }
}

export function generatePrismaClient() {
  try {
    console.log('  生成 Prisma Client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('  ✅ Prisma Client 生成完成');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Prisma generate 失败: ${message}`);
  }
}

// 支持直接执行：bun run scripts/db-push.mjs
if (process.argv[1] && process.argv[1].endsWith('db-push.mjs')) {
  console.log('========================================');
  console.log('开始数据库迁移...');
  console.log('========================================');

  (async () => {
    try {
      await runDbPush();
      generatePrismaClient();
      console.log('========================================');
      console.log('✅ 数据库设置完成！');
      console.log('========================================');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('❌ 数据库迁移失败:', message);
      process.exit(1);
    }
  })();
}
