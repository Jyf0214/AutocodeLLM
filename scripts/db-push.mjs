/**
 * 数据库同步脚本
 * 使用 Prisma db push 进行 schema 同步，含重试和种子数据
 */
import { execSync } from 'node:child_process';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runDbPush() {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`  正在同步数据库结构 (第 ${attempt}/${MAX_RETRIES} 次)...`);
      execSync('bunx prisma db push --accept-data-loss --skip-generate', {
        stdio: 'inherit',
        timeout: 60_000,
      });
      console.log('  ✅ 数据库结构已同步');
      return;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`  ⚠️ 第 ${attempt} 次同步失败: ${msg}`);
      if (attempt < MAX_RETRIES) {
        console.log(`  等待 ${RETRY_DELAY_MS / 1000}s 后重试...`);
        await sleep(RETRY_DELAY_MS);
      } else {
        throw new Error(`数据库同步失败（已重试 ${MAX_RETRIES} 次）: ${msg}`);
      }
    }
  }
}

export function generatePrismaClient() {
  try {
    console.log('  生成 Prisma Client...');
    execSync('bunx prisma generate', { stdio: 'inherit', timeout: 60_000 });
    console.log('  ✅ Prisma Client 生成完成');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Prisma generate 失败: ${message}`);
  }
}

// 支持直接执行
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