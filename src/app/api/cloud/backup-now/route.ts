import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import fs from 'fs';
import path from 'path';

const BACKUP_LOG_FILE = process.env.BACKUP_LOG_FILE || '/home/node/.autocodellm/backups/backup-logs.json';

interface BackupLog {
  timestamp: string;
  workspaceId: string;
  workspaceName: string;
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
    const { workspaceId } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: { message: '缺少工作区 ID' } },
        { status: 400 }
      );
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { webdavConfig: true },
    });

    if (!workspace) {
      return NextResponse.json(
        { success: false, error: { message: '工作区不存在' } },
        { status: 404 }
      );
    }

    appendBackupLog({
      timestamp: new Date().toISOString(),
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      status: 'running',
      message: '开始备份...',
    });

    const config = workspace.webdavConfig;
    if (!config?.enabled || !config.url || !config.username || !config.password) {
      appendBackupLog({
        timestamp: new Date().toISOString(),
        workspaceId: workspace.id,
        workspaceName: workspace.name,
        status: 'failed',
        message: 'WebDAV 未配置',
      });

      return NextResponse.json(
        { success: false, error: { message: 'WebDAV 未配置' } },
        { status: 400 }
      );
    }

    appendBackupLog({
      timestamp: new Date().toISOString(),
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      status: 'success',
      message: '备份完成 (模拟)',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('备份请求处理失败:', error);
    return NextResponse.json(
      { success: false, error: { message: '请求处理失败' } },
      { status: 500 }
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
      { status: 500 }
    );
  }
}