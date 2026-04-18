'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, Button, Space, Form, Input, Switch, message as antdMessage, Tag } from 'antd';
import {
  CloudServerOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { Flexbox, Text } from '@lobehub/ui';

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
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(false);
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
    fetchStatus();
  }, [fetchStatus]);

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
        antdMessage.success('配置已保存');
        setConfigMode(false);
        await fetchStatus();
      } else {
        antdMessage.error(data.message ?? '保存失败');
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
      const data: { success: boolean; message?: string } = await res.json();
      if (data.success) {
        antdMessage.success('连接成功');
      } else {
        antdMessage.error(data.message ?? '连接失败');
      }
    } catch {
      antdMessage.error('连接测试失败');
    } finally {
      setLoading(false);
    }
  }, [form]);

  return (
    <Flexbox gap={16} style={{ flexDirection: 'column', height: '100%', maxHeight: 'calc(100dvh - 64px)', overflowY: 'auto', padding: '0 16px 24px' }}>
      <Text style={{ fontSize: 20, fontWeight: 700 }}>WebDAV 配置</Text>
      <Text type="secondary">配置 WebDAV 服务器以实现文件同步与备份</Text>

      <Card
        title="连接状态"
        extra={
          status?.enabled ? (
            <Tag icon={<CheckCircleOutlined />} color="success">已启用</Tag>
          ) : (
            <Tag icon={<CloseCircleOutlined />} color="default">未启用</Tag>
          )
        }
        size="small"
      >
        <Space style={{ width: '100%', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
          <Flexbox horizontal justify="space-between" wrap="wrap" gap={8}>
            <Text type="secondary">服务器地址</Text>
            <Text style={{ wordBreak: 'break-all' }}>{status?.url ?? '未配置'}</Text>
          </Flexbox>
          <Flexbox horizontal justify="space-between" wrap="wrap" gap={8}>
            <Text type="secondary">远程路径</Text>
            <Text style={{ wordBreak: 'break-all' }}>{status?.remotePath ?? '未配置'}</Text>
          </Flexbox>
          <Flexbox horizontal justify="space-between" wrap="wrap" gap={8}>
            <Text type="secondary">同步状态</Text>
            <Text>{status?.watching ? '运行中' : '已停止'}</Text>
          </Flexbox>
        </Space>
      </Card>

      <Card title="服务器配置" size="small">
        <Button
          icon={<CloudServerOutlined />}
          onClick={() => setConfigMode(!configMode)}
        >
          {configMode ? '取消配置' : '配置服务器'}
        </Button>
      </Card>

      {configMode && (
        <Card title="WebDAV 服务器设置" size="small">
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
              <Space wrap size={[8, 8]}>
                <Button type="primary" htmlType="submit" loading={loading}>保存配置</Button>
                <Button onClick={handleTest} loading={loading}>测试连接</Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      )}
    </Flexbox>
  );
}