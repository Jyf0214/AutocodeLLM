import { createClient, type WebDAVClient } from 'webdav';
import { decryptValue } from '@/lib/providers/api-client';

// 惰性获取 Prisma（动态 import 避免模块加载时实例化，构建阶段不会因 DATABASE_URL 未设置而崩溃）
async function getPrisma() {
  const { prisma } = await import('@/lib/db/prisma');
  return prisma;
}

/**
 * 创建 WebDAV 客户端（自动解密密码）
 */
export async function createWebdavClient(): Promise<WebDAVClient | null> {
  const db = await getPrisma();
  const config = await db.webdavConfig.findFirst({
    where: { enabled: true },
  });
  if (!config) return null;
  return createClient(config.url, {
    username: config.username,
    // 从数据库读取的密码是加密存储的，使用时需要解密
    password: decryptValue(config.password),
  });
}

/**
 * 连接测试（测试配置的远程路径是否可访问）
 */
export async function testConnection(
  url: string,
  username: string,
  password: string,
  remotePath?: string,
): Promise<boolean> {
  try {
    const client = createClient(url, { username, password });
    // 优先测试配置的远程路径，回退到根目录
    const testPath = remotePath ?? '/';
    await client.getDirectoryContents(testPath);
    return true;
  } catch (err) {
    console.error('[WebDAV] 连接测试失败:', err);
    return false;
  }
}

/**
 * 从远程拉取文件到本地
 */
export async function pullFromRemote(
  client: WebDAVClient,
  localDir: string,
  remotePath: string,
): Promise<number> {
  let count = 0;
  try {
    const items = (await client.getDirectoryContents(remotePath, { deep: true })) as {
      type: string;
      filename: string;
    }[];

    const files = items.filter((item) => item.type === 'file');

    for (const file of files) {
      const content = (await client.getFileContents(file.filename, {
        format: 'binary',
      })) as ArrayBuffer;
      const localPath = localDir + file.filename.replace(remotePath, '');

      // 使用 Node.js fs 写入
      const fs = await import('fs');
      const nodePath = await import('path');
      const dir = nodePath.dirname(localPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(localPath, Buffer.from(content));
      count++;
    }
  } catch (err) {
    // 拉取过程中出错，记录日志但继续
    console.error('[WebDAV] 拉取文件失败:', err);
  }
  return count;
}

/**
 * 上传本地文件到远程
 */
export async function pushToRemote(
  client: WebDAVClient,
  localPath: string,
  remotePath: string,
): Promise<boolean> {
  try {
    const fs = await import('fs');
    const nodePath = await import('path');

    const content = fs.readFileSync(localPath);
    const syncLocalDir = process.env.SYNC_LOCAL_DIR ?? './sync';
    const remoteFile = remotePath + localPath.replace(syncLocalDir, '');

    // 确保远程目录存在
    const remoteDir = nodePath.dirname(remoteFile);
    await ensureRemoteDir(client, remoteDir);

    await client.putFileContents(remoteFile, content, { overwrite: true });
    return true;
  } catch (err) {
    console.error('[WebDAV] 上传文件失败:', err);
    return false;
  }
}

/**
 * 确保远程目录存在（递归创建）
 */
async function ensureRemoteDir(client: WebDAVClient, remoteDir: string): Promise<void> {
  const parts = remoteDir.split('/').filter(Boolean);
  let currentPath = '';
  for (const part of parts) {
    currentPath += '/' + part;
    try {
      await client.createDirectory(currentPath);
    } catch (err) {
      // 目录已存在，忽略错误（记录 debug 日志以便排查）
      console.debug('[WebDAV] 创建远程目录（可能已存在）:', currentPath, err);
    }
  }
}

/**
 * 列出远程文件
 */
export async function listRemoteFiles(
  client: WebDAVClient,
  remotePath: string,
): Promise<string[]> {
  try {
    const items = (await client.getDirectoryContents(remotePath, { deep: true })) as {
      type: string;
      filename: string;
    }[];
    return items.filter((item) => item.type === 'file').map((item) => item.filename);
  } catch (err) {
    console.error('[WebDAV] 列出远程文件失败:', err);
    return [];
  }
}

/**
 * 保存 WebDAV 配置
 */
export async function saveWebdavConfig(data: {
  url: string;
  username: string;
  password: string;
  remotePath: string;
  enabled: boolean;
}): Promise<void> {
  const db = await getPrisma();
  const existing = await db.webdavConfig.findFirst();
  if (existing) {
    await db.webdavConfig.update({
      where: { id: existing.id },
      data,
    });
  } else {
    await db.webdavConfig.create({ data });
  }
}

/**
 * 获取同步状态
 */
export async function getSyncStatus(): Promise<{
  enabled: boolean;
  watching: boolean;
  url: string;
  remotePath: string;
  lastSync: string | null;
}> {
  // 使用动态导入避免与 watcher.ts 的循环依赖
  const { isWatchActive } = await import('./watcher');
  const db = await getPrisma();
  const config = await db.webdavConfig.findFirst();
  return {
    enabled: config?.enabled ?? false,
    watching: isWatchActive(),
    url: config?.url ?? '',
    remotePath: config?.remotePath ?? '',
    lastSync: config?.updatedAt.toISOString() ?? null,
  };
}
