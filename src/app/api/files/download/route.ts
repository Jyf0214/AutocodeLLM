import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/log';
import { requireAuth } from '@/lib/auth';
import { resolveSafePath, ensureBaseDir, getMimeType } from '@/lib/files/utils';
import { promises as fs } from 'node:fs';
import path from 'node:path';

/** GET /api/files/download?path=/foo.txt — 下载文件 */
export const GET = withApiLogging('GET files/download', async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
    await ensureBaseDir();

    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json(
        { success: false, error: { message: '文件路径不能为空', code: 'MISSING_PATH' } },
        { status: 400 },
      );
    }

    const absolutePath = resolveSafePath(filePath);
    const stat = await fs.stat(absolutePath);

    if (stat.isDirectory()) {
      return NextResponse.json(
        { success: false, error: { message: '无法下载目录', code: 'IS_DIRECTORY' } },
        { status: 400 },
      );
    }

    const content = await fs.readFile(absolutePath);
    const fileName = path.basename(filePath);
    const mimeType = getMimeType(filePath);

    return new NextResponse(content, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        'Content-Length': String(stat.size),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '下载失败';
    const status = message.includes('越界') ? 403 : 404;
    return NextResponse.json(
      { success: false, error: { message, code: 'DOWNLOAD_ERROR' } },
      { status },
    );
  }
});