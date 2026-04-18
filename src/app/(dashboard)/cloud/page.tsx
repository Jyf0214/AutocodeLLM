'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Space, Tag, Spin } from 'antd';
import {
  CloudServerOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { Flexbox, Text, Avatar } from '@lobehub/ui';

interface SyncStatus {
  enabled: boolean;
  watching: boolean;
  url: string;
  remotePath: string;
}

interface WorkspaceBackupStatus {
  workspaceId: string;
  workspaceName: string;
  lastBackup: string | null;
  status: 'ok' | 'failed' | 'no_backup';
}

interface CloudOverview {
  sync: SyncStatus | null;
  workspaceBackups: WorkspaceBackupStatus[];
}

interface ApiResponse {
  success: boolean;
  data?: CloudOverview;
  error?: { message: string };
}

export default function CloudPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<CloudOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch('/api/cloud/overview');
      const data: ApiResponse = await res.json();
      if (data.success && data.data) {
        setOverview(data.data);
      }
    } catch {
      // 忽略错误
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const getSyncStatusTag = () => {
    if (!overview?.sync?.enabled) {
      return <Tag icon={<CloudServerOutlined />} color="default">未配置</Tag>;
    }
    if (overview.sync.watching) {
      return <Tag icon={<CloudUploadOutlined />} color="success">同步中</Tag>;
    }
    return <Tag icon={<CloudServerOutlined />} color="processing">已配置</Tag>;
  };

  const navigateTo = (path: string) => {
    router.push(path);
  };

  if (loading) {
    return (
      <Flexbox align="center" justify="center" style={{ minHeight: '50vh' }}>
        <Spin size="large" />
      </Flexbox>
    );
  }

  return (
    <Flexbox gap={16} style={{ flexDirection: 'column', height: '100%', maxHeight: 'calc(100dvh - 64px)', overflowY: 'auto', padding: '0 16px 24px' }}>
      <Text style={{ fontSize: 20, fontWeight: 700 }}>云服务</Text>
      <Text type="secondary">统一管理云存储、同步与备份服务</Text>

      <Card title="WebDAV 同步状态" extra={getSyncStatusTag()} size="small">
        <Space style={{ width: '100%', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
          <Flexbox horizontal justify="space-between" wrap="wrap" gap={8}>
            <Text type="secondary">服务器地址</Text>
            <Text style={{ wordBreak: 'break-all' }}>{overview?.sync?.url ?? '未配置'}</Text>
          </Flexbox>
          <Flexbox horizontal justify="space-between" wrap="wrap" gap={8}>
            <Text type="secondary">远程路径</Text>
            <Text style={{ wordBreak: 'break-all' }}>{overview?.sync?.remotePath ?? '未配置'}</Text>
          </Flexbox>
        </Space>
      </Card>

      <Card title="快速入口" size="small">
        <Space wrap size={[8, 8]}>
          <Button type="primary" icon={<CloudServerOutlined />} onClick={() => navigateTo('/cloud/webdav')}>
            WebDAV 配置
          </Button>
          <Button icon={<CloudDownloadOutlined />} onClick={() => navigateTo('/cloud/backups')}>
            备份监控
          </Button>
        </Space>
      </Card>

      <Card title="工作区备份状态" size="small">
        {overview?.workspaceBackups && overview.workspaceBackups.length > 0 ? (
          <Flexbox gap={8} style={{ flexDirection: 'column' }}>
            {overview.workspaceBackups.map((ws) => (
              <Card
                key={ws.workspaceId}
                size="small"
                style={{ cursor: 'pointer' }}
                onClick={() => navigateTo(`/workplace/${ws.workspaceId}/backups`)}
              >
                <Flexbox horizontal justify="space-between" wrap="wrap" gap={8}>
                  <Flexbox horizontal gap={8} align="center">
                    <Avatar size="small" style={{ backgroundColor: '#1677ff' }}>
                      {ws.workspaceName.charAt(0)}
                    </Avatar>
                    <Text style={{ fontWeight: 500 }}>{ws.workspaceName}</Text>
                  </Flexbox>
                  <Flexbox horizontal gap={8} align="center">
                    {ws.status === 'ok' ? (
                      <Tag color="success">已备份</Tag>
                    ) : ws.status === 'failed' ? (
                      <Tag color="error">备份失败</Tag>
                    ) : (
                      <Tag color="default">未备份</Tag>
                    )}
                    <RightOutlined style={{ fontSize: 12, color: '#999' }} />
                  </Flexbox>
                </Flexbox>
              </Card>
            ))}
          </Flexbox>
        ) : (
          <Flexbox align="center" justify="center" style={{ padding: 24 }}>
            <Text type="secondary">暂无工作区数据</Text>
          </Flexbox>
        )}
      </Card>
    </Flexbox>
  );
}