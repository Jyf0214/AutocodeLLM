import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/log';
import fs from 'fs/promises';
import path from 'path';

export const GET = withApiLogging('GET docs/content', async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json(
        { error: '缺少文件路径参数' },
        { status: 400 }
      );
    }

    // 安全检查：防止路径遍历攻击
    const docsDir = path.join(process.cwd(), 'docs');
    const fullPath = path.resolve(path.join(docsDir, filePath));

    if (!fullPath.startsWith(docsDir)) {
      return NextResponse.json(
        { error: '非法的文件路径' },
        { status: 403 }
      );
    }

    // 检查文件是否存在
    try {
      await fs.access(fullPath);
    } catch {
      return NextResponse.json(
        { error: '文件不存在' },
        { status: 404 }
      );
    }

    const content = await fs.readFile(fullPath, 'utf-8');

    return NextResponse.json({ content });
  } catch (error) {
    console.error('读取文档内容失败:', error);
    return NextResponse.json(
      { error: '读取文档内容失败' },
      { status: 500 }
    );
  }
});
