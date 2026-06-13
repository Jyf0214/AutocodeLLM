'use client';

import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button, Text, Flexbox } from '@/lib/ui';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Card } from 'antd';

/** 项目频道管理页面 */
export default function ChannelPage() {
  const t = useTranslations('common');
  const router = useRouter();
  const resolvedParams = useParams();
  const projectId = resolvedParams.id as string;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div
        style={{
          background: 'var(--color-bg)',
          borderBottom: '1px solid var(--border-primary)',
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
              {t('project.back')}
            </Button>
            <Text strong style={{ fontSize: 16 }}>
              {t('channel.title')}
            </Text>
          </Flexbox>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px' }}>
        <Card>
          <Text>频道管理功能暂未实现</Text>
        </Card>
      </div>
    </div>
  );
}
