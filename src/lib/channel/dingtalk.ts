/**
 * 钉钉（Dingtalk）频道集成
 * 支持 Webhook 和 WebSocket（Stream Mode）
 */
import { type ChannelConfig, type ChannelMessage, channelManager } from './index';

/**
 * 钉钉 Webhook 处理器
 */
export async function handleDingtalkWebhook(
  config: ChannelConfig,
  body: Record<string, unknown>,
): Promise<ChannelMessage | null> {
  try {
    // 钉钉机器人回调格式
    const msgType = body.msgtype as string;
    const senderId = body.senderStaffId as string || body.senderId as string || '';
    const conversationId = body.conversationId as string || body.sessionWebhook as string || '';

    let content = '';
    if (msgType === 'text') {
      const text = body.text as Record<string, string> | undefined;
      content = text?.content || '';
    } else if (body.text) {
      content = typeof body.text === 'string' ? body.text : JSON.stringify(body.text);
    }

    const message: ChannelMessage = {
      platform: 'dingtalk',
      channelId: conversationId,
      userId: senderId,
      userName: senderId || '钉钉用户',
      content,
      timestamp: Date.now(),
      raw: body,
    };

    await channelManager.handleMessage(message);
    return message;
  } catch (err) {
    console.error('[Dingtalk] Webhook 处理失败:', err);
    return null;
  }
}

/**
 * 钉钉 Stream Mode WebSocket 连接
 * 钉钉机器人支持 Stream Mode 接收消息
 */
export async function connectDingtalkStream(config: ChannelConfig): Promise<void> {
  if (!config.appId || !config.appSecret) {
    console.warn('[Dingtalk] Stream Mode 需要 appId 和 appSecret');
    return;
  }

  try {
    // 获取 access token
    const tokenRes = await fetch(
      `https://oapi.dingtalk.com/gettoken?appkey=${config.appId}&appsecret=${config.appSecret}`,
    );
    const tokenData = (await tokenRes.json()) as {
      errcode: number;
      access_token?: string;
    };

    if (tokenData.errcode !== 0 || !tokenData.access_token) {
      console.error('[Dingtalk] 获取 token 失败');
      return;
    }

    // 获取 WebSocket 连接信息
    const wsRes = await fetch(
      'https://api.dingtalk.com/v1.0/gateway/connections/open',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-acs-dingtalk-access-token': tokenData.access_token,
        },
        body: JSON.stringify({
          clientId: config.appId,
          clientSecret: config.appSecret,
          subscriptions: [{ type: 'EVENT', topic: '*' }],
        }),
      },
    );
    const wsData = (await wsRes.json()) as {
      endpoint?: string;
      ticket?: string;
    };

    if (wsData.endpoint && wsData.ticket) {
      console.log('[Dingtalk] WebSocket 连接信息已获取（占位）');
      // TODO: 建立 WebSocket 连接并处理消息
    }
  } catch (err) {
    console.error('[Dingtalk] Stream 连接失败:', err);
  }
}