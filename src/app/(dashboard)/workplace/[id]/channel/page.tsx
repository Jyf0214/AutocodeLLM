'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { message } from 'antd';
import { Button, Text, Flexbox, Icon, Avatar } from '@lobehub/ui';
import { Card, Skeleton } from 'antd';
import { ArrowLeftOutlined, ReloadOutlined, ApiOutlined } from '@ant-design/icons';

import ChannelConnect from '@/components/features/ChannelConnect';
import ChannelList from '@/components/features/ChannelList';

export default function ChannelPage() {
  const t = useTranslations('common.channel');
  const router = useRouter();
  const resolvedParams = useParams();
  const workspaceId = resolvedParams.id as string;

  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string>('');

  const fetchWorkspace = useCallback(async () => {
    setFetching(true);
    setError(null);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${String(response.status)}`);
      }
      const result: {
        success: boolean;
        data?: { id: string; name: string };
        error?: { message: string };
      } = await response.json();

      if (result.success && result.data) {
        setWorkspaceName(result.data.name);
      } else {
        const errorMsg = result.error?.message ?? 'Failed to fetch workspace';
        setError(errorMsg);
        message.error(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch workspace';
      setError(errorMsg);
      message.error(errorMsg);
      console.error('Failed to fetch workspace:', err);
    } finally {
      setFetching(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

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
                onClick={() => router.push(`/workplace/${workspaceId}`)}
              >
                {t('title')}
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
          <Card style={{ marginBottom: 20 }}>
            <Skeleton active paragraph={{ rows: 3 }} />
          </Card>
          <Card>
            <Skeleton active paragraph={{ rows: 4 }} />
          </Card>
        </div>
      </div>
    );
  }

  if (error || !workspaceName) {
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
              icon={ApiOutlined}
              style={{ fontSize: 48, color: 'var(--lobe-color-error)' }}
            />
            <Text strong style={{ fontSize: 18 }}>
              {t('title')}
            </Text>
            <Text type="secondary">{error ?? 'Workspace does not exist'}</Text>
            <Flexbox gap={12} horizontal justify="center">
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => router.push(`/workplace/${workspaceId}`)}
              >
                {t('title')}
              </Button>
              <Button type="primary" icon={<ReloadOutlined />} onClick={fetchWorkspace}>
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
              onClick={() => router.push(`/workplace/${workspaceId}`)}
            >
              {t('title')}
            </Button>
          </Flexbox>
        </div>
      </div>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px' }}>
        <Flexbox gap={20} align="center" style={{ marginBottom: 32 }}>
          <Avatar
            avatar={<ApiOutlined style={{ fontSize: 28 }} />}
            size={64}
            background="var(--lobe-color-violet)"
            shape="square"
            style={{ borderRadius: 16 }}
          />
          <div style={{ flex: 1 }}>
            <Text strong style={{ fontSize: 24, display: 'block', marginBottom: 4 }}>
              {t('title')}
            </Text>
            <Text type="secondary" style={{ fontSize: 14 }}>
              {t('subtitle')}
            </Text>
          </div>
        </Flexbox>

        <Card
          style={{
            marginBottom: 20,
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
          }}
        >
          <ChannelConnect workspaceId={workspaceId} />
        </Card>

        <Card
          style={{
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
          }}
        >
          <ChannelList workspaceId={workspaceId} />
        </Card>
      </div>
    </div>
  );
}
