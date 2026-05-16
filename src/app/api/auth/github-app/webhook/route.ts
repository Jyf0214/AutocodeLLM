import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/log';
import { getGitHubAppConfig } from '@/lib/auth/github-app-config';
import crypto from 'node:crypto';

/**
 * POST /api/auth/github-app/webhook
 * 处理 GitHub App Webhook 事件
 */
export const POST = withApiLogging('POST auth/github-app/webhook', async function POST(request: Request) {
  const config = getGitHubAppConfig();
  if (!config) {
    return NextResponse.json(
      { error: 'GitHub App 未配置' },
      { status: 503 }
    );
  }

  // 验证 webhook 签名
  const signature = request.headers.get('x-hub-signature-256');
  const body = await request.text();

  if (!verifyWebhookSignature(body, signature, config.webhookSecret)) {
    return NextResponse.json(
      { error: '无效的 webhook 签名' },
      { status: 401 }
    );
  }

  const event = request.headers.get('x-github-event');
  const payload = JSON.parse(body);

  console.log(`GitHub Webhook 事件: ${event ?? 'unknown'}`, payload);

  try {
    switch (event) {
      case 'installation':
        await handleInstallation(payload);
        break;
      case 'installation_repositories':
        await handleInstallationRepositories(payload);
        break;
      case 'push':
        handlePush(payload);
        break;
      case 'pull_request':
        handlePullRequest(payload);
        break;
      default:
        console.log(`未处理的事件: ${event ?? 'unknown'}`);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook 处理失败';
    console.error('Webhook 处理错误:', message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
});

/**
 * 验证 webhook 签名
 */
function verifyWebhookSignature(
  body: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body);
  const expectedSignature = `sha256=${hmac.digest('hex')}`;

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * 处理安装事件
 */
async function handleInstallation(_payload: unknown) {
  // 安装事件处理
}

/**
 * 处理仓库安装事件
 */
async function handleInstallationRepositories(_payload: unknown) {
  // 仓库安装事件处理
}

/**
 * 处理 push 事件
 */
function handlePush(payload: Record<string, unknown>) {
  const repo = (payload.repository as Record<string, string> | undefined)?.full_name ?? '';
  const ref = payload.ref as string;
  const commits = (payload.commits as unknown[] | undefined)?.length ?? 0;

  console.log(`Push 到 ${repo}:${ref}, ${String(commits)} 个提交`);
}

/**
 * 处理 pull request 事件
 */
function handlePullRequest(payload: Record<string, unknown>) {
  const action = payload.action as string;
  const pr = payload.pull_request as Record<string, unknown> | undefined;
  const repo = (payload.repository as Record<string, string> | undefined)?.full_name ?? '';

  console.log(`PR ${action}: ${repo}#${String(pr?.number)} - ${String(pr?.title)}`);
}
