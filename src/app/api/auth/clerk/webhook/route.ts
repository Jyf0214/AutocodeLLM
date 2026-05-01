/**
 * Clerk Webhook 处理路由
 * 处理 Clerk 用户事件并同步到本地数据库
 */
import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { handleClerkWebhook } from '@/lib/auth/providers';
import { isClerkEnabled } from '@/lib/auth/clerk-config';
import type { ClerkWebhookPayload } from '@/lib/auth/providers';

/**
 * POST /api/auth/clerk/webhook
 * 处理 Clerk webhook 事件
 */
export async function POST(req: NextRequest) {
  // 检查 Clerk 是否启用
  if (!isClerkEnabled()) {
    return NextResponse.json(
      { error: 'Clerk authentication is not enabled' },
      { status: 403 }
    );
  }

  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.error('[Clerk Webhook] CLERK_WEBHOOK_SECRET is not set');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  // 获取请求头
  const svixId = req.headers.get('svix-id');
  const svixTimestamp = req.headers.get('svix-timestamp');
  const svixSignature = req.headers.get('svix-signature');

  // 验证必要的头
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: 'Missing svix headers' },
      { status: 400 }
    );
  }

  // 获取请求体
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // 验证 webhook 签名
  const wh = new Webhook(webhookSecret);
  let evt: { type: string; data: ClerkWebhookPayload['data'] };

  try {
    evt = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as { type: string; data: ClerkWebhookPayload['data'] };
  } catch (err) {
    console.error('[Clerk Webhook] 签名验证失败:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // 处理事件
  try {
    const webhookPayload: ClerkWebhookPayload = {
      type: evt.type as ClerkWebhookPayload['type'],
      data: evt.data,
    };

    await handleClerkWebhook(webhookPayload);

    return NextResponse.json(
      { success: true, message: 'Webhook processed successfully' },
      { status: 200 }
    );
  } catch (err) {
    console.error('[Clerk Webhook] 处理失败:', err);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}
