/**
 * 启动 Next.js 服务器（使用构建产物）
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

export function startNextServer() {
  const env = { ...process.env, NODE_ENV: 'production' };

  console.log(' 🚀 使用构建产物启动 Next.js 服务器...');

  const child = spawn('bun', ['run', 'server.ts'], {
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