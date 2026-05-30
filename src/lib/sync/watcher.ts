import { watch, type FSWatcher } from 'chokidar';
import { createClient } from 'webdav';
import { decryptValue } from '@/lib/crypto';
import { pushToRemote } from './webdav';

// 惰性获取 Prisma（动态 import 避免模块加载时实例化，构建阶段不会因 DATABASE_URL 未设置而崩溃）
async function getPrisma() {
  const { prisma } = await import('@/lib/db/prisma');
  return prisma;
}

let watcher: FSWatcher | null = null;
let isWatching = false;

/**
 * 启动文件监听
 */
export async function startWatching(): Promise<boolean> {
  const db = await getPrisma();
  const config = await db.webdavConfig.findFirst({
    where: { enabled: true },
  });

  if (!config) return false;

  const localDir = process.env.SYNC_LOCAL_DIR ?? './sync';

  // 从数据库读取的密码是加密存储的，使用时需要解密
  const client = createClient(config.url, {
    username: config.username,
    password: decryptValue(config.password),
  });

  watcher = watch(localDir, {
    ignored: /(^|[/\\])\../,
    persistent: true,
    ignoreInitial: true,
  });

  watcher.on('change', async (path) => {
    console.log('[同步] 文件变更: ' + path);
    const success = await pushToRemote(client, path, config.remotePath);
    if (!success) {
      console.error('[同步] 上传失败: ' + path);
    }
  });

  watcher.on('add', async (path) => {
    console.log('[同步] 新增文件: ' + path);
    const success = await pushToRemote(client, path, config.remotePath);
    if (!success) {
      console.error('[同步] 上传失败: ' + path);
    }
  });

  watcher.on('error', (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[同步] 监听错误: ' + message);
  });

  isWatching = true;
  console.log('[同步] 开始监听目录: ' + localDir);

  return true;
}

/**
 * 停止文件监听
 */
export async function stopWatching(): Promise<void> {
  if (watcher) {
    await watcher.close();
    watcher = null;
    isWatching = false;
    console.log('[同步] 已停止监听');
  }
}

/**
 * 获取监听状态
 */
export function isWatchActive(): boolean {
  return isWatching;
}
