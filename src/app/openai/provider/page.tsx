'use client';

import { useState, useCallback, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Text } from '@lobehub/ui';
import { useTranslations } from 'next-intl';
import {
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Switch,
  message,
  Popconfirm,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import type { Provider, ProviderResponse, TestProviderResponse } from '@/lib/api/provider-types';

interface ProviderFormValues {
  name: string;
  baseUrl: string;
  apiKey: string;
  databaseUrl?: string;
  enabled: boolean;
}

/**
 * API 提供商配置页
 */
export default function ProviderPage() {
  const t = useTranslations();
  const [dataSource, setDataSource] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [form] = Form.useForm<ProviderFormValues>();

  // 获取提供商列表
  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/providers');
      const data: ProviderResponse = await res.json();
      if (data.success) {
        setDataSource(data.data as Provider[]);
      } else {
        message.error(data.error?.message ?? '获取列表失败');
      }
    } catch {
      message.error('获取提供商列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  // 打开新增/编辑弹窗
  const handleOpenModal = useCallback(
    (provider?: Provider) => {
      if (provider) {
        setEditingProvider(provider);
        form.setFieldsValue({
          name: provider.name,
          baseUrl: provider.baseUrl,
          apiKey: '',
          databaseUrl: provider.databaseUrl ?? '',
          enabled: provider.enabled,
        });
      } else {
        setEditingProvider(null);
        form.resetFields();
      }
      setModalOpen(true);
    },
    [form]
  );

  // 保存提供商
  const handleSave = useCallback(async () => {
    try {
      const values = await form.validateFields();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload: Record<string, unknown> = {
        name: values.name,
        baseUrl: values.baseUrl,
        enabled: values.enabled,
      };

      if (values.databaseUrl) {
        payload.databaseUrl = values.databaseUrl;
      }

      if (values.apiKey || !editingProvider) {
        payload.apiKey = values.apiKey;
      }

      if (editingProvider) {
        const res = await fetch('/api/providers', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingProvider.id, ...payload }),
        });
        const data: ProviderResponse = await res.json();
        if (data.success) {
          message.success('提供商更新成功');
          setModalOpen(false);
          fetchProviders();
        } else {
          message.error(data.error?.message ?? '更新失败');
        }
      } else {
        const res = await fetch('/api/providers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data: ProviderResponse = await res.json();
        if (data.success) {
          message.success('提供商创建成功');
          setModalOpen(false);
          fetchProviders();
        } else {
          message.error(data.error?.message ?? '创建失败');
        }
      }
    } catch {
      message.error(editingProvider ? '更新提供商失败' : '创建提供商失败');
    }
  }, [editingProvider, form, fetchProviders]);

  // 删除提供商
  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/providers?id=${id}`, { method: 'DELETE' });
        const data: ProviderResponse = await res.json();
        if (data.success) {
          message.success('提供商删除成功');
          fetchProviders();
        } else {
          message.error(data.error?.message ?? '删除失败');
        }
      } catch {
        message.error('删除提供商失败');
      }
    },
    [fetchProviders]
  );

  // 测试 API Key 连通性
  const handleTest = useCallback(
    async (provider: Provider) => {
      setTestingId(provider.id);
      try {
        const res = await fetch('/api/providers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: provider.id,
            baseUrl: provider.baseUrl,
            apiKey: provider.apiKey,
          }),
        });
        const data: TestProviderResponse = await res.json();
        if (data.success && data.data) {
          if (data.data.connected) {
            message.success(data.data.message);
          } else {
            message.warning(data.data.message);
          }
        } else {
          message.error(data.error?.message ?? '测试失败');
        }
      } catch {
        message.error('测试 API Key 连通性失败');
      } finally {
        setTestingId(null);
      }
    },
    []
  );

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '基础 URL',
      dataIndex: 'baseUrl',
      key: 'baseUrl',
      ellipsis: true,
    },
    {
      title: 'API Key',
      dataIndex: 'apiKey',
      key: 'apiKey',
      render: (apiKey: string) => <Tag color="blue">{apiKey}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'green' : 'red'}>{enabled ? '已启用' : '已禁用'}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Provider) => (
        <Space>
          <Tooltip title="测试 API Key">
            <Button
              type="text"
              icon={<ThunderboltOutlined />}
              onClick={() => { handleTest(record); }}
              loading={testingId === record.id}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => { handleOpenModal(record); }}
            />
          </Tooltip>
          <Popconfirm
            title="确定删除此提供商吗？"
            onConfirm={() => { void handleDelete(record.id); }}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <AppLayout>
      <Text strong style={{ fontSize: 20, display: 'block', marginBottom: 8 }}>
        {t('common.providers')}
      </Text>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        配置和管理 OpenAI 兼容的 API 提供商连接。
      </Text>

      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => { handleOpenModal(); }}
        style={{ marginBottom: 16 }}
      >
        添加提供商
      </Button>

      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
        loading={loading}
        pagination={false}
      />

      <Modal
        title={editingProvider ? '编辑提供商' : '添加提供商'}
        open={modalOpen}
        onOk={() => { void handleSave(); }}
        onCancel={() => { setModalOpen(false); }}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入提供商名称' }]}
          >
            <Input placeholder="例如：OpenAI, DeepSeek" />
          </Form.Item>
          <Form.Item
            name="baseUrl"
            label="基础 URL"
            rules={[{ required: true, message: '请输入基础 URL' }, { type: 'url', message: '请输入有效的 URL' }]}
          >
            <Input placeholder="https://api.openai.com/v1" />
          </Form.Item>
          <Form.Item
            name="apiKey"
            label="API Key"
            tooltip="留空则不修改（编辑时）"
            rules={[{ required: !editingProvider, message: '请输入 API Key' }]}
          >
            <Input.Password placeholder="sk-..." />
          </Form.Item>
          <Form.Item name="databaseUrl" label="数据库 URL">
            <Input placeholder="可选" />
          </Form.Item>
          <Form.Item name="enabled" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  );
}
