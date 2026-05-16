import { promises as fs, constants as fsConstants } from 'node:fs';
import path from 'node:path';

/** 文件管理基础目录 */
const BASE_DIR = path.resolve(process.env.FILES_BASE_PATH || path.join(process.cwd(), 'projects'));

/** 获取基础目录 */
export function getBaseDir(): string {
  return BASE_DIR;
}

/** 确保基础目录存在 */
export async function ensureBaseDir(): Promise<void> {
  try {
    await fs.access(BASE_DIR, fsConstants.W_OK);
  } catch {
    await fs.mkdir(BASE_DIR, { recursive: true });
  }
}

/** 将相对路径解析为绝对路径，并验证路径安全性 */
export function resolveSafePath(relativePath: string): string {
  // 规范化路径
  const normalized = path.normalize(relativePath).replace(/^[/\\]+/, '');
  const absolute = path.join(BASE_DIR, normalized);

  // 防止路径遍历攻击
  if (!absolute.startsWith(BASE_DIR)) {
    throw new Error('路径越界：不允许访问基础目录之外的文件');
  }

  return absolute;
}

/** 文件信息 */
export interface FileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  modifiedAt: string;
  extension: string;
}

/** 列出目录内容 */
export async function listDirectory(dirPath: string): Promise<FileInfo[]> {
  await ensureBaseDir();
  const absolutePath = resolveSafePath(dirPath);

  const stat = await fs.stat(absolutePath);
  if (!stat.isDirectory()) {
    throw new Error('路径不是目录');
  }

  const entries = await fs.readdir(absolutePath, { withFileTypes: true });
  const result: FileInfo[] = [];

  for (const entry of entries) {
    // 跳过隐藏文件
    if (entry.name.startsWith('.')) continue;

    const entryPath = path.join(dirPath, entry.name);
    const entryAbsolute = path.join(absolutePath, entry.name);
    const entryStat = await fs.stat(entryAbsolute);

    result.push({
      name: entry.name,
      path: entryPath,
      type: entryStat.isDirectory() ? 'directory' : 'file',
      size: entryStat.size,
      modifiedAt: entryStat.mtime.toISOString(),
      extension: entry.isDirectory() ? '' : path.extname(entry.name).toLowerCase(),
    });
  }

  // 排序：目录在前，文件在后，各自按名称字母排序
  result.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return result;
}

/** 读取文件内容 */
export async function readFileContent(filePath: string): Promise<string> {
  await ensureBaseDir();
  const absolutePath = resolveSafePath(filePath);

  const stat = await fs.stat(absolutePath);
  if (stat.isDirectory()) {
    throw new Error('无法读取目录内容');
  }

  // 限制文件大小（最大 5MB）
  if (stat.size > 5 * 1024 * 1024) {
    throw new Error('文件过大，无法读取（最大 5MB）');
  }

  return fs.readFile(absolutePath, 'utf-8');
}

/** 写入文件内容 */
export async function writeFileContent(filePath: string, content: string): Promise<void> {
  await ensureBaseDir();
  const absolutePath = resolveSafePath(filePath);

  // 确保父目录存在
  const parentDir = path.dirname(absolutePath);
  await fs.mkdir(parentDir, { recursive: true });

  await fs.writeFile(absolutePath, content, 'utf-8');
}

/** 创建目录 */
export async function createDirectory(dirPath: string): Promise<void> {
  await ensureBaseDir();
  const absolutePath = resolveSafePath(dirPath);
  await fs.mkdir(absolutePath, { recursive: true });
}

/** 删除文件或目录 */
export async function deleteEntry(entryPath: string): Promise<void> {
  await ensureBaseDir();
  const absolutePath = resolveSafePath(entryPath);

  const stat = await fs.stat(absolutePath);
  if (stat.isDirectory()) {
    await fs.rm(absolutePath, { recursive: true, force: true });
  } else {
    await fs.unlink(absolutePath);
  }
}

/** 重命名/移动文件或目录 */
export async function renameEntry(oldPath: string, newPath: string): Promise<void> {
  await ensureBaseDir();
  const absoluteOld = resolveSafePath(oldPath);
  const absoluteNew = resolveSafePath(newPath);

  // 确保目标父目录存在
  const parentDir = path.dirname(absoluteNew);
  await fs.mkdir(parentDir, { recursive: true });

  await fs.rename(absoluteOld, absoluteNew);
}

/** 检查路径是否存在 */
export async function exists(relativePath: string): Promise<boolean> {
  try {
    const absolutePath = resolveSafePath(relativePath);
    await fs.access(absolutePath);
    return true;
  } catch {
    return false;
  }
}

/** 获取文件状态信息 */
export async function getFileInfo(relativePath: string): Promise<FileInfo> {
  await ensureBaseDir();
  const absolutePath = resolveSafePath(relativePath);
  const stat = await fs.stat(absolutePath);

  return {
    name: path.basename(relativePath),
    path: relativePath,
    type: stat.isDirectory() ? 'directory' : 'file',
    size: stat.size,
    modifiedAt: stat.mtime.toISOString(),
    extension: stat.isDirectory() ? '' : path.extname(relativePath).toLowerCase(),
  };
}

/** 获取文件 MIME 类型 */
export function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.txt': 'text/plain',
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.ts': 'application/typescript',
    '.tsx': 'application/typescript',
    '.jsx': 'application/javascript',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.md': 'text/markdown',
    '.csv': 'text/csv',
    '.yaml': 'text/yaml',
    '.yml': 'text/yaml',
    '.env': 'text/plain',
    '.gitignore': 'text/plain',
    '.dockerignore': 'text/plain',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.zip': 'application/zip',
    '.tar': 'application/x-tar',
    '.gz': 'application/gzip',
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}