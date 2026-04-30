'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Spin, Space } from 'antd';
import { useTranslations } from 'next-intl';
import { ReloadOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Flexbox, Text, Avatar } from '@/lib/ui';
import { useRouter } from 'next/navigation';

interface WorkspaceBackup {
  workspaceId: string;
  workspaceName: string;
  lastBackup: string | null;
  nextBackup: string | null;
  status: 'ok' | 'failed' | 'no_backup';
  backupCount: number;
}

interface GlobalBackupsResponse {
  success: boolean;
  data?: WorkspaceBackup[];
  error?: { message: string };
}

export default function GlobalBackupsPage() {
  const router = useRouter();
  const t = useTranslations('cloud');
  const [backups, setBackups] = useState<WorkspaceBackup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBackups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cloud/backups');
      const data: GlobalBackupsResponse = await res.json();
      if (data.success && data.data) {
        setBackups(data.data);
      }
    } catch {
      // 忽略错误
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'ok':
        return <Tag icon={<CheckCircleOutlined />} color="success">{t('ok')}</Tag>;
      case 'failed':
        return <Tag icon={<CloseCircleOutlined />} color="error">{t('failed')}</Tag>;
      case 'no_backup':
        return <Tag icon={<ClockCircleOutlined />} color="default">{t('noBackup')}</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('zh-CN');
  };

  const columns = [
    {
      title: t('workspace'),
      dataIndex: 'workspaceName',
      key: 'workspaceName',
      render: (name: string) => {
        const nameStr = name;
        return (
          <Flexbox horizontal gap={8} align="center">
            <Avatar size="small" style={{ backgroundColor: 'var(--text-primary)' }}>
              {nameStr.charAt(0)}
            </Avatar>
            <Text style={{ fontWeight: 500 }}>{nameStr}</Text>
          </Flexbox>
        );
      },
    },
    {
      title: t('status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: t('lastBackup'),
      dataIndex: 'lastBackup',
      key: 'lastBackup',
      render: (date: string | null) => formatDate(date),
    },
    {
      title: t('nextBackup'),
      dataIndex: 'nextBackup',
      key: 'nextBackup',
      render: (date: string | null) => formatDate(date),
    },
    {
      title: t('backupCount'),
      dataIndex: 'backupCount',
      key: 'backupCount',
      render: (count: number) => count,
    },
    {
      title: t('actions'),
      key: 'action',
      render: (_: unknown, record: WorkspaceBackup) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => router.push(`/workplace/${record.workspaceId}/backups`)}
          >
            {t('viewDetails')}
          </Button>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <Flexbox align="center" justify="center" style={{ height: '100%' }}>
        <Spin size="large" />
      </Flexbox>
    );
  }

  return (
    <Flexbox gap={16} style={{ flexDirection: 'column', height: '100%', maxHeight: 'calc(100dvh - 64px)', overflowY: 'auto', padding: '0 16px 24px' }}>
      <Text style={{ fontSize: 20, fontWeight: 700 }}>{t('globalBackupMonitor')}</Text>
      <Text type="secondary">{t('backupDesc')}</Text>

      <Card
        title={t('backupOverview')}
        extra={
          <Button
            type="text"
            size="small"
            icon={<ReloadOutlined />}
            onClick={fetchBackups}
          >
            {t('refresh')}
          </Button>
        }
      >
        {backups.length === 0 ? (
          <Flexbox align="center" justify="center" style={{ padding: 48 }}>
            <Text type="secondary">{t('noBackupData')}</Text>
          </Flexbox>
        ) : (
          <Table
            columns={columns}
            dataSource={backups}
            rowKey="workspaceId"
            pagination={false}
          />
        )}
      </Card>
    </Flexbox>
  );
}