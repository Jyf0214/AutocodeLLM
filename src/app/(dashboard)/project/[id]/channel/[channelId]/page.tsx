'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { message as antMessage } from 'antd';
import { Button, Text, Flexbox } from '@/lib/ui';
import { Card, Skeleton } from 'antd';
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';

interface ChannelDetailData {
  id: string;
  name: string;
  discordGuildId: string;
  discordChannelId: string;
  type: string;
  enabled: boolean;
}

/** 频道聊天详情页面 */
export default function ChannelChatPage() {
  const t = useTranslations('common');
  const router = useRouter();
  const resolvedParams = useParams();
  const projectId = resolvedParams.id as string;
  const channelId = resolvedParams.channelId as string;

  const [channel, setChannel] = useState<ChannelDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** 获取频道详情 */
  const fetchChannel = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/channels/${channelId}`);
      const result = await res.json();
      if (result.success && result.data) {
        setChannel(result.data as ChannelDetailData);
      } else {
        const errorMsg = result.error?.message ?? '频道不存在';
        setError(errorMsg);
        antMessage.error(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '获取频道信息失败';
      setError(errorMsg);
      antMessage.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/channels/${channelId}`);
        const result = await res.json();
        if (result.success && result.data) {
          setChannel(result.data as ChannelDetailData);
        } else {
          const errorMsg = result.error?.message ?? '频道不存在';
          setError(errorMsg);
          antMessage.error(errorMsg);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '获取频道信息失败';
        setError(errorMsg);
        antMessage.error(errorMsg);
      } finally {
        setLoading(false);
      }
    })();
  }, [channelId]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg-layout)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px' }}>
          <Skeleton active paragraph={{ rows: 6 }} />
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
            <Text strong style={{ fontSize: 18 }}>
              {error ?? '频道不存在'}
            </Text>
            <Flexbox gap={12} horizontal justify="center">
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => router.push(`/project/${projectId}/channel`)}
              >
                {t('project.back')}
              </Button>
              <Button type="primary" icon={<ReloadOutlined />} onClick={fetchChannel}>
                {t('project.retry')}
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
              onClick={() => router.push(`/project/${projectId}/channel`)}
            >
              {t('project.back')}
            </Button>
            <Text strong style={{ fontSize: 16 }}>
              {channel.name}
            </Text>
          </Flexbox>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px' }}>
        <Card>
          <Text>频道聊天功能暂未实现</Text>
        </Card>
      </div>
    </div>
  );
}
