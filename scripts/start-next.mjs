/**
 * 启动 Next.js 服务器（使用构建产物）
 */
import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

function findRuntime(): string {
  try {
    execSync('bun --version', { stdio: 'ignore' });
    return 'bun';
  } catch {
    try {
      execSync('npx tsx --version', { stdio: 'ignore' });
      return 'npx';
    } catch {
      return 'node';
    }
  }
}

export function startNextServer() {
  const runtime = findRuntime();
  const env = { ...process.env, NODE_ENV: 'production' };

  const cmd = runtime === 'bun' ? 'bun' : 'npx';
  const args = runtime === 'bun' ? ['run', 'server.ts'] : ['tsx', 'server.ts'];

  console.log(` 🚀 使用 ${runtime} 启动 Next.js...`);

  const child = spawn(cmd, args, {
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
    child.kill('SIGTERM');
  });

  process.on('SIGINT', () => {
    child.kill('SIGINT');
  });
}