/**
 * 启动 Next.js 服务器
 * 自动检测 standalone 模式并使用正确的启动命令
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

export function startNextServer() {
  const env = { ...process.env };

  // 检测是否为 standalone 模式
  const standaloneServerPath = join(rootDir, '.next', 'standalone', 'server.js');
  const isStandalone = existsSync(standaloneServerPath);

  let child;

  if (isStandalone) {
    // Standalone 模式：使用 node 启动 .next/standalone/server.js
    console.log('  📦 检测到 Standalone 模式，使用 node 启动...');
    child = spawn('node', ['.next/standalone/server.js'], {
      cwd: rootDir,
      stdio: 'inherit',
      env,
    });
  } else {
    // 开发/标准模式：使用 bun run next start
    console.log('  🚀 使用 bun run next start 启动...');
    child = spawn('bun', ['run', 'next', 'start'], {
      cwd: rootDir,
      stdio: 'inherit',
      env,
    });
  }

  child.on('error', (error) => {
    console.error('Next.js 启动失败:', error.message);
    process.exit(1);
  });

  child.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Next.js 异常退出，退出码: ${code}`);
      process.exit(1);
    }
  });

  // 优雅退出
  process.on('SIGTERM', () => {
    console.log('\n收到 SIGTERM 信号，正在关闭 Next.js...');
    child.kill('SIGTERM');
  });

  process.on('SIGINT', () => {
    console.log('\n收到 SIGINT 信号，正在关闭 Next.js...');
    child.kill('SIGINT');
  });
}
