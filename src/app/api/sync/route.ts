import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { testConnection, createWebdavClient, pullFromRemote, pushToRemote } from '@/lib/sync/webdav';
import { startWatching, stopWatching, isWatchActive } from '@/lib/sync/watcher';

export async function GET() {
  try {
    const config = await prisma.webdavConfig.findFirst();
    return NextResponse.json({
      success: true,
      data: {
        enabled: config?.enabled ?? false,
        watching: isWatchActive(),
        url: config?.url ?? '',
        remotePath: config?.remotePath ?? '',
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: '获取同步状态失败', code: 'GET_STATUS_FAILED' } },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = body.action as string;

    if (action === 'save') {
      const { url, username, password, remotePath, enabled } = body as {
        url: string;
        username: string;
        password: string;
        remotePath: string;
        enabled: boolean | string;
      };

      // Switch 组件可能返回 boolean 或 string，统一处理
      const isEnabled = enabled === true || enabled === 'true';

      const existing = await prisma.webdavConfig.findFirst();
      if (existing) {
        await prisma.webdavConfig.update({
          where: { id: existing.id },
          data: { url, username, password, remotePath, enabled: isEnabled },
        });
      } else {
        await prisma.webdavConfig.create({
          data: { url, username, password, remotePath, enabled: isEnabled },
        });
      }

      // 如果启用了同步，自动启动文件监听
      if (isEnabled) {
        await startWatching();
      } else {
        await stopWatching();
      }

      return NextResponse.json({ success: true, message: '配置已保存' });
    }

    if (action === 'test') {
      const { url, username, password, remotePath } = body as {
        url: string;
        username: string;
        password: string;
        remotePath?: string;
      };
      const ok = await testConnection(url, username, password, remotePath);
      return NextResponse.json({
        success: ok,
        message: ok ? '连接成功' : '连接失败，请检查服务器地址、凭据和远程路径',
      });
    }

    if (action === 'pull') {
      const client = await createWebdavClient();
      if (!client) {
        return NextResponse.json(
          { success: false, error: { message: 'WebDAV 未配置', code: 'NOT_CONFIGURED' } },
          { status: 400 },
        );
      }
      const config = await prisma.webdavConfig.findFirst();
      const localDir = process.env.SYNC_LOCAL_DIR ?? './sync';
      const count = await pullFromRemote(client, localDir, config?.remotePath ?? '/');
      return NextResponse.json({ success: true, message: '已拉取 ' + String(count) + ' 个文件' });
    }

    if (action === 'push') {
      const client = await createWebdavClient();
      if (!client) {
        return NextResponse.json(
          { success: false, error: { message: 'WebDAV 未配置', code: 'NOT_CONFIGURED' } },
          { status: 400 },
        );
      }
      const config = await prisma.webdavConfig.findFirst();
      if (!config) {
        return NextResponse.json(
          { success: false, error: { message: 'WebDAV 未配置', code: 'NOT_CONFIGURED' } },
          { status: 400 },
        );
      }

      const localDir = process.env.SYNC_LOCAL_DIR ?? './sync';
      const fs = await import('fs');
      const nodePath = await import('path');

      let pushedCount = 0;
      const walkDir = async (dir: string) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = nodePath.join(dir, entry.name);
          if (entry.isDirectory()) {
            await walkDir(fullPath);
          } else if (entry.isFile()) {
            const success = await pushToRemote(client, fullPath, config.remotePath);
            if (success) pushedCount++;
          }
        }
      };

      if (fs.existsSync(localDir)) {
        await walkDir(localDir);
      }

      return NextResponse.json({
        success: true,
        message: '已推送 ' + String(pushedCount) + ' 个文件',
      });
    }

    if (action === 'start') {
      const ok = await startWatching();
      return NextResponse.json({
        success: ok,
        message: ok ? '监听已启动' : '配置未启用，请先保存并启用 WebDAV 配置',
      });
    }

    if (action === 'stop') {
      await stopWatching();
      return NextResponse.json({ success: true, message: '监听已停止' });
    }

    return NextResponse.json(
      { success: false, error: { message: '未知操作', code: 'UNKNOWN_ACTION' } },
      { status: 400 },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: { message: '同步操作失败', code: 'SYNC_FAILED' } },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    await stopWatching();
    const existing = await prisma.webdavConfig.findFirst();
    if (existing) {
      await prisma.webdavConfig.delete({ where: { id: existing.id } });
    }
    return NextResponse.json({ success: true, message: '配置已删除' });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: '删除配置失败', code: 'DELETE_FAILED' } },
      { status: 500 },
    );
  }
}
