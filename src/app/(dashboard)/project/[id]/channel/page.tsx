'use client';

import { useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button, Text, Flexbox } from '@/lib/ui';
import { ArrowLeftOutlined } from '@ant-design/icons';
import ChannelConnect from '@/components/features/ChannelConnect';
import ChannelList from '@/components/features/ChannelList';

/** 项目频道管理页面 */
export default function ChannelPage() {
  const t = useTranslations('common');
  const router = useRouter();
  const resolvedParams = useParams();
  const projectId = resolvedParams.id as string;

  const handleChannelClick = useCallback(
    (channelId: string) => {
      router.push(`/project/${projectId}/channel/${channelId}`);
    },
    [router, projectId],
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-layout)' }}>
      {/* 顶部导航栏 */}
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
              onClick={() => router.push(`/project/${projectId}`)}
            >
              {t('workplace.back')}
            </Button>
            <Text strong style={{ fontSize: 16 }}>
              {t('channel.title')}
            </Text>
          </Flexbox>
        </div>
      </div>

      {/* 内容区域 */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px' }}>
        <Flexbox gap={20}>
          <Text type="secondary" style={{ fontSize: 14 }}>
            {t('channel.subtitle')}
          </Text>
          <ChannelConnect projectId={projectId} />
          <ChannelList projectId={projectId} onChannelClick={handleChannelClick} />
        </Flexbox>
      </div>
    </div>
  );
}
