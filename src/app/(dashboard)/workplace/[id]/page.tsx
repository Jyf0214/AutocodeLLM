'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { message } from 'antd';
import { Button, Text, Flexbox, Icon, Avatar } from '@/lib/ui';
import { Card, Skeleton } from 'antd';
import {
  FolderOutlined,
  MessageOutlined,
  SettingOutlined,
  FileTextOutlined,
  TagOutlined,
  EditOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
  TeamOutlined,
  HomeOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import type { WorkspaceListItem } from '@/lib/api/workspace-types';

export default function WorkspaceDetailPage() {
  const t = useTranslations('workplace');
  const router = useRouter();
  const resolvedParams = useParams();
  const workspaceId = resolvedParams.id as string;
  const [workspace, setWorkspace] = useState<WorkspaceListItem | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        data?: WorkspaceListItem;
        error?: { message: string };
      } = await response.json();
      if (result.success && result.data) {
        setWorkspace(result.data);
      } else {
        const errorMsg = result.error?.message ?? t('fetchFailed');
        setError(errorMsg);
        message.error(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t('fetchFailed');
      setError(errorMsg);
      message.error(errorMsg);
      console.error('Failed to fetch workspace details:', err);
    } finally {
      setFetching(false);
    }
  }, [workspaceId, t]);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  const menuItems = [
    {
      icon: <MessageOutlined />,
      title: t('aiChat'),
      description: t('aiChatDesc'),
      path: `/chat/${workspaceId}`,
      color: 'var(--lobe-color-primary)',
    },
    {
      icon: <HomeOutlined />,
      title: t('dashboard'),
      description: t('dashboardDesc'),
      path: `/workplace/${workspaceId}/dashboard`,
      color: 'var(--lobe-color-violet)',
    },
    {
      icon: <FileTextOutlined />,
      title: t('logs'),
      description: t('logsDesc'),
      path: `/workplace/${workspaceId}/logs`,
      color: 'var(--lobe-color-cyan)',
    },
    {
      icon: <TagOutlined />,
      title: t('tags'),
      description: t('tagsDesc'),
      path: `/workplace/${workspaceId}/tags`,
      color: 'var(--lobe-color-orange)',
    },
    {
      icon: <TeamOutlined />,
      title: t('members'),
      description: t('membersDesc'),
      path: `/workplace/${workspaceId}/members`,
      color: 'var(--lobe-color-pink)',
    },
    {
      icon: <SettingOutlined />,
      title: t('settings'),
      description: t('settingsDesc'),
      path: `/workplace/${workspaceId}/settings`,
      color: 'var(--lobe-color-gray)',
  },
    {
      icon: <ApiOutlined />,
      title: t('channel'),
      description: t('channelDesc'),
      path: `/workplace/${workspaceId}/channel`,
      color: 'var(--lobe-color-purple)',
    },
  ];
  if (fetching) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--color-bg-layout)',
        }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px' }}>
          <Flexbox align="center" gap={12} style={{ marginBottom: 24 }}>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push('/workplace')}
            >
              {t('back')}
            </Button>
          </Flexbox>
          <Flexbox gap={16} align="center" style={{ marginBottom: 32 }}>
            <Skeleton.Avatar active size={64} shape="square" />
            <div style={{ flex: 1 }}>
              <Skeleton.Input active style={{ width: '40%', marginBottom: 8 }} />
              <Skeleton.Input active style={{ width: '60%' }} />
            </div>
          </Flexbox>
        </div>
      </div>
    );
  }

  if (error || !workspace) {
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
              icon={FolderOutlined}
              style={{ fontSize: 48, color: 'var(--lobe-color-error)' }}
            />
            <Text strong style={{ fontSize: 18 }}>
              {t('loadFailed')}
            </Text>
            <Text type="secondary">{error ?? t('workspaceNotExist')}</Text>
            <Flexbox gap={12} horizontal justify="center">
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => router.push('/workplace')}
              >
                {t('backToList')}
              </Button>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={fetchWorkspace}
              >
                {t('retry')}
              </Button>
            </Flexbox>
          </Flexbox>
        </Card>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg-layout)',
      }}
    >
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
              onClick={() => router.push('/workplace')}
            >
              {t('back')}
            </Button>
          </Flexbox>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px' }}>
        <Flexbox
          gap={20}
          align="center"
          style={{ marginBottom: 32 }}
        >
          <Avatar
            avatar={<FolderOutlined style={{ fontSize: 28 }} />}
            size={64}
            background="var(--lobe-color-primary)"
            shape="square"
            style={{ borderRadius: 16 }}
          />
          <div style={{ flex: 1 }}>
            <Text strong style={{ fontSize: 24, display: 'block', marginBottom: 4 }}>
              {workspace.name}
            </Text>
            <Text type="secondary" style={{ fontSize: 14 }}>
              {workspace.description || t('noDescription')}
            </Text>
          </div>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={undefined}
          >
            {t('editWorkspace')}
          </Button>
        </Flexbox>

        <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 16 }}>
          {t('features')}
        </Text>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 16,
          }}
        >
          {menuItems.map((item) => (
            <Card
              key={item.path}
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onClick={() => router.push(item.path)}
              onMouseEnter={(e) => {
                const target = e.currentTarget as HTMLDivElement;
                target.style.transform = 'translateY(-2px)';
                target.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
              }}
              onMouseLeave={(e) => {
                const target = e.currentTarget as HTMLDivElement;
                target.style.transform = 'translateY(0)';
                target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
              }}
            >
              <Flexbox gap={16} align="flex-start">
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: item.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon icon={item.icon} size={20} color="#fff" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text strong style={{ display: 'block', marginBottom: 4 }}>
                    {item.title}
                  </Text>
                  <Text
                    type="secondary"
                    style={{ fontSize: 13, display: 'block' }}
                  >
                    {item.description}
                  </Text>
                </div>
              </Flexbox>
            </Card>
          ))}
        </div>

        <Flexbox
          gap={12}
          style={{
            marginTop: 32,
            paddingTop: 24,
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t('createdAt')} {new Date(workspace.createdAt).toLocaleDateString()}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t('updatedAt')} {new Date(workspace.updatedAt).toLocaleDateString()}
          </Text>
        </Flexbox>
      </div>
    </div>
  );
}