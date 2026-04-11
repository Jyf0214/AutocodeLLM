/**
 * API 提供商配置页
 *
 * 职责：管理 API 提供商连接（OpenAI, Anthropic, Qwen OAuth 等）
 * - 显示已配置的提供商，点击可配置/测试
 * - 支持添加自定义提供商
 * - OAuth 登录入口
 */
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
  Collapse,
  Alert,
  Empty,
  Spin,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  ThunderboltOutlined,
  GlobalOutlined,
  LockOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CopyOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { OpenAI, Anthropic, Google, DeepSeek, Nvidia, Zhipu, Moonshot, Groq, Mistral, OpenRouter, Ollama, Azure, Cohere, Fireworks, Perplexity, ZeroOne, Alibaba, Tencent, IFlyTekCloud, SiliconCloud, Together, XAI, Minimax } from '@lobehub/icons';
import type { Provider, ProviderResponse, TestProviderResponse } from '@/lib/api/provider-types';
import type { PresetProvider } from '@/lib/providers';

interface PresetProviderWithStatus extends PresetProvider {
  isAdded: boolean;
  dbId?: string;
}

const PROVIDER_ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  openai: OpenAI,
  anthropic: Anthropic,
  google: Google,
  deepseek: DeepSeek,
  nvidia: Nvidia,
  qwen: Alibaba,
  zhipu: Zhipu,
  moonshot: Moonshot,
  minimax: Minimax,
  groq: Groq,
  mistral: Mistral,
  openrouter: OpenRouter,
  siliconcloud: SiliconCloud,
  together: Together,
  ollama: Ollama,
  azure: Azure,
  xai: XAI,
  cohere: Cohere,
  fireworks: Fireworks,
  perplexity: Perplexity,
  yi: ZeroOne,
  baichuan: Alibaba,
  hunyuan: Tencent,
  spark: IFlyTekCloud,
  stepfun: Moonshot,
};

interface ProviderFormValues {
  name: string;
  baseUrl: string;
  apiKey: string;
  databaseUrl?: string;
  enabled: boolean;
  authType: string;
  presetId?: string;
}

