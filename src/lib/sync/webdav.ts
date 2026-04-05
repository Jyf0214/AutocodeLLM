import { createClient, type WebDAVClient } from 'webdav';
import { prisma } from '@/lib/db/prisma';

/**
 * 创建 WebDAV 客户端
 */
export async function createWebdavClient(): Promise<WebDAVClient | null> {
  const config = await prisma.webdavConfig.findFirst({
    where: { enabled: true },
  });

  if (!config) return null;

  return createClient(config.url, {
    username: config.username,
    password: config.password,
  });
}

/**
 * 连接测试
 */
export async function testConnection(url: string, username: string, password: string): Promise<boolean> {
  try {
    const client = createClient(url, { username, password });
    await client.getDirectoryContents('/');
    return true;
  } catch {
    return false;
  }
}

/**
 * 从远程拉取文件到本地
 */
export async function pullFromRemote(
  client: WebDAVClient,
  localDir: string,
  remotePath: string
): Promise<number> {
  let count = 0;
  try {
    const items = await client.getDirectoryContents(remotePath, { deep: true }) as { type: string; filename: string }[];
    const files = items.filter((item) => item.type === 'file');

    for (const file of files) {
      const content = await client.getFileContents(file.filename, { format: 'binary' }) as ArrayBuffer;
      const localPath = localDir + file.filename.replace(remotePath, '');
      // 使用 Node.js fs 写入
      const fs = await import('fs');
      const path = await import('path');
      const dir = path.dirname(localPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(localPath, Buffer.from(content));
      count++;
    }
  } catch {
    // 忽略错误，继续处理
  }

  return count;
}

/**
 * 上传本地文件到远程
 */
export async function pushToRemote(
  client: WebDAVClient,
  localPath: string,
  remotePath: string
): Promise<boolean> {
  try {
    const fs = await import('fs');
    const content = fs.readFileSync(localPath);
    const remoteFile = remotePath + localPath.replace(process.env.SYNC_LOCAL_DIR ?? './sync', '');
    await client.putFileContents(remoteFile, content, { overwrite: true });
    return true;
  } catch {
    return false;
  }
}

/**
 * 列出远程文件
 */
export async function listRemoteFiles(
  client: WebDAVClient,
  remotePath: string
): Promise<string[]> {
  try {
    const items = await client.getDirectoryContents(remotePath, { deep: true }) as { type: string; filename: string }[];
    return items
      .filter((item) => item.type === 'file')
      .map((item) => item.filename);
  } catch {
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
  const existing = await prisma.webdavConfig.findFirst();

  if (existing) {
    await prisma.webdavConfig.update({
      where: { id: existing.id },
      data,
    });
  } else {
    await prisma.webdavConfig.create({ data });
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
  const config = await prisma.webdavConfig.findFirst();

  return {
    enabled: config?.enabled ?? false,
    watching: false,
    url: config?.url ?? '',
    remotePath: config?.remotePath ?? '',
    lastSync: null,
  };
}
