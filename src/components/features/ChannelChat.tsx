'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Input, Button, Empty, Skeleton, Space } from 'antd';
import { SendOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { Flexbox, Text, Avatar } from '@lobehub/ui';
import { useTranslations } from 'next-intl';
import { message as antMessage } from 'antd';
import type { ApiResponse, PaginatedData, ChannelMessageItem } from '@/lib/api/channel-types';

interface ChannelChatProps {
  channelId: string;
  channelName: string;
}

/** 每页消息数量 */
const PAGE_SIZE = 50;

export default function ChannelChat({ channelId, channelName }: ChannelChatProps) {
  const t = useTranslations('channel');

  const [messages, setMessages] = useState<ChannelMessageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  /** 获取消息列表 */
  const fetchMessages = useCallback(
    async (pageNum: number, append = false) => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/channels/${channelId}/messages?page=${pageNum}&limit=${PAGE_SIZE}`,
        );
        if (!response.ok) return;
        const result = (await response.json()) as ApiResponse<PaginatedData<ChannelMessageItem>>;
        if (result.success && result.data) {
          const { items, pagination } = result.data;
          if (append) {
            // 加载更多：将旧消息插入顶部
            setMessages((prev) => [...items, ...prev]);
          } else {
            // 首次加载：按时间正序排列（最新在底部）
            setMessages([...items].reverse());
          }
          setHasMore(pagination.page < pagination.totalPages);
          setPage(pageNum);
        }
      } catch {
        // 静默处理
      } finally {
        setLoading(false);
      }
    },
    [channelId],
  );

  /** 首次加载 */
  useEffect(() => {
    if (channelId) {
      fetchMessages(1, false);
    }
  }, [channelId, fetchMessages]);

  /** 首次加载后滚动到底部 */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length === 0 ? 0 : messages.length]);

  /** 加载更多历史消息 */
  const handleLoadMore = () => {
    if (hasMore && !loading) {
      // 记录当前滚动位置
      const scrollTop = listRef.current?.scrollTop ?? 0;
      fetchMessages(page + 1, true).then(() => {
        // 恢复滚动位置（避免跳动）
        requestAnimationFrame(() => {
          if (listRef.current) {
            listRef.current.scrollTop = scrollTop + 100;
          }
        });
      });
    }
  };

  /** 发送消息 */
  const handleSend = async () => {
    const content = inputValue.trim();
    if (!content) return;

    setSending(true);
    try {
      const response = await fetch(`/api/channels/${channelId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) {
        antMessage.error(t('sendMessage'));
        return;
      }
      const result = (await response.json()) as ApiResponse<ChannelMessageItem>;
      if (result.success && result.data) {
        setMessages((prev) => [...prev, result.data!]);
        setInputValue('');
        // 滚动到底部
        requestAnimationFrame(() => {
          bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        });
      } else {
        antMessage.error(result.error?.message ?? 'Send failed');
      }
    } catch {
      antMessage.error('Send failed');
    } finally {
      setSending(false);
    }
  };

  /** 格式化时间戳 */
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card
      title={t('chatTitle')}
      size="small"
      extra={
        <Text type="secondary" style={{ fontSize: 12 }}>
          #{channelName}
        </Text>
      }
    >
      <Flexbox vertical style={{ height: 420 }}>
        {/* 消息列表区域 */}
        <div
          ref={listRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px 4px',
            borderRadius: 8,
            background: 'var(--color-bg-layout, #fafafa)',
          }}
        >
          {/* 加载更多按钮 */}
          {hasMore && (
            <Flexbox horizontal justify="center" style={{ padding: '8px 0' }}>
              <Button
                type="link"
                size="small"
                icon={<ArrowUpOutlined />}
                onClick={handleLoadMore}
                loading={loading}
              >
                {t('loadMore')}
              </Button>
            </Flexbox>
          )}

          {/* 加载中骨架屏 */}
          {loading && messages.length === 0 && (
            <Flexbox vertical gap={12} padding={8}>
              {[1, 2, 3].map((i) => (
                <Skeleton.Avatar active key={i} />
              ))}
            </Flexbox>
          )}

          {/* 空状态 */}
          {!loading && messages.length === 0 && (
            <Empty
              description={t('noMessages')}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ marginTop: 80 }}
            />
          )}

          {/* 消息列表 */}
          {messages.map((msg) => (
            <Flexbox
              key={msg.id}
              horizontal
              gap={8}
              align="flex-start"
              style={{
                padding: '6px 8px',
                borderRadius: 8,
                marginBottom: 4,
                flexDirection: msg.sentFromApp ? 'row-reverse' : 'row',
                background: msg.sentFromApp
                  ? 'var(--color-primary-bg, #e6f4ff)'
                  : 'transparent',
              }}
            >
              {/* 头像 */}
              <Avatar
                size={32}
                src={msg.authorAvatar ?? undefined}
                style={{
                  flexShrink: 0,
                  backgroundColor: msg.sentFromApp
                    ? 'var(--color-primary, #1677ff)'
                    : 'var(--color-bg-secondary, #f0f0f0)',
                }}
              >
                {msg.authorName.charAt(0).toUpperCase()}
              </Avatar>

              {/* 消息内容 */}
              <Flexbox
                vertical
                gap={2}
                style={{
                  maxWidth: '75%',
                  alignItems: msg.sentFromApp ? 'flex-end' : 'flex-start',
                }}
              >
                <Flexbox horizontal gap={6} align="center">
                  <Text strong style={{ fontSize: 13 }}>
                    {msg.authorName}
                  </Text>
                  {msg.sentFromApp && (
                    <Text
                      style={{
                        fontSize: 10,
                        color: 'var(--color-primary, #1677ff)',
                        border: '1px solid var(--color-primary, #1677ff)',
                        borderRadius: 4,
                        padding: '0 4px',
                      }}
                    >
                      {t('sentFromApp')}
                    </Text>
                  )}
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {formatTime(msg.createdAt)}
                  </Text>
                </Flexbox>
                <div
                  style={{
                    padding: '6px 10px',
                    borderRadius: 8,
                    background: msg.sentFromApp
                      ? 'var(--color-primary, #1677ff)'
                      : 'var(--color-bg-secondary, #f0f0f0)',
                    color: msg.sentFromApp ? '#fff' : 'inherit',
                    wordBreak: 'break-word',
                    fontSize: 14,
                    lineHeight: 1.5,
                  }}
                >
                  {msg.content}
                </div>
              </Flexbox>
            </Flexbox>
          ))}

          {/* 底部锚点 */}
          <div ref={bottomRef} />
        </div>

        {/* 输入区域 */}
        <Space.Compact style={{ marginTop: 8, width: '100%' }}>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={t('messagePlaceholder')}
            onPressEnter={handleSend}
            disabled={sending}
            style={{ borderRadius: '8px 0 0 8px' }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={sending}
            disabled={!inputValue.trim()}
            style={{ borderRadius: '0 8px 8px 0' }}
          >
            {t('sendMessage')}
          </Button>
        </Space.Compact>
      </Flexbox>
    </Card>
  );
}
