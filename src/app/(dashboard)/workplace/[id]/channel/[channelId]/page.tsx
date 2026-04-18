'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { message } from 'antd';
import { Button, Text, Flexbox, Icon, Avatar } from '@lobehub/ui';
import { Card, Skeleton } from 'antd';
import { ArrowLeftOutlined, ReloadOutlined, MessageOutlined } from '@ant-design/icons';

import type { ChannelDetail } from '@/lib/api/channel-types';
import ChannelChat from '@/components/features/ChannelChat';

export default function ChannelChatPage() {
  const t = useTranslations('common.channel');
  const router = useRouter();
  const resolvedParams = useParams();
  const workspaceId = resolvedParams.id as string;
  const channelId = resolvedParams.channelId as string;

  const [channel, setChannel] = useState<ChannelDetail | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChannel = useCallback(async () => {
    setFetching(true);
    setError(null);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/channels/${channelId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${String(response.status)}`);
      }
      const result: {
        success: boolean;
        data?: ChannelDetail;
        error?: { message: string };
      } = await response.json();

      if (result.success && result.data) {
        setChannel(result.data);
      } else {
        const errorMsg = result.error?.message ?? t('title');
        setError(errorMsg);
        message.error(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t('title');
      setError(errorMsg);
      message.error(errorMsg);
      console.error('Failed to fetch channel details:', err);
    } finally {
      setFetching(false);
    }
  }, [workspaceId, channelId, t]);

  useEffect(() => {
    fetchChannel();
  }, [fetchChannel]);

  if (fetching) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg-layout)' }}>
        <div
          style={{
            background: 'var(--color-bg)',
            borderBottom: '1px solid var(--color-border)',
            padding: '16px 24px',
          }}
        >
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <Flexbox horizontal align="center" gap={12}>
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => router.push(`/workplace/${workspaceId}/channel`)}
              >
                {t('chatTitle')}
              </Button>
            </Flexbox>
          </div>
        </div>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px' }}>
          <Flexbox gap={16} align="center" style={{ marginBottom: 32 }}>
            <Skeleton.Avatar active size={64} shape="square" />
            <div style={{ flex: 1 }}>
              <Skeleton.Input active style={{ width: '40%', marginBottom: 8 }} />
              <Skeleton.Input active style={{ width: '60%' }} />
            </div>
          </Flexbox>
          <Card>
            <Skeleton active paragraph={{ rows: 6 }} />
          </Card>
        </div>
      </div>
    );
  }

  if (error || !channel) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--color-bg-layout)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Card style={{ maxWidth: 400, textAlign: 'center', padding: 24 }}>
          <Flexbox gap={16} direction="vertical">
            <Icon
              icon={MessageOutlined}
              style={{ fontSize: 48, color: 'var(--lobe-color-error)' }}
            />
            <Text strong style={{ fontSize: 18 }}>
              {t('chatTitle')}
            </Text>
            <Text type="secondary">{error ?? 'Channel does not exist'}</Text>
            <Flexbox gap={12} horizontal justify="center">
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => router.push(`/workplace/${workspaceId}/channel`)}
              >
                {t('chatTitle')}
              </Button>
              <Button type="primary" icon={<ReloadOutlined />} onClick={fetchChannel}>
                Retry
              </Button>
            </Flexbox>
          </Flexbox>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-layout)' }}>
      <div
        style={{
          background: 'var(--color-bg)',
          borderBottom: '1px solid var(--color-border)',
          padding: '16px 24px',
        }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <Flexbox horizontal align="center" gap={12}>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push(`/workplace/${workspaceId}/channel`)}
            >
              {t('chatTitle')}
            </Button>
          </Flexbox>
        </div>
      </div>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px' }}>
        <Flexbox gap={20} align="center" style={{ marginBottom: 32 }}>
          <Avatar
            avatar={<MessageOutlined style={{ fontSize: 28 }} />}
            size={64}
            background="var(--lobe-color-primary)"
            shape="square"
            style={{ borderRadius: 16 }}
          />
          <div style={{ flex: 1 }}>
            <Text strong style={{ fontSize: 24, display: 'block', marginBottom: 4 }}>
              {channel.name}
            </Text>
            <Text type="secondary" style={{ fontSize: 14 }}>
              {t('chatTitle')}
            </Text>
          </div>
        </Flexbox>

        <Card
          style={{
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
          }}
        >
          <ChannelChat channelId={channelId} channelName={channel.name} />
        </Card>
      </div>
    </div>
  );
}
