/**
 * OneBot v11 框架集成
 * 支持正向/反向 WebSocket 连接
 *
 * OneBot v11 标准：https://github.com/botuniverse/onebot-11
 */
import { type ChannelConfig, type ChannelMessage, channelManager } from './index';

/**
 * OneBot v11 消息格式
 */
interface OneBotMessage {
  post_type: 'message' | 'notice' | 'request';
  message_type: 'private' | 'group';
  sub_type: string;
  message_id: number;
  user_id: number;
  message: string | Array<{ type: string; data: Record<string, string> }>;
  raw_message: string;
  sender: {
    user_id: number;
    nickname: string;
    card?: string;
  };
  group_id?: number;
  time: number;
  self_id: number;
}

/**
 * 处理 OneBot v11 消息
 */
export function handleOneBotMessage(
  config: ChannelConfig,
  data: OneBotMessage,
): ChannelMessage | null {
  try {
    if (data.post_type !== 'message') return null;

    // 提取文本内容
    let content = '';
    if (typeof data.message === 'string') {
      content = data.message;
    } else if (Array.isArray(data.message)) {
      content = data.message
        .filter((seg) => seg.type === 'text')
        .map((seg) => seg.data.text || '')
        .join('');
    }

    const message: ChannelMessage = {
      platform: 'onebot',
      channelId: data.group_id
        ? `group_${data.group_id}`
        : `private_${data.user_id}`,
      userId: String(data.user_id),
      userName: data.sender.nickname || `用户${data.user_id}`,
      content,
      timestamp: data.time * 1000,
      raw: data,
    };

    channelManager.handleMessage(message);
    return message;
  } catch (err) {
    console.error('[OneBot] 消息处理失败:', err);
    return null;
  }
}

/**
 * 连接 OneBot v11 WebSocket（正向连接）
 * OneBot 作为服务端，我们作为客户端连接
 */
export function connectOneBotWebSocket(config: ChannelConfig): WebSocket | null {
  if (!config.websocketUrl) {
    console.warn('[OneBot] 缺少 WebSocket URL');
    return null;
  }

  try {
    const ws = new WebSocket(config.websocketUrl);

    ws.on('open', () => {
      console.log('[OneBot] WebSocket 已连接:', config.name);
    });

    ws.on('message', (raw) => {
      try {
        const data = JSON.parse(raw.toString()) as OneBotMessage;
        if (data.post_type === 'message') {
          handleOneBotMessage(config, data);
        }
      } catch (err) {
        console.error('[OneBot] 消息解析失败:', err);
      }
    });

    ws.on('close', () => {
      console.log('[OneBot] WebSocket 已断开:', config.name);
      // 5 秒后重连
      setTimeout(() => connectOneBotWebSocket(config), 5000);
    });

    ws.on('error', (err) => {
      console.error('[OneBot] WebSocket 错误:', err);
    });

    return ws;
  } catch (err) {
    console.error('[OneBot] WebSocket 连接失败:', err);
    return null;
  }
}

/**
 * OneBot v11 API 调用
 */
export async function callOneBotApi(
  config: ChannelConfig,
  action: string,
  params: Record<string, unknown> = {},
): Promise<unknown> {
  if (!config.websocketUrl) return null;

  // OneBot HTTP API（如果配置了 HTTP 地址）
  const httpUrl = config.websocketUrl.replace('ws://', 'http://').replace('wss://', 'https://');

  try {
    const response = await fetch(`${httpUrl}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    return await response.json();
  } catch (err) {
    console.error(`[OneBot] API 调用失败 (${action}):`, err);
    return null;
  }
}

/**
 * 发送 OneBot 消息
 */
export async function sendOneBotMessage(
  config: ChannelConfig,
  targetId: string,
  message: string,
  isGroup = false,
): Promise<boolean> {
  const result = await callOneBotApi(config, isGroup ? 'send_group_msg' : 'send_private_msg', {
    [isGroup ? 'group_id' : 'user_id']: Number(targetId),
    message,
  });

  return result !== null;
}