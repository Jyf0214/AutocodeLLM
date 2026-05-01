import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import fs from 'fs';
import path from 'path';

const BACKUP_LOG_FILE =
  process.env.BACKUP_LOG_FILE || '/home/node/.autocodellm/backups/backup-logs.json';

interface BackupLog {
  timestamp: string;
  projectId: string;
  projectName: string;
  status: 'running' | 'success' | 'failed';
  message: string;
}

function ensureBackupLogFile() {
  const dir = path.dirname(BACKUP_LOG_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(BACKUP_LOG_FILE)) {
    fs.writeFileSync(BACKUP_LOG_FILE, JSON.stringify([], null, 2));
  }
}

function readBackupLogs(): BackupLog[] {
  try {
    ensureBackupLogFile();
    const data = fs.readFileSync(BACKUP_LOG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function appendBackupLog(log: BackupLog) {
  ensureBackupLogFile();
  const logs = readBackupLogs();
  logs.unshift(log);
  fs.writeFileSync(BACKUP_LOG_FILE, JSON.stringify(logs.slice(0, 100), null, 2));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
         { success: false, error: { message: '缺少项目 ID' } },
        { status: 400 },
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
         { success: false, error: { message: '项目不存在' } },
        { status: 404 },
      );
    }

    appendBackupLog({
      timestamp: new Date().toISOString(),
      projectId: project.id,
      projectName: project.name,
      status: 'running',
      message: '开始备份...',
    });

    // WebdavConfig 是全局单例，不属于 Project
    const config = await prisma.webdavConfig.findFirst({ where: { enabled: true } });

    if (!config) {
      appendBackupLog({
        timestamp: new Date().toISOString(),
        projectId: project.id,
        projectName: project.name,
        status: 'failed',
        message: 'WebDAV 未配置或未启用',
      });
      return NextResponse.json(
        { success: false, error: { message: 'WebDAV 未配置或未启用' } },
        { status: 400 },
      );
    }

    // 执行实际备份：将项目数据推送到 WebDAV
    const { createWebdavClient, pushToRemote } = await import('@/lib/sync/webdav');
    const client = await createWebdavClient();

    if (!client) {
      appendBackupLog({
        timestamp: new Date().toISOString(),
        projectId: project.id,
        projectName: project.name,
        status: 'failed',
        message: 'WebDAV 客户端创建失败',
      });
      return NextResponse.json(
        { success: false, error: { message: 'WebDAV 客户端创建失败' } },
        { status: 500 },
      );
    }

    const localDir = process.env.SYNC_LOCAL_DIR ?? './sync';
    const projectDir = path.join(localDir, projectId);

    if (fs.existsSync(projectDir)) {
      let pushedCount = 0;
      const walkDir = async (dir: string) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            await walkDir(fullPath);
          } else if (entry.isFile()) {
            const success = await pushToRemote(client, fullPath, config.remotePath + '/' + projectId);
            if (success) pushedCount++;
          }
        }
      };
      await walkDir(projectDir);

      appendBackupLog({
        timestamp: new Date().toISOString(),
        projectId: project.id,
        projectName: project.name,
        status: 'success',
        message: '备份完成，已推送 ' + String(pushedCount) + ' 个文件',
      });
    } else {
      appendBackupLog({
        timestamp: new Date().toISOString(),
        projectId: project.id,
        projectName: project.name,
        status: 'success',
        message: '备份完成（项目目录为空）',
      });
    }

    // 记录备份到数据库
    await prisma.backup.create({
      data: {
        projectId: project.id,
        name: 'WebDAV 备份 - ' + new Date().toISOString(),
        status: 'completed',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('备份请求处理失败:', error);
    return NextResponse.json(
      { success: false, error: { message: '请求处理失败' } },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const logs = readBackupLogs();
    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    console.error('获取备份日志失败:', error);
    return NextResponse.json(
      { success: false, error: { message: '获取日志失败' } },
      { status: 500 },
    );
  }
}
