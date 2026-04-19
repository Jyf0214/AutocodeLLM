'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { message as antMessage } from 'antd';
import { Button, Text, Flexbox, Avatar } from '@lobehub/ui';
import { Card, Input, Skeleton, Empty } from 'antd';
import { SendOutlined, ArrowUpOutlined, UserOutlined } from '@ant-design/icons';

interface ChannelMessageItem {
  id: string;
  discordMsgId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  content: string;
  attachments: string | null;
  sentFromApp: boolean;
  createdAt: string;
}

interface ChannelChatProps {
  channelId: string;
  channelName: string;
}

/** 频道聊天组件 — 消息历史 + 发送 */
export default function ChannelChat({ channelId, channelName }: ChannelChatProps) {
  const t = useTranslations('common');
  const [messages, setMessages] = useState<ChannelMessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const limit = 50;

  /** 获取消息列表 */
  const fetchMessages = useCallback(async (pageNum: number, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await fetch(
        `/api/channels/${channelId}/messages?page=${pageNum}&limit=${limit}`,
      );
      const result = await res.json();
      if (result.success && result.data) {
        const newMessages = (result.data.items ?? []) as ChannelMessageItem[];
        const pagination = result.data.pagination;
        setTotal(pagination?.total ?? 0);
        setHasMore(pageNum < (pagination?.totalPages ?? 1));

        if (append) {
          setMessages((prev) => [...prev, ...newMessages]);
        } else {
          setMessages(newMessages);
        }
      }
    } catch {
      antMessage.error('获取消息失败');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [channelId]);

  /** 初次加载 */
  useEffect(() => {
    void fetchMessages(1);
  }, [fetchMessages]);

  /** 滚动到底部 */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  /** 加载更多（更早的消息） */
  const handleLoadMore = useCallback(async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchMessages(nextPage, true);
  }, [page, fetchMessages]);

  /** 发送消息 */
  const handleSend = useCallback(async () => {
    const content = inputValue.trim();
    if (!content) return;

    setSending(true);
    try {
      const res = await fetch(`/api/channels/${channelId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const result = await res.json();
      if (result.success && result.data) {
        setMessages((prev) => [result.data as ChannelMessageItem, ...prev]);
        setInputValue('');
      } else {
        antMessage.error(result.error?.message ?? '发送失败');
      }
    } catch {
      antMessage.error('发送失败');
    } finally {
      setSending(false);
    }
  }, [inputValue, channelId]);

  /** 格式化时间 */
  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return <Card><Skeleton active paragraph={{ rows: 6 }} /></Card>;
  }

  // 按时间正序显示（最新在底部）
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return (
    <Card
      title={
        <Flexbox horizontal align="center" gap={8}>
          <Text strong>{t('channel.chatTitle')}</Text>
          <Text type="secondary">{channelName}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            ({total})
          </Text>
        </Flexbox>
      }
    >
      <Flexbox gap={12} style={{ height: 500, overflow: 'hidden' }}>
        {/* 消息列表区域 */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px 0',
          }}
        >
          {hasMore && (
            <Flexbox horizontal justify="center" style={{ marginBottom: 12 }}>
              <Button
                type="link"
                icon={<ArrowUpOutlined />}
                loading={loadingMore}
                onClick={handleLoadMore}
                size="small"
              >
                {t('channel.loadMore')}
              </Button>
            </Flexbox>
          )}

          {sortedMessages.length === 0 ? (
            <Empty
              description={t('channel.noMessages')}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            sortedMessages.map((msg) => (
              <Flexbox
                key={msg.id}
                horizontal
                align="flex-start"
                gap={8}
                style={{
                  marginBottom: 12,
                  flexDirection: msg.sentFromApp ? 'row-reverse' : 'row',
                }}
              >
                <Avatar
                  avatar={
                    msg.authorAvatar ? (
                      <img src={msg.authorAvatar} alt={msg.authorName} />
                    ) : (
                      <UserOutlined />
                    )
                  }
                  size={32}
                  style={{ flexShrink: 0 }}
                />
                <div
                  style={{
                    maxWidth: '70%',
                    background: msg.sentFromApp
                      ? 'var(--lobe-color-primary-container, #e8f0fe)'
                      : 'var(--color-bg-elevated, #f5f5f5)',
                    borderRadius: 12,
                    padding: '8px 12px',
                  }}
                >
                  <Flexbox horizontal align="center" gap={4} style={{ marginBottom: 2 }}>
                    <Text strong style={{ fontSize: 12 }}>
                      {msg.authorName}
                    </Text>
                    {msg.sentFromApp && (
                      <Text
                        style={{
                          fontSize: 10,
                          color: 'var(--lobe-color-primary)',
                        }}
                      >
                        {t('channel.sentFromApp')}
                      </Text>
                    )}
                  </Flexbox>
                  <Text style={{ fontSize: 14, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {msg.content}
                  </Text>
                  <div>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {formatTime(msg.createdAt)}
                    </Text>
                  </div>
                </div>
              </Flexbox>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <Flexbox horizontal gap={8} align="center">
          <Input
            placeholder={t('channel.messagePlaceholder')}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onPressEnter={handleSend}
            disabled={sending}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            loading={sending}
            onClick={handleSend}
          >
            {t('channel.sendMessage')}
          </Button>
        </Flexbox>
      </Flexbox>
    </Card>
  );
}
