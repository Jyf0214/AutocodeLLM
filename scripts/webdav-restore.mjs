/**
 * WebDAV 备份恢复
 * 应用启动时从远程拉取备份文件到本地
 * 配置从数据库读取（WebdavConfig 表）
 */
import { createClient } from 'webdav';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';

const SYNC_LOCAL_DIR = process.env.SYNC_LOCAL_DIR ?? './sync';

/**
 * 从数据库读取 WebDAV 配置
 * 使用 Prisma Client 直接查询
 */
async function getWebdavConfigFromDb() {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const config = await prisma.webdavConfig.findFirst({ where: { enabled: true } });
    await prisma.$disconnect();
    return config;
  } catch (err) {
    console.error('  数据库读取 WebDAV 配置失败:', err.message);
    return null;
  }
}

/**
 * 递归拉取远程目录内容到本地
 */
async function pullRemoteDir(client, remotePath, localDir) {
  let count = 0;
  try {
    const items = await client.getDirectoryContents(remotePath, { deep: true });
    const files = items.filter((item) => item.type === 'file');

    for (const file of files) {
      try {
        const content = await client.getFileContents(file.filename, { format: 'binary' });
        const localPath = localDir + file.filename.replace(remotePath, '');
        const dir = dirname(localPath);
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true });
        }
        writeFileSync(localPath, Buffer.from(content));
        count++;
      } catch (err) {
        console.error(`  恢复文件失败: ${file.filename}`, err.message);
      }
    }
  } catch (err) {
    console.error(`  拉取远程目录失败: ${remotePath}`, err.message);
  }
  return count;
}

/**
 * WebDAV 备份恢复主函数
 * 在应用启动时调用，从远程拉取备份文件
 */
export async function webdavRestore() {
  const config = await getWebdavConfigFromDb();

  if (!config) {
    console.log('  ⏭️  WebDAV 备份恢复（未配置或未启用，跳过）');
    return;
  }

  console.log('  🔄 WebDAV 备份恢复...');
  console.log(`  服务器: ${config.url}`);
  console.log(`  远程路径: ${config.remotePath}`);

  try {
    const client = createClient(config.url, {
      username: config.username,
      password: config.password,
    });

    // 测试连接
    await client.getDirectoryContents(config.remotePath);

    // 拉取备份文件到同步目录
    const localDir = SYNC_LOCAL_DIR;
    if (!existsSync(localDir)) {
      mkdirSync(localDir, { recursive: true });
    }

    const count = await pullRemoteDir(client, config.remotePath, localDir);
    console.log(`  ✅ WebDAV 恢复完成，已拉取 ${String(count)} 个文件`);
  } catch (err) {
    console.error(`  ⚠️  WebDAV 恢复失败: ${err.message}`);
    console.log('  应用将正常启动，但同步数据可能不是最新的');
  }
}
