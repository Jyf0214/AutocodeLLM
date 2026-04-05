'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, Button, Space, Form, Input, Switch, message as antdMessage, Tag } from 'antd';
import { CloudUploadOutlined, CloudDownloadOutlined, PlayCircleOutlined, PauseCircleOutlined, SettingOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Flexbox, Text } from '@lobehub/ui';
import AppLayout from '@/components/layout/AppLayout';

interface SyncStatus {
  enabled: boolean;
  watching: boolean;
  url: string;
  remotePath: string;
}

export default function SyncPage() {
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
        antdMessage.success(data.message ?? '操作成功');
      } else {
        antdMessage.error(data.message ?? '操作失败');
      }
      await fetchStatus();
    } catch {
      antdMessage.error('操作失败');
    } finally {
      setLoading(false);
    }
  }, [fetchStatus]);

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
        antdMessage.success('配置已保存');
        setConfigMode(false);
        await fetchStatus();
      } else {
        antdMessage.error('保存失败');
      }
    } catch {
      antdMessage.error('保存失败');
    } finally {
      setLoading(false);
    }
  }, [fetchStatus]);

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
        antdMessage.success('连接成功');
      } else {
        antdMessage.error('连接失败');
      }
    } catch {
      antdMessage.error('连接测试失败');
    } finally {
      setLoading(false);
    }
  }, [form]);

  return (
    <AppLayout>
      <Flexbox gap={16} vertical>
        <Text style={{ fontSize: 20, fontWeight: 700 }}>WebDAV 同步</Text>
        <Text type="secondary">通过 WebDAV 实现本地文件与远程的自动同步</Text>

        <Card
          title="同步状态"
          extra={
            status?.enabled ? (
              <Tag icon={<CheckCircleOutlined />} color="success">已启用</Tag>
            ) : (
              <Tag icon={<CloseCircleOutlined />} color="default">未启用</Tag>
            )
          }
        >
          <Space style={{ width: '100%', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Flexbox horizontal justify="space-between">
              <Text type="secondary">远程地址</Text>
              <Text>{status?.url ?? '未配置'}</Text>
            </Flexbox>
            <Flexbox horizontal justify="space-between">
              <Text type="secondary">远程路径</Text>
              <Text>{status?.remotePath ?? '未配置'}</Text>
            </Flexbox>
            <Flexbox horizontal justify="space-between">
              <Text type="secondary">文件监听</Text>
              <Text>{status?.watching ? '运行中' : '已停止'}</Text>
            </Flexbox>
          </Space>
        </Card>

        <Card title="操作">
          <Space>
            <Button
              icon={<CloudDownloadOutlined />}
              loading={loading}
              onClick={() => handleAction('pull')}
              disabled={!status?.enabled}
            >
              从远程拉取
            </Button>
            <Button
              icon={<CloudUploadOutlined />}
              loading={loading}
              onClick={() => handleAction('push')}
              disabled={!status?.enabled}
            >
              推送到远程
            </Button>
            <Button
              icon={<PlayCircleOutlined />}
              loading={loading}
              onClick={() => handleAction('start')}
              disabled={!status?.enabled || status.watching}
            >
              启动监听
            </Button>
            <Button
              icon={<PauseCircleOutlined />}
              loading={loading}
              onClick={() => handleAction('stop')}
              disabled={!status?.watching}
            >
              停止监听
            </Button>
            <Button
              icon={<SettingOutlined />}
              onClick={() => setConfigMode(!configMode)}
            >
              {configMode ? '取消配置' : '配置服务器'}
            </Button>
          </Space>
        </Card>

        {configMode && (
          <Card title="WebDAV 服务器配置">
            <Form form={form} layout="vertical" onFinish={handleSaveConfig}>
              <Form.Item name="url" label="服务器地址" rules={[{ required: true, message: '请输入服务器地址' }]}>
                <Input placeholder="https://webdav.example.com" />
              </Form.Item>
              <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
                <Input placeholder="username" />
              </Form.Item>
              <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
                <Input.Password placeholder="password" />
              </Form.Item>
              <Form.Item name="remotePath" label="远程路径" rules={[{ required: true, message: '请输入远程路径' }]}>
                <Input placeholder="/autocodellm" />
              </Form.Item>
              <Form.Item name="enabled" label="启用同步" valuePropName="checked" initialValue={false}>
                <Switch />
              </Form.Item>
              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={loading}>保存配置</Button>
                  <Button onClick={handleTest} loading={loading}>测试连接</Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        )}
      </Flexbox>
    </AppLayout>
  );
}
