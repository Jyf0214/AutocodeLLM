'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, Button, Space, Form, Input, Switch, message as antdMessage, Tag } from 'antd';
import { CloudUploadOutlined, CloudDownloadOutlined, PlayCircleOutlined, PauseCircleOutlined, SettingOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Flexbox, Text } from '@lobehub/ui';
import { useTranslations } from 'next-intl';

interface SyncStatus {
  enabled: boolean;
  watching: boolean;
  url: string;
  remotePath: string;
}

export default function SyncPage() {
  const t = useTranslations('cloud');
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [configMode, setConfigMode] = useState(false);
  const [form] = Form.useForm();

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/sync');
      const data = await res.json() as { success: boolean; data?: SyncStatus };
      if (data.success && data.data) {
        setStatus(data.data);
      }
    } catch {
      // 忽略错误
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleAction = useCallback(async (action: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json() as { success: boolean; message?: string };
      if (data.success) {
        antdMessage.success(t('actionSuccess'));
      } else {
        antdMessage.error(data.message ?? t('actionFailed'));
      }
      await fetchStatus();
    } catch {
      antdMessage.error(t('actionFailed'));
    } finally {
      setLoading(false);
    }
  }, [fetchStatus, t]);

  const handleSaveConfig = useCallback(async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', ...values }),
      });
      const data = await res.json() as { success: boolean; message?: string };
      if (data.success) {
        antdMessage.success(t('configSaved'));
        setConfigMode(false);
        await fetchStatus();
      } else {
        antdMessage.error(t('saveFailed'));
      }
    } catch {
      antdMessage.error(t('saveFailed'));
    } finally {
      setLoading(false);
    }
  }, [fetchStatus, t]);

  const handleTest = useCallback(async () => {
    const values = form.getFieldsValue() as Record<string, string>;
    setLoading(true);
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', ...values }),
      });
      const data = await res.json() as { success: boolean; message?: string };
      if (data.success) {
        antdMessage.success(t('connectionSuccess'));
      } else {
        antdMessage.error(t('connectionFailed'));
      }
    } catch {
      antdMessage.error(t('connectionFailed'));
    } finally {
      setLoading(false);
    }
  }, [form, t]);

  return (
    <Flexbox gap={16} style={{ flexDirection: 'column', height: '100%', maxHeight: 'calc(100dvh - 64px)', overflowY: 'auto', padding: '0 16px 24px' }}>
      <Text style={{ fontSize: 20, fontWeight: 700 }}>{t('title')}</Text>
      <Text type="secondary">{t('description')}</Text>

      <Card
        title={t('syncStatus')}
        extra={
          status?.enabled ? (
            <Tag icon={<CheckCircleOutlined />} color="success">{t('enabled')}</Tag>
          ) : (
            <Tag icon={<CloseCircleOutlined />} color="default">{t('disabled')}</Tag>
          )
        }
        size="small"
      >
        <Space style={{ width: '100%', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
          <Flexbox horizontal justify="space-between" wrap="wrap" gap={8}>
            <Text type="secondary">{t('serverUrl')}</Text>
            <Text style={{ wordBreak: 'break-all' }}>{status?.url ?? t('notConfigured')}</Text>
          </Flexbox>
          <Flexbox horizontal justify="space-between" wrap="wrap" gap={8}>
            <Text type="secondary">{t('remotePath')}</Text>
            <Text style={{ wordBreak: 'break-all' }}>{status?.remotePath ?? t('notConfigured')}</Text>
          </Flexbox>
          <Flexbox horizontal justify="space-between" wrap="wrap" gap={8}>
            <Text type="secondary">{t('fileWatching')}</Text>
            <Text>{status?.watching ? t('running') : t('stopped')}</Text>
          </Flexbox>
        </Space>
      </Card>

      <Card title={t('actions')} size="small">
        <Space wrap size={[8, 8]}>
          <Button
            icon={<CloudDownloadOutlined />}
            loading={loading}
            onClick={() => handleAction('pull')}
            disabled={!status?.enabled}
          >
            {t('pullFromRemote')}
          </Button>
          <Button
            icon={<CloudUploadOutlined />}
            loading={loading}
            onClick={() => handleAction('push')}
            disabled={!status?.enabled}
          >
            {t('pushToRemote')}
          </Button>
          <Button
            icon={<PlayCircleOutlined />}
            loading={loading}
            onClick={() => handleAction('start')}
            disabled={!status?.enabled || status?.watching}
          >
            {t('startWatching')}
          </Button>
          <Button
            icon={<PauseCircleOutlined />}
            loading={loading}
            onClick={() => handleAction('stop')}
            disabled={!status?.watching}
          >
            {t('stopWatching')}
          </Button>
          <Button
            icon={<SettingOutlined />}
            onClick={() => setConfigMode(!configMode)}
          >
            {configMode ? t('cancelConfig') : t('configureServer')}
          </Button>
        </Space>
      </Card>

      {configMode && (
        <Card title={t('webdavServerSettings')} size="small">
          <Form form={form} layout="vertical" onFinish={handleSaveConfig}>
            <Form.Item name="url" label={t('serverUrl')} rules={[{ required: true, message: t('serverUrlRequired') }]}>
              <Input placeholder="https://webdav.example.com" />
            </Form.Item>
            <Form.Item name="username" label={t('username')} rules={[{ required: true, message: t('usernameRequired') }]}>
              <Input placeholder="username" />
            </Form.Item>
            <Form.Item name="password" label={t('password')} rules={[{ required: true, message: t('passwordRequired') }]}>
              <Input.Password placeholder="password" />
            </Form.Item>
            <Form.Item name="remotePath" label={t('remotePath')} rules={[{ required: true, message: t('remotePathRequired') }]}>
              <Input placeholder="/autocodellm" />
            </Form.Item>
            <Form.Item name="enabled" label={t('enableSync')} valuePropName="checked" initialValue={false}>
              <Switch />
            </Form.Item>
            <Form.Item>
              <Space wrap size={[8, 8]}>
                <Button type="primary" htmlType="submit" loading={loading}>{t('saveConfig')}</Button>
                <Button onClick={handleTest} loading={loading}>{t('testConnection')}</Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      )}
    </Flexbox>
  );
}
