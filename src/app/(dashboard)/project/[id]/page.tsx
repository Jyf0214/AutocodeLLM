'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { message } from 'antd';
import { Button, Text, Flexbox } from '@/lib/ui';
import { Skeleton } from 'antd';
import {
  FolderOutlined,
  MessageOutlined,
  SettingOutlined,
  EditOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
  ApiOutlined,
  ArrowRightOutlined,
  ClockCircleOutlined,
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
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json() as {
        success: boolean;
        data?: WorkspaceListItem;
        error?: { message: string };
      };
      if (result.success && result.data) {
        setWorkspace(result.data);
      } else {
        setError(result.error?.message ?? t('fetchFailed'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('fetchFailed'));
    } finally {
      setFetching(false);
    }
  }, [workspaceId, t]);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  const menuItems = [
    { icon: <MessageOutlined />, title: t('aiChat'), desc: t('aiChatDesc'), path: `/chat/${workspaceId}` },
    { icon: <SettingOutlined />, title: t('settings'), desc: t('settingsDesc'), path: `/project/${workspaceId}/detail` },
    { icon: <ApiOutlined />, title: t('channel'), desc: t('channelDesc'), path: `/project/${workspaceId}/channel` },
  ];

  if (fetching) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px' }}>
        <Skeleton active paragraph={{ rows: 4 }} />
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px', textAlign: 'center' }}>
        <FolderOutlined style={{ fontSize: 48, color: 'var(--text-tertiary)', marginBottom: 16 }} />
        <Text strong style={{ fontSize: 18, display: 'block', marginBottom: 8 }}>{t('loadFailed')}</Text>
        <Text type="secondary">{error ?? t('workspaceNotExist')}</Text>
        <Flexbox gap={12} horizontal justify="center" style={{ marginTop: 24 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/project')}>{t('backToList')}</Button>
          <Button icon={<ReloadOutlined />} onClick={fetchWorkspace}>{t('retry')}</Button>
        </Flexbox>
      </div>
    );
  }

  const created = new Date(workspace.createdAt);
  const updated = new Date(workspace.updatedAt);
  const fmt = (d: Date) => `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px' }}>
      {/* 头部 */}
      <div style={{ marginBottom: 32 }}>
        <button
          onClick={() => router.push('/project')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 13,
            color: 'var(--text-tertiary)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            marginBottom: 20,
          }}
        >
          <ArrowLeftOutlined style={{ fontSize: 12 }} />
          {t('back')}
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 10,
              background: 'var(--bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <FolderOutlined style={{ fontSize: 22, color: 'var(--text-secondary)' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Text strong style={{ fontSize: 20 }}>{workspace.name}</Text>
              <button
                onClick={() => {
                  // TODO: 编辑项目
                }}
                style={{
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 6,
                  background: 'var(--bg-primary)',
                  cursor: 'pointer',
                  color: 'var(--text-tertiary)',
                  fontSize: 13,
                }}
              >
                <EditOutlined />
              </button>
            </div>
            <Text type="secondary" style={{ fontSize: 13, display: 'block', marginTop: 4, fontStyle: workspace.description ? 'normal' : 'italic' }}>
              {workspace.description || t('noDescription')}
            </Text>
            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <ClockCircleOutlined style={{ fontSize: 11 }} />
                创建于 {fmt(created)}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                更新于 {fmt(updated)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 功能入口 */}
      <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {t('features')}
      </Text>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {menuItems.map((item) => (
          <div
            key={item.path}
            onClick={() => router.push(item.path)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 16px',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'background 0.1s ease',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-secondary)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: 'var(--text-secondary)',
                fontSize: 16,
              }}
            >
              {item.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 14, display: 'block' }}>{item.title}</Text>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 2 }}>
                {item.desc}
              </Text>
            </div>
            <ArrowRightOutlined style={{ fontSize: 12, color: 'var(--text-tertiary)' }} />
          </div>
        ))}
      </div>
    </div>
  );
}