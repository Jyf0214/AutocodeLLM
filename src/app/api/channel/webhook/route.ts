import { NextResponse } from 'next/server';
import { channelManager } from '@/lib/channel';
import { handleLarkWebhook } from '@/lib/channel/lark';
import { handleDingtalkWebhook } from '@/lib/channel/dingtalk';

/**
 * POST /api/channel/webhook
 * 统一频道 Webhook 入口
 * 通过 x-platform 头区分平台
 */
export async function POST(request: Request) {
  const platform = request.headers.get('x-platform') ?? 'lark';

  try {
    const body = (await request.json()) as Record<string, unknown>;

    // 查找启用的频道配置
    const channels = channelManager.getAll().filter((c) => c.enabled && c.platform === platform);

    if (channels.length === 0) {
      return NextResponse.json({
        success: false,
        error: { message: `未找到启用的 ${platform} 频道` },
      });
    }

    for (const config of channels) {
      if (platform === 'lark') {
        await handleLarkWebhook(config, body);
      } else if (platform === 'dingtalk') {
        await handleDingtalkWebhook(config, body);
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Webhook 处理失败' } },
      { status: 500 },
    );
  }
}

/**
 * GET /api/channel/webhook
 * 飞书 URL 验证（首次配置时飞书会发送 challenge）
 */
export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');

  if (challenge) {
    return NextResponse.json({ challenge });
  }

  return NextResponse.json({ success: true, channels: channelManager.getAll() });
}