import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/log';
import { requireAuth } from '@/lib/auth';
import { renameEntry, exists } from '@/lib/files/utils';

/** PUT /api/files/rename — 重命名/移动文件或目录 */
export const PUT = withApiLogging('PUT files/rename', async function PUT(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
    const body = (await request.json()) as { oldPath: string; newPath: string };
    const { oldPath, newPath } = body;

    if (!oldPath || !newPath) {
      return NextResponse.json(
        { success: false, error: { message: '路径不能为空', code: 'MISSING_PATH' } },
        { status: 400 },
      );
    }

    // 禁止重命名根目录
    if (oldPath === '/' || oldPath === '') {
      return NextResponse.json(
        { success: false, error: { message: '不允许重命名根目录', code: 'ROOT_PROTECTED' } },
        { status: 403 },
      );
    }

    // 检查源路径是否存在
    if (!(await exists(oldPath))) {
      return NextResponse.json(
        { success: false, error: { message: '源文件不存在', code: 'NOT_FOUND' } },
        { status: 404 },
      );
    }

    // 检查目标路径是否已存在
    if (await exists(newPath)) {
      return NextResponse.json(
        { success: false, error: { message: '目标路径已存在', code: 'ALREADY_EXISTS' } },
        { status: 409 },
      );
    }

    await renameEntry(oldPath, newPath);

    return NextResponse.json({
      success: true,
      data: { oldPath, newPath },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '重命名失败';
    const status = message.includes('越界') ? 403 : 500;
    return NextResponse.json(
      { success: false, error: { message, code: 'RENAME_ERROR' } },
      { status },
    );
  }
});