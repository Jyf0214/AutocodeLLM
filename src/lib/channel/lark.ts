/**
 * 飞书（Lark）频道集成
 * 支持 Webhook 和 WebSocket 两种方式
 */
import { type ChannelConfig, type ChannelMessage, channelManager } from './index';

/**
 * 飞书 Webhook 处理器
 * 接收飞书 Webhook 回调并转换为统一消息格式
 */
export async function handleLarkWebhook(
  config: ChannelConfig,
  body: Record<string, unknown>,
): Promise<ChannelMessage | null> {
  try {
    // 飞书事件回调格式
    const header = body.header as Record<string, string> | undefined;
    const event = body.event as Record<string, unknown> | undefined;

    if (!event) return null;

    const eventType = header?.event_type || '';

    if (eventType === 'im.message.receive_v1') {
      const msg = event.message as Record<string, unknown> | undefined;
      const senderData = (body.sender as Record<string, unknown> | undefined)?.sender_id as Record<string, string> | undefined;

      if (!msg) return null;

      const message: ChannelMessage = {
        platform: 'lark',
        channelId: (msg.chat_id as string) || '',
        userId: senderData?.open_id || '',
        userName: senderData?.open_id || '飞书用户',
        content: extractLarkContent(msg),
        timestamp: Date.now(),
        raw: body,
      };

      await channelManager.handleMessage(message);
      return message;
    }

    return null;
  } catch (err) {
    console.error('[Lark] Webhook 处理失败:', err);
    return null;
  }
}

/**
 * 从飞书消息中提取文本内容
 */
function extractLarkContent(msg: Record<string, unknown>): string {
  const msgType = msg.msg_type as string;
  if (msgType === 'text') {
    return (msg.content as string) || '';
  }
  // 富文本消息
  const content = msg.content as string;
  if (content) {
    try {
      const parsed = JSON.parse(content);
      if (parsed.text) return parsed.text;
      if (parsed.elements) {
        return parsed.elements
          .map((el: Record<string, unknown>) => el.text || '')
          .join('');
      }
    } catch {
      return content;
    }
  }
  return `[${msgType}]`;
}

/**
 * 飞书 WebSocket 连接（占位 — 需要飞书 SDK）
 * 飞书使用长连接接收事件，需要先获取 WebSocket URL
 */
export async function connectLarkWebSocket(config: ChannelConfig): Promise<void> {
  if (!config.appId || !config.appSecret) {
    console.warn('[Lark] WebSocket 需要 appId 和 appSecret');
    return;
  }

  // 获取 tenant_access_token
  try {
    const tokenRes = await fetch(
      'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id: config.appId,
          app_secret: config.appSecret,
        }),
      },
    );
    const tokenData = (await tokenRes.json()) as {
      code: number;
      tenant_access_token?: string;
    };

    if (tokenData.code !== 0 || !tokenData.tenant_access_token) {
      console.error('[Lark] 获取 token 失败');
      return;
    }

    console.log('[Lark] WebSocket 连接已建立（占位）');
    // TODO: 使用飞书 WebSocket SDK 建立长连接
  } catch (err) {
    console.error('[Lark] WebSocket 连接失败:', err);
  }
}