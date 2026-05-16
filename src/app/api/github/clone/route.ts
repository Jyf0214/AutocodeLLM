import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { cloneRepo, getGitHubAppConfig } from '@/lib/github/app';

/**
 * POST /api/github/clone
 * 克隆 GitHub 仓库到项目
 */
export async function POST(request: Request) {
  const auth = await requireAuth(request, 'write');
  if (auth.error) return auth.error;

  const config = getGitHubAppConfig();
  if (!config) {
    return NextResponse.json(
      { success: false, error: { message: 'GitHub App 未配置', code: 'GITHUB_NOT_CONFIGURED' } },
      { status: 503 },
    );
  }

  const body = (await request.json()) as {
    repo: string;
    projectId: string;
    branch?: string;
    isPrivate?: boolean;
  };

  if (!body.repo || !body.projectId) {
    return NextResponse.json(
      { success: false, error: { message: '缺少 repo 或 projectId', code: 'MISSING_PARAMS' } },
      { status: 400 },
    );
  }

  const targetDir = `/home/node/.autocodellm/projects/${body.projectId}`;

  const result = await cloneRepo({
    repo: body.repo,
    targetDir,
    branch: body.branch,
    isPrivate: body.isPrivate,
  });

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: { message: result.error ?? '克隆失败', code: 'CLONE_FAILED' } },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, data: { targetDir } });
}

/**
 * GET /api/github/clone
 * 检查 GitHub App 配置状态
 */
export function GET() {
  const config = getGitHubAppConfig();
  return NextResponse.json({
    success: true,
    data: {
      configured: !!config,
      appId: config?.appId ? `${config.appId.slice(0, 4)}...` : null,
    },
  });
}