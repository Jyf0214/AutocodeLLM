/**
 * 启动 Next.js 服务器
 */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

export function startNextServer() {
  const env = { ...process.env };

  // 使用 bun run next start 启动，避免 standalone 模式日志混乱问题
  console.log('  🚀 启动 Next.js 服务器...');
  const child = spawn('bun', ['run', 'next', 'start'], {
    cwd: rootDir,
    stdio: 'inherit',
    env,
  });

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
