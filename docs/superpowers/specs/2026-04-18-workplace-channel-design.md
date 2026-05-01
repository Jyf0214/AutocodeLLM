# 设计文档：/workplace/[[id]]/channel — Discord 频道聊天配置

> 日期：2026-04-18
> 状态：已批准

## 概述

为 AutocodeLLM 工作区新增 Discord 频道集成功能，用户可通过 Discord Bot 接入指定频道，实现消息双向通信和历史记录持久化。

## 架构方案

**方案 A：单 Bot 实例 + 按工作区频道映射**

- 项目启动一个全局 Discord Bot 实例
- 每个工作区可绑定多个 Discord 频道
- Bot 监听所有已绑定频道，消息按 `channelId` 路由到对应工作区
- Bot 生命周期由 Next.js API Route 通过 `globalThis` 单例管理

## 数据模型

### Channel

| 字段 | 类型 | 说明 |
|---|---|---|
| id | String (@id) | 主键 |
| 项目Id | String | 关联工作区 |
| name | String | 频道显示名称 |
| discordGuildId | String | Discord 服务器 ID |
| discordChannelId | String | Discord 频道 ID（唯一） |
| type | ChannelType | TEXT / VOICE / ANNOUNCEMENT |
| enabled | Boolean | 是否启用 |
| lastSyncedAt | DateTime? | 最后同步时间 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

### ChannelMessage

| 字段 | 类型 | 说明 |
|---|---|---|
| id | String (@id) | 主键 |
| channelId | String | 关联频道 |
| discordMsgId | String (@unique) | Discord 消息 ID |
| authorId | String | Discord 用户 ID |
| authorName | String | Discord 用户名 |
| authorAvatar | String? | 头像 URL |
| content | String | 消息内容 |
| attachments | String? | JSON: 附件 URL 列表 |
| sentFromApp | Boolean | 是否从本应用发出 |
| createdAt | DateTime | 消息时间 |

## Bot 管理层

目录：`src/lib/discord/`

- `bot.ts` — 全局单例 Bot 客户端（`globalThis.__discordBot`）
- `events.ts` — `messageCreate` 事件处理器
- `actions.ts` — 发送消息、获取频道列表、连接/断开

## API 路由

| 路由 | 方法 | 功能 |
|---|---|---|
| `/api/channels` | GET, POST | 列出/创建频道 |
| `/api/channels/[id]` | GET, PUT, DELETE | 频道详情/更新/删除 |
| `/api/channels/[id]/messages` | GET, POST | 消息历史/发送消息 |
| `/api/discord/connect` | POST | 连接 Bot |
| `/api/discord/disconnect` | POST | 断开 Bot |
| `/api/discord/guilds/[guildId]/channels` | GET | Discord 服务器频道列表 |
| `/api/discord/status` | GET | Bot 连接状态 |

## 页面结构

- `/workplace/[id]/channel` — 频道管理主页面
  - 顶部：Bot 连接状态 + Token 配置
  - 中部：已绑定频道列表（表格，含启用/禁用开关）
  - 底部：添加频道（选择 Discord 服务器 → 选择频道 → 绑定）
- `/workplace/[id]/channel/[channelId]` — 频道聊天详情
  - 消息历史列表（分页加载）
  - 底部输入框：发送消息到 Discord 频道

## UI 组件

- `ChannelList.tsx` — 频道列表 + 增删改
- `ChannelConnect.tsx` — Bot Token 配置 + 连接/断开
- `ChannelChat.tsx` — 消息历史 + 发送框
- `DiscordChannelPicker.tsx` — Discord 服务器/频道选择器

## i18n

新增 `common.channel.*` 和 `common.discord.*` 命名空间下的中英文翻译键。

## 依赖

- 新增 `discord.js`（v14）

## 错误处理

- Bot 连接失败：显示错误提示，不阻塞页面
- Token 无效：提示重新配置
- Discord API 限流：队列化消息发送，429 时退避重试
- 消息同步失败：记录日志，不影响已有消息展示
