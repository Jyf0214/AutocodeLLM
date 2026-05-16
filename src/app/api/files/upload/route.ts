import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/log';
import { resolveSafePath, ensureBaseDir, exists } from '@/lib/files/utils';
import { promises as fs } from 'node:fs';
import path from 'node:path';

/** POST /api/files/upload — 上传文件 */
export const POST = withApiLogging('POST files/upload', async function POST(request: Request) {
  try {
    await ensureBaseDir();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const targetDir = (formData.get('path') as string) || '/';

    if (!file) {
      return NextResponse.json(
        { success: false, error: { message: '未选择文件', code: 'MISSING_FILE' } },
        { status: 400 },
      );
    }

    const fileName = file.name;
    const filePath = path.posix.join(targetDir, fileName);
    const absolutePath = resolveSafePath(filePath);

    // 确保目标目录存在
    const parentDir = path.dirname(absolutePath);
    await fs.mkdir(parentDir, { recursive: true });

    // 检查是否已存在
    if (await exists(filePath)) {
      return NextResponse.json(
        { success: false, error: { message: '文件已存在', code: 'ALREADY_EXISTS' } },
        { status: 409 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(absolutePath, buffer);

    const stat = await fs.stat(absolutePath);

    return NextResponse.json({
      success: true,
      data: {
        name: fileName,
        path: filePath,
        size: stat.size,
        modifiedAt: stat.mtime.toISOString(),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '上传失败';
    const status = message.includes('越界') ? 403 : 500;
    return NextResponse.json(
      { success: false, error: { message, code: 'UPLOAD_ERROR' } },
      { status },
    );
  }
});