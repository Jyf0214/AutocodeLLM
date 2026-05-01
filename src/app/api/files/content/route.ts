import { NextResponse } from 'next/server';
import { readFileContent, writeFileContent } from '@/lib/files/utils';

/** GET /api/files/content?path=/foo.txt — 读取文件内容 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json(
        { success: false, error: { message: '文件路径不能为空', code: 'MISSING_PATH' } },
        { status: 400 },
      );
    }

    const content = await readFileContent(filePath);

    return NextResponse.json({
      success: true,
      data: { path: filePath, content },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '读取文件失败';
    const status =
      message.includes('越界') ? 403 :
      message.includes('过大') ? 413 :
      message.includes('目录') ? 400 : 500;
    return NextResponse.json(
      { success: false, error: { message, code: 'READ_ERROR' } },
      { status },
    );
  }
}

/** PUT /api/files/content — 写入文件内容 */
export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { path: string; content: string };
    const { path: filePath, content } = body;

    if (!filePath) {
      return NextResponse.json(
        { success: false, error: { message: '文件路径不能为空', code: 'MISSING_PATH' } },
        { status: 400 },
      );
    }

    await writeFileContent(filePath, content);

    return NextResponse.json({
      success: true,
      data: { path: filePath },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '写入文件失败';
    const status = message.includes('越界') ? 403 : 500;
    return NextResponse.json(
      { success: false, error: { message, code: 'WRITE_ERROR' } },
      { status },
    );
  }
}