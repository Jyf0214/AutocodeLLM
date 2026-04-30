/**
 * 频道集成基础框架
 * 支持飞书（Lark）、钉钉（Dingtalk）、OneBot v11
 */

export type ChannelPlatform = 'lark' | 'dingtalk' | 'onebot';

export interface ChannelConfig {
  id: string;
  platform: ChannelPlatform;
  name: string;
  enabled: boolean;
  webhookUrl?: string;    // Webhook 地址（飞书/钉钉）
  websocketUrl?: string;  // WebSocket 地址（飞书/钉钉/OneBot）
  accessToken?: string;   // 访问令牌
  secret?: string;        // 签名密钥
  appId?: string;         // 应用 ID（飞书/钉钉）
  appSecret?: string;     // 应用密钥
}

export interface ChannelMessage {
  platform: ChannelPlatform;
  channelId: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
  raw: unknown; // 原始消息数据
}

export type MessageHandler = (message: ChannelMessage) => Promise<void>;

/**
 * 频道管理器
 * 统一管理所有平台的频道连接
 */
export class ChannelManager {
  private configs: Map<string, ChannelConfig> = new Map();
  private handlers: MessageHandler[] = [];

  /**
   * 注册频道配置
   */
  register(config: ChannelConfig): void {
    this.configs.set(config.id, config);
    console.log(`[Channel] 已注册: ${config.platform} - ${config.name}`);
  }

  /**
   * 移除频道
   */
  unregister(id: string): void {
    this.configs.delete(id);
  }

  /**
   * 获取所有频道
   */
  getAll(): ChannelConfig[] {
    return Array.from(this.configs.values());
  }

  /**
   * 添加消息处理器
   */
  onMessage(handler: MessageHandler): void {
    this.handlers.push(handler);
  }

  /**
   * 处理收到的消息
   */
  async handleMessage(message: ChannelMessage): Promise<void> {
    for (const handler of this.handlers) {
      try {
        await handler(message);
      } catch (err) {
        console.error(`[Channel] 消息处理失败:`, err);
      }
    }
  }

  /**
   * 发送 Webhook 消息（飞书/钉钉通用）
   */
  async sendWebhook(config: ChannelConfig, content: string): Promise<boolean> {
    if (!config.webhookUrl) return false;

    try {
      let body: string;
      if (config.platform === 'lark') {
        body = JSON.stringify({
          msg_type: 'text',
          content: { text: content },
        });
      } else if (config.platform === 'dingtalk') {
        body = JSON.stringify({
          msgtype: 'text',
          text: { content },
        });
      } else {
        return false;
      }

      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      return response.ok;
    } catch (err) {
      console.error(`[Channel] Webhook 发送失败:`, err);
      return false;
    }
  }
}

// 全局单例
export const channelManager = new ChannelManager();