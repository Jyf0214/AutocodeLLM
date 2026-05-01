import { NextResponse } from 'next/server';
import { getGitHubAppConfig } from '@/lib/auth/github-app-config';
import crypto from 'node:crypto';

/**
 * POST /api/auth/github-app/webhook
 * 处理 GitHub App Webhook 事件
 */
export async function POST(request: Request) {
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

  console.log(`GitHub Webhook 事件: ${event}`, payload);

  try {
    switch (event) {
      case 'installation':
        await handleInstallation(payload);
        break;
      case 'installation_repositories':
        await handleInstallationRepositories(payload);
        break;
      case 'push':
        await handlePush(payload);
        break;
      case 'pull_request':
        await handlePullRequest(payload);
        break;
      default:
        console.log(`未处理的事件: ${event}`);
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
}

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
async function handleInstallation(payload: any) {
  const action = payload.action;
  const installation = payload.installation;

  console.log(`GitHub App 安装 ${action}:`, {
    id: installation.id,
    account: installation.account.login,
  });

  // 这里可以添加数据库记录安装信息的逻辑
}

/**
 * 处理仓库安装事件
 */
async function handleInstallationRepositories(payload: any) {
  const action = payload.action;
  const repositories = payload.repositories;

  console.log(`仓库 ${action}:`, repositories.map((r: any) => r.full_name));
}

/**
 * 处理 push 事件
 */
async function handlePush(payload: any) {
  const repo = payload.repository.full_name;
  const ref = payload.ref;
  const commits = payload.commits?.length || 0;

  console.log(`Push 到 ${repo}:${ref}, ${commits} 个提交`);
}

/**
 * 处理 pull request 事件
 */
async function handlePullRequest(payload: any) {
  const action = payload.action;
  const pr = payload.pull_request;
  const repo = payload.repository.full_name;

  console.log(`PR ${action}: ${repo}#${pr.number} - ${pr.title}`);
}
