/**
 * 数据库迁移部署脚本
 * 使用 Prisma migrate deploy 进行安全的非破坏性迁移
 * 含重试机制和种子数据
 */
import { execSync } from 'node:child_process';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runDbDeploy() {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`  正在执行数据库迁移 (第 ${attempt}/${MAX_RETRIES} 次)...`);
      execSync('bunx prisma migrate deploy', {
        stdio: 'inherit',
        timeout: 60_000,
        env: { ...process.env, NO_UPDATE_NOTIFIER: 'true' },
      });
      console.log('  ✅ 数据库迁移已应用');
      return;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`  ⚠️ 第 ${attempt} 次迁移失败: ${msg}`);
      if (attempt < MAX_RETRIES) {
        console.log(`  等待 ${RETRY_DELAY_MS / 1000}s 后重试...`);
        await sleep(RETRY_DELAY_MS);
      } else {
        throw new Error(`数据库迁移失败（已重试 ${MAX_RETRIES} 次）: ${msg}`);
      }
    }
  }
}

export function generatePrismaClient() {
  try {
    console.log('  生成 Prisma Client...');
    execSync('bunx prisma generate --no-hints', {
      stdio: 'inherit',
      timeout: 60_000,
      env: { ...process.env, NO_UPDATE_NOTIFIER: 'true' },
    });
    console.log('  ✅ Prisma Client 生成完成');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Prisma generate 失败: ${message}`);
  }
}

// 支持直接执行
if (process.argv[1] && process.argv[1].endsWith('db-deploy.mjs')) {
  console.log('========================================');
  console.log('开始数据库迁移部署...');
  console.log('========================================');
  (async () => {
    try {
      await runDbDeploy();
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
