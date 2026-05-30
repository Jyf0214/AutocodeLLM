'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, Button, Space, Form, Input, Switch, message as antdMessage, Tag, Descriptions, Skeleton, Badge, Divider } from 'antd';
import { useTranslations } from 'next-intl';
import {
  CloudServerOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SettingOutlined,
  AimOutlined,
  PlayCircleOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { Flexbox, Text } from '@/lib/ui';

interface SyncStatus {
  enabled: boolean;
  watching: boolean;
  url: string;
  remotePath: string;
}

interface ApiResponse {
  success: boolean;
  data?: SyncStatus;
  error?: { message: string };
}

export default function WebDAVPage() {
  const t = useTranslations('cloud');
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [configMode, setConfigMode] = useState(false);
  const [form] = Form.useForm();

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/sync');
      const data: ApiResponse = await res.json();
      if (data.success && data.data) {
        setStatus(data.data);
      }
    } catch {
      // 忽略错误
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/sync');
        const data: ApiResponse = await res.json();
        if (data.success && data.data) {
          setStatus(data.data);
        }
      } catch {
        // 忽略错误
      } finally {
        setInitialLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (status) {
      form.setFieldsValue({
        url: status.url,
        remotePath: status.remotePath,
        username: '',
        password: '',
        enabled: status.enabled,
      });
    }
  }, [status, form]);

  const handleSaveConfig = useCallback(async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', ...values }),
      });
      const data: { success: boolean; message?: string } = await res.json();
      if (data.success) {
        antdMessage.success(t('saveConfig') + ' ' + t('ok'));
        setConfigMode(false);
        await fetchStatus();
      } else {
        antdMessage.error(data.message ?? t('saveFailed'));
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
      const data: { success: boolean; message?: string } = await res.json();
      if (data.success) {
        antdMessage.success(t('connectionSuccess'));
      } else {
        antdMessage.error(data.message ?? t('connectionFailed'));
      }
    } catch {
      antdMessage.error(t('connectionFailed'));
    } finally {
      setLoading(false);
    }
  }, [form, t]);

  const iconStyle = { fontSize: 18, color: '#1677ff' };

  return (
    <Flexbox gap={20} style={{ flexDirection: 'column', height: '100%', maxHeight: 'calc(100dvh - 64px)', overflowY: 'auto', padding: '0 16px 24px' }}>
      {/* 页面标题 */}
      <div style={{ padding: '4px 0' }}>
        <Flexbox horizontal gap={12} align="center">
          <CloudServerOutlined style={{ fontSize: 24, color: '#1677ff' }} />
          <div>
            <Text style={{ fontSize: 20, fontWeight: 700, display: 'block', lineHeight: 1.4 }}>{t('webdavConfig')}</Text>
            <Text type="secondary" style={{ fontSize: 13 }}>{t('description')}</Text>
          </div>
        </Flexbox>
      </div>

      {/* 连接状态卡片 */}
      <Card
        style={{ borderRadius: 8 }}
        styles={{ body: { padding: 20 } }}
      >
        {initialLoading ? (
          <Skeleton active paragraph={{ rows: 3 }} />
        ) : (
          <>
            {/* 状态概览条 */}
            <Flexbox horizontal justify="space-between" align="center" style={{ marginBottom: 16 }}>
              <Flexbox horizontal gap={16} align="center">
                <Badge
                  status={status?.enabled ? 'success' : 'default'}
                  text={
                    <Text style={{ fontWeight: 600, fontSize: 14 }}>
                      {status?.enabled ? t('enabled') : t('disabled')}
                    </Text>
                  }
                />
                <Divider type="vertical" style={{ height: 20 }} />
                <Flexbox horizontal gap={6} align="center">
                  <span style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: status?.watching ? '#52c41a' : '#d9d9d9',
                  }} />
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {status?.watching ? t('running') : t('stopped')}
                  </Text>
                </Flexbox>
              </Flexbox>

              {/* 配置/取消按钮 */}
              <Button
                type={configMode ? 'default' : 'primary'}
                icon={configMode ? <CloseCircleOutlined /> : <SettingOutlined />}
                onClick={() => setConfigMode(!configMode)}
                size="small"
              >
                {configMode ? t('cancelConfig') : t('configureServer')}
              </Button>
            </Flexbox>

            <Divider style={{ margin: '0 0 12px' }} />

            {/* 服务器信息 */}
            <Descriptions column={1} size="small" style={{ marginBottom: 0 }}>
              <Descriptions.Item
                label={<Text type="secondary" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{t('serverUrl')}</Text>}
                style={{ paddingBottom: 8 }}
              >
                {status?.url ? (
                  <Text style={{ wordBreak: 'break-all', fontSize: 13 }}>
                    {status.url}
                  </Text>
                ) : (
                  <Tag style={{ fontSize: 12, margin: 0 }}>{t('notConfigured')}</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item
                label={<Text type="secondary" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{t('remotePath')}</Text>}
                style={{ paddingBottom: 0 }}
              >
                {status?.remotePath ? (
                  <Text style={{ wordBreak: 'break-all', fontSize: 13 }}>{status.remotePath}</Text>
                ) : (
                  <Tag style={{ fontSize: 12, margin: 0 }}>{t('notConfigured')}</Tag>
                )}
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Card>

      {/* 配置表单（展开/收起） */}
      {configMode && (
        <Card
          style={{ borderRadius: 8, border: '1px solid #1677ff' }}
          styles={{ header: { background: '#f0f5ff', borderRadius: '8px 8px 0 0' }, body: { padding: 20 } }}
          title={
            <Flexbox horizontal gap={8} align="center">
              <SettingOutlined style={{ fontSize: 16, color: '#1677ff' }} />
              <Text style={{ fontWeight: 600 }}>{t('webdavServerSettings')}</Text>
            </Flexbox>
          }
        >
          <Form form={form} layout="vertical" onFinish={handleSaveConfig} requiredMark="optional">
            <Form.Item
              name="url"
              label={<Text style={{ fontWeight: 500 }}>{t('serverUrl')}</Text>}
              rules={[{ required: true, message: t('serverUrl') + ' ' + t('notConfigured') }]}
              tooltip="WebDAV 服务器地址，例如 https://webdav.example.com"
            >
              <Input
                placeholder="https://webdav.example.com"
                prefix={<CloudServerOutlined style={{ color: '#bfbfbf' }} />}
                style={{ borderRadius: 6 }}
              />
            </Form.Item>

            <Flexbox horizontal gap={16} style={{ width: '100%' }}>
              <Form.Item
                name="username"
                label={<Text style={{ fontWeight: 500 }}>{t('username')}</Text>}
                rules={[{ required: true, message: t('username') + ' ' + t('notConfigured') }]}
                style={{ flex: 1 }}
              >
                <Input placeholder="username" prefix={<span style={{ color: '#bfbfbf', fontSize: 13 }}>👤</span>} style={{ borderRadius: 6 }} />
              </Form.Item>
              <Form.Item
                name="password"
                label={<Text style={{ fontWeight: 500 }}>{t('password')}</Text>}
                rules={[{ required: true, message: t('password') + ' ' + t('notConfigured') }]}
                style={{ flex: 1 }}
              >
                <Input.Password
                  placeholder={status?.url ? '留空则保持原密码' : 'password'}
                  style={{ borderRadius: 6 }}
                />
              </Form.Item>
            </Flexbox>

            <Form.Item
              name="remotePath"
              label={<Text style={{ fontWeight: 500 }}>{t('remotePath')}</Text>}
              rules={[{ required: true, message: t('remotePath') + ' ' + t('notConfigured') }]}
              tooltip="远程存储路径，例如 /autocodellm"
            >
              <Input
                placeholder="/autocodellm"
                prefix={<AimOutlined style={{ color: '#bfbfbf' }} />}
                style={{ borderRadius: 6 }}
              />
            </Form.Item>

            <Form.Item name="enabled" label={<Text style={{ fontWeight: 500 }}>{t('enableSync')}</Text>} valuePropName="checked" initialValue={false}>
              <Switch />
            </Form.Item>

            <Divider style={{ margin: '8px 0 16px' }} />

            <Form.Item style={{ marginBottom: 0 }}>
              <Flexbox horizontal gap={12} justify="flex-end">
                <Button onClick={() => setConfigMode(false)} loading={loading}>
                  {t('cancelConfig')}
                </Button>
                <Button
                  icon={<PlayCircleOutlined />}
                  onClick={handleTest}
                  loading={loading}
                  style={{ borderRadius: 6 }}
                >
                  {t('testConnection')}
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={loading}
                  style={{ borderRadius: 6 }}
                >
                  {t('saveConfig')}
                </Button>
              </Flexbox>
            </Form.Item>
          </Form>
        </Card>
      )}
    </Flexbox>
  );
}
