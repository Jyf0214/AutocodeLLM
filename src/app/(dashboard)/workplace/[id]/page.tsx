'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { message } from 'antd';
import { Button, Text, Flexbox, Icon, Avatar } from '@lobehub/ui';
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
      console.error('获取工作区详情失败:', err);
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
      title: 'AI 对话',
      description: '与 AI 进行对话交流',
      path: `/chat/${workspaceId}`,
      color: 'var(--lobe-color-primary)',
    },
    {
      icon: <HomeOutlined />,
      title: '工作台',
      description: '工作区仪表板和数据概览',
      path: `/workplace/${workspaceId}/dashboard`,
      color: 'var(--lobe-color-violet)',
    },
    {
      icon: <FileTextOutlined />,
      title: '日志',
      description: '查看对话历史和运行日志',
      path: `/workplace/${workspaceId}/logs`,
      color: 'var(--lobe-color-cyan)',
    },
    {
      icon: <TagOutlined />,
      title: '标签',
      description: '管理对话标签和分类',
      path: `/workplace/${workspaceId}/tags`,
      color: 'var(--lobe-color-orange)',
    },
    {
      icon: <TeamOutlined />,
      title: '成员',
      description: '管理工作区成员和权限',
      path: `/workplace/${workspaceId}/members`,
      color: 'var(--lobe-color-pink)',
    },
    {
      icon: <SettingOutlined />,
      title: '设置',
      description: '工作区配置和偏好设置',
      path: `/workplace/${workspaceId}/settings`,
      color: 'var(--lobe-color-gray)',
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
              返回
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
              加载失败
            </Text>
            <Text type="secondary">{error || '工作区不存在'}</Text>
            <Flexbox gap={12} horizontal justify="center">
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => router.push('/workplace')}
              >
                返回列表
              </Button>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={fetchWorkspace}
              >
                重试
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
              返回
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
              {workspace.description || '暂无描述'}
            </Text>
          </div>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => {}}
          >
            编辑
          </Button>
        </Flexbox>

        <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 16 }}>
          功能入口
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
              onMouseEnter={(e: any) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
              }}
              onMouseLeave={(e: any) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
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
            创建于 {new Date(workspace.createdAt).toLocaleDateString('zh-CN')}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            更新于 {new Date(workspace.updatedAt).toLocaleDateString('zh-CN')}
          </Text>
        </Flexbox>
      </div>
    </div>
  );
}