'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, Tag, Button, Spin, Descriptions } from 'antd';
import { useTranslations } from 'next-intl';
import { ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, CloudUploadOutlined } from '@ant-design/icons';
import { Flexbox, Text } from '@/lib/ui';
import { useParams } from 'next/navigation';

interface BackupInfo {
  lastBackup: string | null;
  nextBackup: string | null;
  status: 'ok' | 'failed' | 'no_backup';
  backupCount: number;
  remoteUrl: string | null;
  remotePath: string | null;
  enabled: boolean;
}

interface BackupResponse {
  success: boolean;
  data?: BackupInfo;
  error?: { message: string };
}

export default function WorkplaceBackupsPage() {
  const params = useParams();
  const workspaceId = params.id as string;
  const t = useTranslations('cloud');
  const [backup, setBackup] = useState<BackupInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBackup = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/backups`);
      const data: BackupResponse = await res.json();
      if (data.success && data.data) {
        setBackup(data.data);
      }
    } catch {
      // 忽略错误
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchBackup();
  }, [fetchBackup]);

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
    if (!date) return t('none');
    return new Date(date).toLocaleString('zh-CN');
  };

  if (loading) {
    return (
      <Flexbox align="center" justify="center" style={{ minHeight: '50vh' }}>
        <Spin size="large" />
      </Flexbox>
    );
  }

  return (
    <Flexbox gap={16} style={{ flexDirection: 'column', padding: '0 16px' }}>
      <Text style={{ fontSize: 20, fontWeight: 700 }}>{t('backupStatus')}</Text>

      <Card
        title={t('syncStatus')}
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchBackup}>
            {t('refresh')}
          </Button>
        }
      >
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label={t('status')}>
            {backup?.enabled ? getStatusTag(backup.status) : <Tag color="default">{t('disabled')}</Tag>}
          </Descriptions.Item>
          <Descriptions.Item label={t('lastBackup')}>
            {formatDate(backup?.lastBackup ?? null)}
          </Descriptions.Item>
          <Descriptions.Item label={t('nextBackup')}>
            {formatDate(backup?.nextBackup ?? null)}
          </Descriptions.Item>
          <Descriptions.Item label={t('backupCount')}>
            {backup?.backupCount ?? 0}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={t('remoteConfig')}>
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label={t('serverUrl')}>
            {backup?.remoteUrl ?? t('notConfigured')}
          </Descriptions.Item>
          <Descriptions.Item label={t('remotePath')}>
            {backup?.remotePath ?? t('notConfigured')}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {!backup?.enabled && (
        <Card>
          <Flexbox align="center" gap={8} style={{ color: '#666' }}>
            <CloudUploadOutlined />
            <Text type="secondary">
              {t('webdavNotConfigured')}
            </Text>
          </Flexbox>
        </Card>
      )}
    </Flexbox>
  );
}