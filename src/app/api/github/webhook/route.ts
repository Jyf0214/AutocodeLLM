import { NextResponse } from 'next/server';
import { verifyGitHubWebhook } from '@/lib/github/app';

/**
 * POST /api/github/webhook
 * GitHub App Webhook 入口
 */
export async function POST(request: Request) {
  const signature = request.headers.get('x-hub-signature-256') || '';
  const event = request.headers.get('x-github-event') || '';
  const deliveryId = request.headers.get('x-github-delivery') || '';

  const payload = await request.text();

  // 验证 webhook 签名
  const secret = process.env.GITHUB_APP_WEBHOOK_SECRET || '';
  if (secret && !verifyGitHubWebhook(payload, signature, secret)) {
    return NextResponse.json(
      { success: false, error: { message: '签名验证失败' } },
      { status: 401 },
    );
  }

  try {
    const data = JSON.parse(payload) as Record<string, unknown>;

    console.log(`[GitHub Webhook] 事件: ${event}, 交付: ${deliveryId}`);

    switch (event) {
      case 'installation':
      case 'installation_repositories':
        console.log('[GitHub Webhook] 安装事件:', data.action);
        break;

      case 'push':
        console.log('[GitHub Webhook] 推送事件:', (data.repository as Record<string, string>)?.full_name);
        break;

      case 'pull_request':
        console.log('[GitHub Webhook] PR 事件:', data.action);
        break;

      default:
        console.log(`[GitHub Webhook] 未处理的事件: ${event}`);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Webhook 处理失败' } },
      { status: 500 },
    );
  }
}