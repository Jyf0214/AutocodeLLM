/**
 * 频道相关类型定义
 */
import type { ChannelType } from '@prisma/client';

/** 频道列表项 */
export interface ChannelListItem {
  id: string;
  name: string;
  discordGuildId: string;
  discordChannelId: string;
  type: ChannelType;
  enabled: boolean;
  lastSyncedAt: string | null;
  createdAt: string;
  workspaceId: string;
}

/** 频道详情 */
export interface ChannelDetail extends ChannelListItem {
  workspace: {
    id: string;
    name: string;
  };
  _count: {
    messages: number;
  };
}

/** 创建频道请求 */
export interface CreateChannelRequest {
  workspaceId: string;
  name: string;
  discordGuildId: string;
  discordChannelId: string;
  type?: ChannelType;
}

/** 更新频道请求 */
export interface UpdateChannelRequest {
  name?: string;
  enabled?: boolean;
  type?: ChannelType;
}

/** 频道消息项 */
export interface ChannelMessageItem {
  id: string;
  channelId: string;
  discordMsgId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  content: string;
  attachments: string | null;
  sentFromApp: boolean;
  createdAt: string;
}

/** 发送消息请求 */
export interface SendMessageRequest {
  content: string;
}

/** Discord 服务器信息 */
export interface DiscordGuildInfo {
  id: string;
  name: string;
  icon: string | null;
}

/** Discord 频道信息 */
export interface DiscordChannelInfo {
  id: string;
  name: string;
  type: number;
}

/** Bot 连接状态 */
export interface DiscordBotStatus {
  connected: boolean;
  tag: string | null;
  guilds: number;
}
