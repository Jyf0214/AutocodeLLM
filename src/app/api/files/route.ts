import { NextResponse } from 'next/server';
import { listDirectory, createDirectory, deleteEntry, writeFileContent, exists } from '@/lib/files/utils';

/** GET /api/files?path=/ — 列出目录内容 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dirPath = searchParams.get('path') || '/';

    const files = await listDirectory(dirPath);

    return NextResponse.json({
      success: true,
      data: { files, currentPath: dirPath },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取文件列表失败';
    const status = message.includes('越界') ? 403 : 500;
    return NextResponse.json(
      { success: false, error: { message, code: 'LIST_ERROR' } },
      { status },
    );
  }
}

/** POST /api/files — 创建文件或目录 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      path: string;
      type: 'file' | 'directory';
      content?: string;
    };
    const { path: entryPath, type, content } = body;

    if (!entryPath) {
      return NextResponse.json(
        { success: false, error: { message: '路径不能为空', code: 'MISSING_PATH' } },
        { status: 400 },
      );
    }

    // 检查是否已存在
    if (await exists(entryPath)) {
      return NextResponse.json(
        { success: false, error: { message: '文件或目录已存在', code: 'ALREADY_EXISTS' } },
        { status: 409 },
      );
    }

    if (type === 'directory') {
      await createDirectory(entryPath);
    } else {
      await writeFileContent(entryPath, content || '');
    }

    return NextResponse.json({
      success: true,
      data: { path: entryPath, type },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '创建失败';
    const status = message.includes('越界') ? 403 : 500;
    return NextResponse.json(
      { success: false, error: { message, code: 'CREATE_ERROR' } },
      { status },
    );
  }
}

/** DELETE /api/files — 删除文件或目录 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const entryPath = searchParams.get('path');

    if (!entryPath) {
      return NextResponse.json(
        { success: false, error: { message: '路径不能为空', code: 'MISSING_PATH' } },
        { status: 400 },
      );
    }

    // 禁止删除根目录
    if (entryPath === '/' || entryPath === '') {
      return NextResponse.json(
        { success: false, error: { message: '不允许删除根目录', code: 'ROOT_PROTECTED' } },
        { status: 403 },
      );
    }

    await deleteEntry(entryPath);

    return NextResponse.json({
      success: true,
      data: { path: entryPath },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '删除失败';
    const status = message.includes('越界') ? 403 : 500;
    return NextResponse.json(
      { success: false, error: { message, code: 'DELETE_ERROR' } },
      { status },
    );
  }
}