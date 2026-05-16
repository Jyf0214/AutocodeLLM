import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/log';
import { glob } from 'fast-glob';
import fs from 'fs/promises';
import path from 'path';

interface DocFile {
  filename: string;
  path: string;
  title: string;
}

function extractTitleFromMarkdown(content: string): string {
  // 尝试从 frontmatter 提取标题
  const frontmatterMatch = /^---\n([\s\S]*?)\n---/.exec(content);
  if (frontmatterMatch?.[1]) {
    const titleMatch = /^title:\s*(.+)$/m.exec(frontmatterMatch[1]);
    if (titleMatch?.[1]) {
      return titleMatch[1].trim();
    }
  }

  // 尝试从第一个 h1 标题提取
  const h1Match = /^#\s+(.+)$/m.exec(content);
  if (h1Match?.[1]) {
    return h1Match[1].trim();
  }

  // 回退到文件名
  return '';
}

export const GET = withApiLogging('GET docs', async function GET() {
  try {
    const docsDir = path.join(process.cwd(), 'docs');
    
    // 检查目录是否存在
    try {
      await fs.access(docsDir);
    } catch {
      return NextResponse.json({ docs: [] });
    }

    // 查找所有 Markdown 文件
    const files = await glob('**/*.md', {
      cwd: docsDir,
      absolute: false,
    });

    const docs: DocFile[] = await Promise.all(
      files.map(async (file) => {
        const fullPath = path.join(docsDir, file);
        const content = await fs.readFile(fullPath, 'utf-8');
        const title = extractTitleFromMarkdown(content);
        const filename = path.basename(file, '.md');

        return {
          filename,
          path: file,
          title: title || filename,
        };
      })
    );

    return NextResponse.json({ docs });
  } catch (error) {
    console.error('读取文档目录失败:', error);
    return NextResponse.json(
      { error: '读取文档目录失败' },
      { status: 500 }
    );
  }
});