export default function ProviderPage() {
  const t = useTranslations();
  const [dataSource, setDataSource] = useState<Provider[]>([]);
  const [presets, setPresets] = useState<PresetProviderWithStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<ProviderFormValues>();

  // OAuth 状态
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthPolling, setOauthPolling] = useState(false);
  const [oauthVerificationUri, setOauthVerificationUri] = useState('');
  const [oauthUserCode, setOauthUserCode] = useState('');
  const [oauthAuthorizationUrl, setOauthAuthorizationUrl] = useState(''); // 新增：自动组合的授权URL
  const [oauthProviderId, setOauthProviderId] = useState<string | null>(null);
  const [oauthExpiresAt, setOauthExpiresAt] = useState<string | null>(null);
  const [oauthErrorDetail, setOauthErrorDetail] = useState<{ message: string; code: string; rawResponse: string } | null>(null);

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
        form.setFieldsValue({ authType: 'apiKey', enabled: true, baseUrl: '' });
      }
      setModalOpen(true);
    },
    [form]
  );

  const handlePresetChange = useCallback(
    (presetId: string | undefined) => {
      if (!presetId) {
        form.setFieldsValue({ name: '', baseUrl: '' });
        return;
      }
      const preset = presets.find((p) => p.id === presetId);
      if (preset) {
        form.setFieldsValue({
          name: preset.name,
          baseUrl: preset.baseUrl ?? '',
        });
      }
    },
    [presets, form]
  );

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
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

      const url = '/api/providers';
      const method = editingProvider ? 'PUT' : 'POST';
      const body = editingProvider ? { id: editingProvider.id, ...payload } : payload;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data: ProviderResponse = await res.json();

      if (!res.ok || !data.success) {
        message.error(data.error?.message ?? (editingProvider ? '更新失败' : '创建失败'));
        return;
      }

      message.success(editingProvider ? '提供商更新成功' : '提供商创建成功');
      setModalOpen(false);
      fetchProviders();
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errorFields' in error) {
        return;
      }
      message.error(editingProvider ? '更新提供商失败' : '创建提供商失败');
    } finally {
      setSaving(false);
    }
  }, [editingProvider, form, fetchProviders]);

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

  const handleTest = useCallback(
    async (provider: Provider) => {
      setTestingId(provider.id);
      try {
        const res = await fetch('/api/providers/test', {
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

  const handleAddPreset = useCallback(
    async (preset: PresetProviderWithStatus) => {
      try {
        const res = await fetch('/api/providers/preset', {
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
    setOauthVerificationUri('');
    setOauthUserCode('');
    setOauthErrorDetail(null);
    try {
      const res = await fetch('/api/providers/qwen-oauth/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errMsg = errorData.error?.message ?? '启动 OAuth 失败';
        setOauthErrorDetail({
          message: errMsg,
          code: errorData.error?.code ?? 'UNKNOWN',
          rawResponse: JSON.stringify(errorData, null, 2),
        });
        return;
      }

      const data: { success: boolean; data?: { verificationUri: string; userCode: string; authorizationUrl: string; deviceCode: string; interval: number; codeVerifier: string }; error?: { message: string } } = await res.json();

      if (data.success && data.data) {
        const { verificationUri, userCode, authorizationUrl, deviceCode, interval, codeVerifier } = data.data;
        setOauthVerificationUri(verificationUri);
        setOauthUserCode(userCode);
        setOauthPolling(true);
        // 使用自动组合的URL格式
        window.open(authorizationUrl, '_blank');

        const pollStartTime = Date.now();
        const maxPollTime = 5 * 60 * 1000;

        const poll = async () => {
          if (Date.now() - pollStartTime > maxPollTime) {
            setOauthPolling(false);
            message.error('OAuth 授权超时，请重试');
            return;
          }

          try {
            const pollRes = await fetch('/api/providers/qwen-oauth/poll', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ deviceCode, codeVerifier }),
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
              setTimeout(poll, interval * 1000);
            } else if (pollData.error?.code === 'SLOW_DOWN') {
              setTimeout(poll, (interval + 2) * 1000);
            } else {
              setOauthPolling(false);
              message.error(pollData.error?.message ?? '获取 Token 失败');
            }
          } catch {
            setTimeout(poll, interval * 1000);
          }
        };

        setTimeout(poll, interval * 1000);
      } else {
        message.error(data.error?.message ?? '启动 OAuth 失败');
      }
    } catch {
      message.error('启动 OAuth 失败');
    } finally {
      setOauthLoading(false);
    }
  }, [fetchProviders]);

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

  const handleQwenOAuthRefresh = useCallback(async () => {
    if (!oauthProviderId) return;
    try {
      const res = await fetch('/api/providers/refresh', {
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
      render: (name: string, record: Provider) => (
        <Space>
          {(() => {
            const IconComponent = PROVIDER_ICON_MAP[record.sdkType] ?? GlobalOutlined;
            return <IconComponent size={20} />;
          })()}
          <Text strong>{name}</Text>
        </Space>
      ),
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
          <Tooltip title="配置">
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={() => { handleOpenModal(record); }}
            />
          </Tooltip>
          <Tooltip title="测试连通性">
            <Button
              type="text"
              icon={<ThunderboltOutlined />}
              onClick={() => { void handleTest(record); }}
              loading={testingId === record.id}
            />
          </Tooltip>
          {record.authType === 'oauth' && record.oauthRefreshToken && (
            <Tooltip title="刷新 Token">
              <Button
                type="text"
                icon={<ReloadOutlined />}
                onClick={() => { setOauthProviderId(record.id); void handleQwenOAuthRefresh(); }}
              />
            </Tooltip>
          )}
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
        配置和管理 API 提供商连接。添加提供商后，前往「模型管理」页面添加具体模型。
      </Text>

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

        {oauthErrorDetail != null && (
          <div style={{ marginTop: 16 }}>
            <Collapse
              size="small"
              defaultActiveKey={[]}
              items={[{
                key: 'error',
                label: (
                  <Flexbox gap={8} horizontal align="center">
                    <Tag color="red" style={{ margin: 0 }}>OAuth 错误详情</Tag>
                    <Text type="secondary" style={{ fontSize: 12 }}>{oauthErrorDetail.message}</Text>
                  </Flexbox>
                ),
                children: (
                  <div>
                    <Flexbox justify="space-between" align="center" style={{ marginBottom: 8 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>错误代码: {oauthErrorDetail.code}</Text>
                      <Button
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => {
                          const text = `错误信息: ${oauthErrorDetail.message}\n错误代码: ${oauthErrorDetail.code}\n\n原始响应:\n${oauthErrorDetail.rawResponse}`;
                          void navigator.clipboard.writeText(text);
                          message.success('已复制到剪贴板');
                        }}
                      >
                        复制全部
                      </Button>
                    </Flexbox>
                    <Alert
                      type="error"
                      title={oauthErrorDetail.message}
                      description={<pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 12 }}>{oauthErrorDetail.rawResponse}</pre>}
                      showIcon
                    />
                  </div>
                ),
              }]}
            />
          </div>
        )}
      </Card>

      {/* 已配置的提供商列表 */}
      <Flexbox justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Text strong style={{ fontSize: 16 }}>
          <Icon icon={GlobalOutlined} /> 已配置提供商
        </Text>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => { handleOpenModal(); }}
        >
          添加提供商
        </Button>
      </Flexbox>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
      ) : dataSource.length === 0 ? (
        <Empty description="暂无已配置的提供商，点击上方按钮添加" style={{ marginBottom: 32 }} />
      ) : (
        <Table
          columns={columns}
          dataSource={dataSource}
          rowKey="id"
          loading={false}
          pagination={false}
          style={{ marginBottom: 32 }}
        />
      )}

      {/* 预置提供商网格 */}
      <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 12 }}>
        <Icon icon={GlobalOutlined} /> 快速添加预置提供商
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
            onClick={() => { if (!preset.isAdded) void handleAddPreset(preset); }}
          >
            <Flexbox align="center" gap={8}>
              {(() => {
                const IconComponent = PROVIDER_ICON_MAP[preset.id];
                return IconComponent ? <IconComponent size={32} /> : <Avatar avatar={preset.icon ?? <GlobalOutlined />} size={32} />;
              })()}
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

      <Modal
        title={editingProvider ? '编辑提供商' : '添加提供商'}
        open={modalOpen}
        onOk={() => { void handleSave(); }}
        onCancel={() => { setModalOpen(false); }}
        destroyOnHidden
        width={520}
        okText="保存"
        cancelText="取消"
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          {!editingProvider && (
            <Form.Item name="presetId" label="选择预置提供商（可选）">
              <Select
                placeholder="选择预置提供商可自动填充配置"
                allowClear
                onChange={handlePresetChange}
                options={presets.map((p) => ({
                  value: p.id,
                  label: p.name,
                }))}
              />
            </Form.Item>
          )}

          <Form.Item
            name="name"
            label="提供商名称"
            rules={[{ required: true, message: '请输入提供商名称' }]}
          >
            <Input placeholder="例如：OpenAI, DeepSeek" />
          </Form.Item>

          <Form.Item
            name="baseUrl"
            label="Base URL"
            rules={[{ required: true, message: '请输入 Base URL' }, { type: 'url', message: '请输入有效的 URL' }]}
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
                  tooltip={editingProvider ? '留空则不修改' : undefined}
                  rules={[{ required: !editingProvider, message: '请输入 API Key' }]}
                >
                  <Input.Password placeholder="sk-..." />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item name="databaseUrl" label="数据库 URL（可选）">
            <Input placeholder="可选" />
          </Form.Item>

          <Form.Item name="enabled" label="启用" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  );
}
