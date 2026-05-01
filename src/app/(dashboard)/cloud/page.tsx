'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, Button, Space, Tag, Spin, Modal, List, Progress } from 'antd';
import {
  CloudServerOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined,
  RightOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { Flexbox, Text, Avatar } from '@/lib/ui';

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
  const t = useTranslations('cloud');
  const [overview, setOverview] = useState<CloudOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [backingUpId, setBackingUpId] = useState<string | null>(null);
  const [backupLogs, setBackupLogs] = useState<Array<{timestamp: string; workspaceId: string; workspaceName: string; status: string; message: string}>>([]);

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

  const handleBackupNow = async (workspaceId: string, workspaceName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBackingUpId(workspaceId);
    try {
      const res = await fetch('/api/cloud/backup-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchBackupLogs();
      }
    } catch {
      // ignore
    } finally {
      setBackingUpId(null);
    }
  };

  const fetchBackupLogs = async () => {
    try {
      const res = await fetch('/api/cloud/backup-now');
      const data = await res.json();
      if (data.success && data.data) {
        setBackupLogs(data.data);
      }
    } catch {
      // ignore
    }
  };

  const openBackupLogs = (workspaceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    fetchBackupLogs();
    setBackupModalOpen(true);
  };

  const getSyncStatusTag = () => {
    if (!overview?.sync?.enabled) {
      return <Tag icon={<CloudServerOutlined />} color="default">{t('notConfigured')}</Tag>;
    }
    if (overview.sync.watching) {
      return <Tag icon={<CloudUploadOutlined />} color="success">{t('syncing')}</Tag>;
    }
    return <Tag icon={<CloudServerOutlined />} color="processing">{t('configured')}</Tag>;
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
      <Text style={{ fontSize: 20, fontWeight: 700 }}>{t('title')}</Text>
      <Text type="secondary">{t('description')}</Text>

      <Card title={t('webdavSyncStatus')} extra={getSyncStatusTag()} size="small">
        <Space style={{ width: '100%', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
          <Flexbox horizontal justify="space-between" wrap gap={8}>
            <Text type="secondary">{t('serverUrl')}</Text>
            <Text style={{ wordBreak: 'break-all' }}>{overview?.sync?.url ?? t('notConfigured')}</Text>
          </Flexbox>
          <Flexbox horizontal justify="space-between" wrap gap={8}>
            <Text type="secondary">{t('remotePath')}</Text>
            <Text style={{ wordBreak: 'break-all' }}>{overview?.sync?.remotePath ?? t('notConfigured')}</Text>
          </Flexbox>
        </Space>
      </Card>

      <Card title={t('quickAccess')} size="small">
        <Space wrap size={[8, 8]}>
          <Button type="primary" icon={<CloudServerOutlined />} onClick={() => navigateTo('/cloud/webdav')}>
            {t('webdavConfig')}
          </Button>
          <Button icon={<CloudDownloadOutlined />} onClick={() => navigateTo('/cloud/backups')}>
            {t('backupMonitor')}
          </Button>
        </Space>
      </Card>

      <Card title={t('workspaceBackupStatus')} size="small">
        {overview?.workspaceBackups && overview.workspaceBackups.length > 0 ? (
          <Flexbox gap={8} style={{ flexDirection: 'column' }}>
            {overview.workspaceBackups.map((ws) => (
              <Card
                key={ws.workspaceId}
                size="small"
                style={{ cursor: 'pointer' }}
                onClick={() => navigateTo(`/project/${ws.workspaceId}/backups`)}
              >
                <Flexbox horizontal justify="space-between" wrap gap={8}>
                  <Flexbox horizontal gap={8} align="center">
                    <Avatar size="small" style={{ backgroundColor: 'var(--text-primary)' }}>
                      {ws.workspaceName.charAt(0)}
                    </Avatar>
                    <Text style={{ fontWeight: 500 }}>{ws.workspaceName}</Text>
                  </Flexbox>
                  <Flexbox horizontal gap={8} align="center">
                    {ws.status === 'ok' ? (
                      <Tag color="success">{t('backedUp')}</Tag>
                    ) : ws.status === 'failed' ? (
                      <Tag color="error">{t('backupFailed')}</Tag>
                    ) : (
                      <Tag color="default">{t('notBackedUp')}</Tag>
                    )}
                    <Button
                      type="text"
                      size="small"
                      icon={<PlayCircleOutlined />}
                      loading={backingUpId === ws.workspaceId}
                      onClick={(e) => handleBackupNow(ws.workspaceId, ws.workspaceName, e)}
                      title={t('backupNow') || '立即备份'}
                    />
                    <Button
                      type="text"
                      size="small"
                      icon={<CloudUploadOutlined />}
                      onClick={(e) => openBackupLogs(ws.workspaceId, e)}
                      title={t('viewLogs') || '查看日志'}
                    />
                    <RightOutlined style={{ fontSize: 12, color: '#999' }} />
                  </Flexbox>
                </Flexbox>
              </Card>
            ))}
          </Flexbox>
        ) : (
          <Flexbox align="center" justify="center" style={{ padding: 24 }}>
            <Text type="secondary">{t('noWorkspaceData')}</Text>
          </Flexbox>
        )}
      </Card>

      <Modal
        title={t('backupLogs') || '备份日志'}
        open={backupModalOpen}
        onCancel={() => setBackupModalOpen(false)}
        footer={null}
        width={600}
      >
        <List
          dataSource={backupLogs.filter(
            (log) => overview?.workspaceBackups?.some((ws) => ws.workspaceId === log.workspaceId)
          )}
          renderItem={(item) => (
            <List.Item>
              <Flexbox horizontal gap={8} style={{ width: '100%' }}>
                {item.status === 'running' ? (
                  <LoadingOutlined spin style={{ color: 'var(--text-primary)' }} />
                ) : item.status === 'success' ? (
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                ) : (
                  <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                )}
                <Text style={{ flex: 1 }}>{item.workspaceName}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {item.message}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {new Date(item.timestamp).toLocaleString('zh-CN')}
                </Text>
              </Flexbox>
            </List.Item>
          )}
        />
      </Modal>
    </Flexbox>
  );
}