'use client';

import { useState, useCallback, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Text, Flexbox, Button, Icon, Avatar } from '@lobehub/ui';
import { useTranslations } from 'next-intl';
import {
  Table,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Switch,
  message,
  Popconfirm,
  Tooltip,
  Card,
  Select,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ThunderboltOutlined,
  CloudServerOutlined,
  GlobalOutlined,
  LockOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import type { Provider, ProviderResponse, TestProviderResponse } from '@/lib/api/provider-types';
import { PRESET_PROVIDERS } from '@/lib/providers';
import type { PresetProvider } from '@/lib/providers';
void PRESET_PROVIDERS;

interface ProviderFormValues {
  name: string;
  baseUrl: string;
  apiKey: string;
  databaseUrl?: string;
  enabled: boolean;
  authType: string;
  presetId?: string;
}

interface PresetProviderWithStatus extends PresetProvider {
  isAdded: boolean;
  dbId?: string;
}

/**
 * API 提供商配置页
 */
export default function ProviderPage() {
  const t = useTranslations();
  const [dataSource, setDataSource] = useState<Provider[]>([]);
  const [presets, setPresets] = useState<PresetProviderWithStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [form] = Form.useForm<ProviderFormValues>();

  // OAuth 状态
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthPolling, setOauthPolling] = useState(false);
  const [oauthVerificationUri, setOauthVerificationUri] = useState('');
  const [oauthUserCode, setOauthUserCode] = useState('');
  const [oauthProviderId, setOauthProviderId] = useState<string | null>(null);
  const [oauthExpiresAt, setOauthExpiresAt] = useState<string | null>(null);

  // 获取提供商列表
  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/providers');
      const data: ProviderResponse & { presets?: PresetProviderWithStatus[] } = await res.json();
      if (data.success) {
        setDataSource(data.data as Provider[]);
        if (data.presets) {
          setPresets(data.presets);
        }
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
          authType: provider.authType,
        });
      } else {
        setEditingProvider(null);
        form.resetFields();
        form.setFieldsValue({ authType: 'apiKey', enabled: true });
      }
      setModalOpen(true);
    },
    [form]
  );

  // 保存提供商
  const handleSave = useCallback(async () => {
    try {
      const values = await form.validateFields();
      const payload: Record<string, unknown> = {
        name: values.name,
        baseUrl: values.baseUrl,
        enabled: values.enabled,
        authType: values.authType,
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

  // 添加预置提供商
  const handleAddPreset = useCallback(
    async (preset: PresetProviderWithStatus) => {
      try {
        const res = await fetch('/api/providers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ presetId: preset.id }),
        });
        const data: ProviderResponse = await res.json();
        if (data.success) {
          message.success(`已添加 ${preset.name}`);
          fetchProviders();
        } else {
          message.error(data.error?.message ?? '添加失败');
        }
      } catch {
        message.error('添加预置提供商失败');
      }
    },
    [fetchProviders]
  );

  // 启动 Qwen OAuth 登录
  const handleQwenOAuthStart = useCallback(async () => {
    setOauthLoading(true);
    try {
      const res = await fetch('/api/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data: { success: boolean; data?: { verificationUri: string; userCode: string; deviceCode: string; interval: number }; error?: { message: string } } = await res.json();
      if (data.success && data.data) {
        setOauthVerificationUri(data.data.verificationUri);
        setOauthUserCode(data.data.userCode);
        setOauthPolling(true);
        window.open(data.data.verificationUri, '_blank');

        const poll = async () => {
          try {
            const pollRes = await fetch('/api/providers', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ deviceCode: data.data.deviceCode }),
            });
            const pollData: { success: boolean; data?: { providerId: string; expiresIn: number }; error?: { code: string; message: string } } = await pollRes.json();

            if (pollData.success && pollData.data) {
              setOauthPolling(false);
              setOauthProviderId(pollData.data.providerId);
              const expiresAt = new Date(Date.now() + pollData.data.expiresIn * 1000).toISOString();
              setOauthExpiresAt(expiresAt);
              message.success('Qwen OAuth 登录成功');
              fetchProviders();
            } else if (pollData.error?.code === 'AUTHORIZATION_PENDING') {
              setTimeout(poll, data.data.interval * 1000);
            } else if (pollData.error?.code === 'SLOW_DOWN') {
              setTimeout(poll, (data.data.interval + 2) * 1000);
            } else {
              setOauthPolling(false);
              message.error(pollData.error?.message ?? '获取 Token 失败');
            }
          } catch {
            setOauthPolling(false);
            message.error('获取 Token 失败');
          }
        };

        setTimeout(poll, data.data.interval * 1000);
      } else {
        message.error(data.error?.message ?? '启动 OAuth 失败');
      }
    } catch {
      message.error('启动 OAuth 失败');
    } finally {
      setOauthLoading(false);
    }
  }, [fetchProviders]);

  // 获取 OAuth 状态文本
  const getOAuthStatusText = () => {
    if (oauthExpiresAt == null) return '未登录';
    const expires = new Date(oauthExpiresAt);
    const now = new Date();
    const diff = expires.getTime() - now.getTime();
    if (diff <= 0) return '已过期';
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `剩余 ${String(minutes)} 分钟`;
    const hours = Math.floor(minutes / 60);
    return `剩余 ${String(hours)} 小时 ${String(minutes % 60)} 分钟`;
  };

  // 刷新 OAuth Token
  const handleQwenOAuthRefresh = useCallback(async () => {
    if (!oauthProviderId) return;
    try {
      const res = await fetch('/api/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId: oauthProviderId }),
      });
      const data: { success: boolean; data?: { expiresAt: string }; error?: { message: string } } = await res.json();
      if (data.success && data.data) {
        setOauthExpiresAt(data.data.expiresAt);
        message.success('Token 刷新成功');
        fetchProviders();
      } else {
        message.error(data.error?.message ?? '刷新失败');
      }
    } catch {
      message.error('刷新 Token 失败');
    }
  }, [oauthProviderId, fetchProviders]);

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
      title: '认证方式',
      dataIndex: 'authType',
      key: 'authType',
      render: (authType: string) => (
        <Tag color={authType === 'oauth' ? 'purple' : 'blue'}>
          {authType === 'oauth' ? 'OAuth' : 'API Key'}
        </Tag>
      ),
    },
    {
      title: 'API Key',
      dataIndex: 'apiKey',
      key: 'apiKey',
      render: (apiKey: string, record: Provider) => (
        <Tag color={record.authType === 'oauth' ? 'purple' : 'blue'}>
          {record.authType === 'oauth' ? 'OAuth' : apiKey}
        </Tag>
      ),
    },
    {
      title: 'OAuth 状态',
      key: 'oauthStatus',
      render: (_: unknown, record: Provider) => {
        if (record.authType !== 'oauth') return <Tag color="default">-</Tag>;
        if (!record.oauthExpiresAt) return <Tag color="red">未登录</Tag>;
        const expires = new Date(record.oauthExpiresAt);
        const now = new Date();
        const diff = expires.getTime() - now.getTime();
        if (diff <= 0) return <Tag color="red">已过期</Tag>;
        const minutes = Math.floor(diff / 60000);
        return <Tag color="green">{minutes < 60 ? `剩余 ${String(minutes)} 分钟` : `剩余 ${String(Math.floor(minutes / 60))} 小时`}</Tag>;
      },
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
          {record.authType === 'oauth' && record.oauthRefreshToken && (
            <Tooltip title="刷新 Token">
              <Button
                type="text"
                icon={<ReloadOutlined />}
                onClick={() => { setOauthProviderId(record.id); void handleQwenOAuthRefresh(); }}
              />
            </Tooltip>
          )}
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

      {/* 预置提供商网格 */}
      <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 12 }}>
        <Icon icon={CloudServerOutlined} /> 预置提供商
      </Text>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 32 }}>
        {presets.map((preset) => (
          <Card
            key={preset.id}
            size="small"
            hoverable
            style={{
              opacity: preset.isAdded ? 0.6 : 1,
              cursor: preset.isAdded ? 'default' : 'pointer',
            }}
            onClick={() => { if (!preset.isAdded) handleAddPreset(preset); }}
          >
            <Flexbox align="center" gap={8}>
              <Avatar avatar={preset.icon ?? <GlobalOutlined />} size={32} />
              <Flexbox flex={1}>
                <Text strong style={{ fontSize: 14 }}>{preset.name}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {preset.description?.substring(0, 20)}...
                </Text>
              </Flexbox>
              {preset.isAdded ? (
                <Tag color="green" icon={<CheckCircleOutlined />}>已添加</Tag>
              ) : (
                <Button type="primary" size="small" icon={<PlusOutlined />}>
                  添加
                </Button>
              )}
            </Flexbox>
          </Card>
        ))}
      </div>

      {/* Qwen OAuth 登录 */}
      <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 12 }}>
        <Icon icon={LockOutlined} /> Qwen OAuth 登录
      </Text>
      <Card style={{ marginBottom: 32 }}>
        <Flexbox align="center" gap={16}>
          <Button
            type="primary"
            size="large"
            icon={<LockOutlined />}
            loading={oauthLoading || oauthPolling}
            onClick={() => { void handleQwenOAuthStart(); }}
            disabled={oauthPolling}
          >
            {oauthPolling ? '等待授权...' : oauthLoading ? '启动中...' : '使用 Qwen 账号登录'}
          </Button>
          {oauthVerificationUri && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              请在浏览器中访问 {oauthVerificationUri} 并输入验证码：{oauthUserCode}
            </Text>
          )}
          {oauthExpiresAt && (
            <Flexbox align="center" gap={8}>
              <Tag color="green">Token 有效: {getOAuthStatusText()}</Tag>
              <Button
                type="text"
                size="small"
                icon={<ReloadOutlined />}
                onClick={() => { void handleQwenOAuthRefresh(); }}
              >
                刷新
              </Button>
            </Flexbox>
          )}
        </Flexbox>
      </Card>

      {/* 自定义提供商表格 */}
      <Flexbox justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Text strong style={{ fontSize: 16 }}>
          <Icon icon={GlobalOutlined} /> 自定义提供商
        </Text>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => { handleOpenModal(); }}
        >
          添加提供商
        </Button>
      </Flexbox>

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
        width={520}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="authType" label="认证方式" initialValue="apiKey">
            <Select options={[
              { value: 'apiKey', label: 'API Key' },
              { value: 'oauth', label: 'OAuth' },
            ]} />
          </Form.Item>

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
            noStyle
            shouldUpdate={(prev, curr) => prev.authType !== curr.authType}
          >
            {({ getFieldValue }) =>
              getFieldValue('authType') === 'apiKey' ? (
                <Form.Item
                  name="apiKey"
                  label="API Key"
                  tooltip="留空则不修改（编辑时）"
                  rules={[{ required: !editingProvider, message: '请输入 API Key' }]}
                >
                  <Input.Password placeholder="sk-..." />
                </Form.Item>
              ) : null
            }
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
