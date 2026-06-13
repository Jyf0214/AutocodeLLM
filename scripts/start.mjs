#!/usr/bin/env bun
// 应用启动主入口 - 编排各子脚本按顺序执行

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { isDocker, initPersistentDirs } from './init-dirs.mjs';
import { runDbDeploy, generatePrismaClient } from './db-deploy.mjs';
import { initAdminAccount } from './init-admin.mjs';
import { webdavRestore } from './webdav-restore.mjs';
import { startNextServer } from './start-next.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// 显示版本信息
const pkgPath = join(rootDir, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const baseVersion = pkg.version || '0.1.0';
let gitHash = 'unknown';
try {
  const { execSync } = await import('child_process');
  gitHash = execSync('git rev-parse --short HEAD', { stdio: 'pipe' }).toString().trim();
} catch {
  console.warn('⚠ 非 git 仓库，无法获取 git hash');
}
const buildTime = new Date().toISOString();
const fullVersion = `${baseVersion}-${gitHash}`;

console.log('\n========================================');
console.log('  AutocodeLLM');
console.log(`  版本: ${fullVersion}`);
console.log(`  构建时间: ${buildTime}`);
console.log(`  Node.js: ${process.version}`);
console.log(`  运行环境: ${isDocker() ? 'Docker 容器' : '本地环境'}`);
console.log(`  数据目录: /home/node`);
console.log(`  持久化目录: /home/node/.autocodellm`);
console.log('========================================\n');

// 步骤 1: 初始化持久化目录
console.log('[1/5] 初始化持久化目录...');
initPersistentDirs();
console.log('✓ 持久化目录已就绪\n');

// 步骤 2: 数据库迁移 + 生成 Prisma 客户端
console.log('[2/5] 数据库迁移...');
try {
  await runDbDeploy();
  generatePrismaClient();
  console.log('');
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`✗ 数据库迁移失败: ${message}`);
  process.exit(1);
}

// 步骤 3: 初始化默认管理员账户
console.log('[3/5] 初始化管理员账户...');
await initAdminAccount();
console.log('');

// 步骤 4: WebDAV 备份恢复
console.log('[4/5] 检查 WebDAV 备份...');
await webdavRestore();
console.log('');

// 步骤 5: 启动 Next.js
console.log('[5/5] 启动 Next.js 服务器...');
startNextServer();
