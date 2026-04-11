'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { message, Spin, Tag, Modal as AntdModal } from 'antd';
import {
  Button,
  Text,
  Empty,
  Modal,
  Form,
  Input as LobeInput,
  Flexbox,
  Icon,
  Avatar,
  TextArea,
  Skeleton,
  Card,
} from '@lobehub/ui';
import {
  PlusOutlined,
  ApiOutlined,
  DeleteOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  LockOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  AppstoreOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { ModelIcon } from '@lobehub/icons';
import type { WorkspaceListItem } from '@/lib/api/workspace-types';

/**
 * 提供商类型
 */
interface Provider {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  enabled: boolean;
  authType: string;
  sdkType: string;
  oauthAccessToken?: string | null;
  oauthRefreshToken?: string | null;
  oauthExpiresAt?: string | null;
}

/**
 * 模型配置类型
 */
interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  enabled: boolean;
  baseUrl?: string;
  apiKey?: string;
}

/**
 * 预置提供商
 */
interface PresetProvider {
  id: string;
  name: string;
  nameEn: string;
  baseUrl: string;
  sdkType: string;
  authType: string;
  isAdded?: boolean;
  dbId?: string;
}

/**
 * 提供商卡片组件
 */
function ProviderCard({
  provider,
  onEdit,
  onDelete,
  onTest,
  testing,
}: {
  provider: Provider;
  onEdit: () => void;
  onDelete: () => void;
  onTest: () => void;
  testing: boolean;
}) {
  const [showKey, setShowKey] = useState(false);

  const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
    openai: ({ size }) => <ModelIcon model="openai" size={size || 20} />,
    anthropic: ({ size }) => <ModelIcon model="anthropic" size={size || 20} />,
    google: ({ size }) => <ModelIcon model="gemini" size={size || 20} />,
    deepseek: ({ size }) => <ModelIcon model="deepseek" size={size || 20} />,
    qwen: ({ size }) => <ModelIcon model="qwen" size={size || 20} />,
    zhipu: ({ size }) => <ModelIcon model="zhipu" size={size || 20} />,
    moonshot: ({ size }) => <ModelIcon model="moonshot" size={size || 20} />,
  };

  const IconComponent = iconMap[provider.sdkType] || iconMap.openai;

  return (
    <Card
      style={{
        borderRadius: 12,
        border: '1px solid var(--color-border)',
        background: 'var(--color-bg)',
      }}
    >
      <Flexbox gap={14} align="flex-start">
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: 'var(--color-fill-quaternary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconComponent size={22} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Flexbox horizontal justify="space-between" align="center">
            <Text strong style={{ fontSize: 15 }}>
              {provider.name}
            </Text>
            <Tag color={provider.enabled ? 'green' : 'default'}>
              {provider.enabled ? '已启用' : '已禁用'}
            </Tag>
          </Flexbox>
          <Flexbox gap={8} horizontal style={{ marginTop: 6 }}>
            <Tag style={{ fontSize: 11 }}>{provider.sdkType}</Tag>
            {provider.authType === 'oauth' && <Tag color="blue">OAuth</Tag>}
          </Flexbox>
          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              fontFamily: 'monospace',
              color: 'var(--color-text-secondary)',
              background: 'var(--color-fill-quaternary)',
              padding: '4px 8px',
              borderRadius: 6,
            }}
          >
            {provider.apiKey === 'oauth'
              ? 'OAuth 已授权'
              : showKey
                ? provider.apiKey
                : provider.apiKey.substring(0, 4) + '****' + provider.apiKey.slice(-4)}
            {provider.apiKey !== 'oauth' && (
              <Icon
                icon={showKey ? EyeInvisibleOutlined : EyeOutlined}
                size={12}
                onClick={() => setShowKey(!showKey)}
                style={{ marginLeft: 6, cursor: 'pointer' }}
              />
            )}
          </div>
        </div>
      </Flexbox>

      {/* 操作按钮 */}
      <Flexbox
        gap={8}
        horizontal
        style={{
          marginTop: 14,
          paddingTop: 12,
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <Button
          size="small"
          icon={<ThunderboltOutlined />}
          loading={testing}
          onClick={(e) => {
            e.stopPropagation();
            onTest();
          }}
        >
          测试
        </Button>
        <Button
          size="small"
          icon={<EditOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          编辑
        </Button>
        <Button
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          删除
        </Button>
      </Flexbox>
    </Card>
  );
}

/**
 * 预置提供商卡片
 */
function PresetCard({
  preset,
  onAdd,
  adding,
}: {
  preset: PresetProvider;
  onAdd: () => void;
  adding: boolean;
}) {
  const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
    openai: ({ size }) => <ModelIcon model="openai" size={size || 24} />,
    anthropic: ({ size }) => <ModelIcon model="anthropic" size={size || 24} />,
    google: ({ size }) => <ModelIcon model="gemini" size={size || 24} />,
    deepseek: ({ size }) => <ModelIcon model="deepseek" size={size || 24} />,
    qwen: ({ size }) => <ModelIcon model="qwen" size={size || 24} />,
    zhipu: ({ size }) => <ModelIcon model="zhipu" size={size || 24} />,
    moonshot: ({ size }) => <ModelIcon model="moonshot" size={size || 24} />,
  };

  const IconComponent = iconMap[preset.sdkType] || iconMap.openai;

  return (
    <div
      style={{
        background: 'var(--color-bg)',
        borderRadius: 12,
        border: '1px solid var(--color-border)',
        padding: 18,
        transition: 'all 200ms',
      }}
    >
      <Flexbox gap={12} align="center">
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: 'var(--color-fill-quaternary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconComponent size={24} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text strong style={{ fontSize: 14 }}>
            {preset.name}
          </Text>
          <div style={{ marginTop: 4 }}>
            <Tag style={{ fontSize: 10 }}>{preset.sdkType}</Tag>
          </div>
        </div>
      </Flexbox>
      <Button
        type={preset.isAdded ? 'default' : 'primary'}
        size="small"
        block
        style={{ marginTop: 12, borderRadius: 8 }}
        icon={preset.isAdded ? <CheckCircleOutlined /> : <PlusOutlined />}
        disabled={preset.isAdded}
        loading={adding}
        onClick={onAdd}
      >
        {preset.isAdded ? '已配置' : '添加'}
      </Button>
    </div>
  );
}

/**
 * 主页面
 */
export default function ProviderPage() {
  const t = useTranslations('common');
  const router = useRouter();

  const [dataSource, setDataSource] = useState<Provider[]>([]);
  const [presets, setPresets] = useState<PresetProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [form] = Form.useForm();

  // OAuth 状态
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthPolling, setOauthPolling] = useState(false);
  const [oauthVerificationUri, setOauthVerificationUri] = useState('');
  const [oauthUserCode, setOauthUserCode] = useState('');
  const [oauthProviderId, setOauthProviderId] = useState<string | null>(null);
  const [oauthExpiresAt, setOauthExpiresAt] = useState<string | null>(null);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/providers');
      const data = await res.json();
      if (data.success) {
        setDataSource(data.data ?? []);
        setPresets(data.presets ?? []);
      } else {
        message.error(data.error?.message ?? '获取失败');
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

  // 添加预置提供商
  const handleAddPreset = useCallback(
    async (preset: PresetProvider) => {
      setSaving(true);
      try {
        const res = await fetch('/api/providers/preset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ presetId: preset.id }),
        });
        const data = await res.json();
        if (data.success) {
          message.success('添加成功，请配置 API Key');
          fetchProviders();
        } else {
          message.error(data.error?.message ?? '添加失败');
        }
      } catch {
        message.error('添加失败');
      } finally {
        setSaving(false);
      }
    },
    [fetchProviders],
  );

  // 打开编辑弹窗
  const handleOpenModal = (provider?: Provider) => {
    if (provider) {
      setEditingProvider(provider);
      form.setFieldsValue({
        name: provider.name,
        baseUrl: provider.baseUrl,
        apiKey: provider.apiKey === 'oauth' ? '' : provider.apiKey,
        authType: provider.authType,
        sdkType: provider.sdkType,
      });
    } else {
      setEditingProvider(null);
      form.resetFields();
      form.setFieldsValue({ authType: 'apiKey', sdkType: 'openai' });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingProvider(null);
    form.resetFields();
  };

  // 保存提供商
  const handleSubmit = async (values: Record<string, string>) => {
    setSaving(true);
    try {
      const isOAuth = values.authType === 'oauth';
      const url = editingProvider ? '/api/providers' : '/api/providers';
      const method = editingProvider ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingProvider?.id,
          ...values,
          apiKey: isOAuth ? '' : values.apiKey,
        }),
      });

      const result = await response.json();
      if (result.success) {
        message.success(editingProvider ? '更新成功' : '添加成功');
        handleCloseModal();
        fetchProviders();
      } else {
        message.error(result.error?.message ?? '保存失败');
      }
    } catch {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 测试连通性
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
        const data = await res.json();
        if (data.success && data.data?.connected) {
          message.success(`连接成功，延迟 ${data.data.latency}ms`);
        } else {
          message.error(data.data?.message ?? '连接失败');
        }
      } catch {
        message.error('测试失败');
      } finally {
        setTestingId(null);
      }
    },
    [],
  );

  // 删除提供商
  const handleDelete = useCallback(
    (provider: Provider) => {
      AntdModal.confirm({
        title: '确认删除',
        content: `确定要删除提供商「${provider.name}」吗？`,
        okText: '删除',
        okButtonProps: { danger: true },
        cancelText: '取消',
        onOk: async () => {
          try {
            const res = await fetch(`/api/providers?id=${provider.id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
              message.success('删除成功');
              fetchProviders();
            } else {
              message.error(data.error?.message ?? '删除失败');
            }
          } catch {
            message.error('删除失败');
          }
        },
      });
    },
    [fetchProviders],
  );

  // Qwen OAuth 登录
  const handleQwenOAuthStart = useCallback(async () => {
    setOauthLoading(true);
    setOauthVerificationUri('');
    setOauthUserCode('');
    try {
      const res = await fetch('/api/providers/qwen-oauth/start', {
        method: 'POST',
      });
      if (!res.ok) {
        message.error('启动 OAuth 失败');
        return;
      }
      const data = await res.json();
      if (data.success && data.data) {
        const { authorizationUrl, userCode, deviceCode, codeVerifier, interval } = data.data;
        setOauthVerificationUri(authorizationUrl || 'https://chat.qwen.ai/authorize');
        setOauthUserCode(userCode);
        setOauthPolling(true);

        // 打开授权页面
        window.open(authorizationUrl, '_blank');

        // 轮询获取 Token
        const poll = async () => {
          try {
            const pollRes = await fetch('/api/providers/qwen-oauth/poll', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ deviceCode, codeVerifier }),
            });
            const pollData = await pollRes.json();
            if (pollData.success && pollData.data) {
              setOauthPolling(false);
              setOauthProviderId(pollData.data.providerId);
              setOauthExpiresAt(new Date(Date.now() + pollData.data.expiresIn * 1000).toISOString());
              message.success('Qwen OAuth 登录成功');
              fetchProviders();
            } else if (pollData.error?.code === 'AUTHORIZATION_PENDING') {
              setTimeout(poll, interval * 1000);
            } else {
              setOauthPolling(false);
              message.error(pollData.error?.message ?? '获取 Token 失败');
            }
          } catch {
            setTimeout(poll, interval * 1000);
          }
        };
        setTimeout(poll, interval * 1000);
      }
    } catch {
      message.error('启动 OAuth 失败');
    } finally {
      setOauthLoading(false);
    }
  }, [fetchProviders]);

  const getOAuthStatusText = () => {
    if (!oauthExpiresAt) return '未登录';
    const expires = new Date(oauthExpiresAt);
    const diff = expires.getTime() - Date.now();
    if (diff <= 0) return '已过期';
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `剩余 ${minutes} 分钟`;
    const hours = Math.floor(minutes / 60);
    return `剩余 ${hours} 小时 ${minutes % 60} 分钟`;
  };

  const handleQwenOAuthRefresh = useCallback(async () => {
    if (!oauthProviderId) return;
    try {
      const res = await fetch('/api/providers/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId: oauthProviderId }),
      });
      const data = await res.json();
      if (data.success) {
        setOauthExpiresAt(data.data?.expiresAt);
        message.success('Token 刷新成功');
      } else {
        message.error(data.error?.message ?? '刷新失败');
      }
    } catch {
      message.error('刷新失败');
    }
  }, [oauthProviderId]);

  // 已配置提供商
  const configuredProviders = useMemo(() => dataSource.filter((p) => p.enabled), [dataSource]);

  if (loading) {
    return (
      <div style={{ padding: 32 }}>
        <Skeleton active paragraph={{ rows: 3 }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-layout)' }}>
      {/* 顶部标题栏 */}
      <div
        style={{
          background: 'var(--color-bg)',
          borderBottom: '1px solid var(--color-border)',
          padding: '20px 24px',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Flexbox horizontal align="center" justify="space-between">
            <Flexbox gap={12} horizontal align="center">
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'var(--lobe-color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon icon={ApiOutlined} size={20} color="#fff" />
              </div>
              <div>
                <Text strong style={{ fontSize: 22, display: 'block' }}>
                  提供商管理
                </Text>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {configuredProviders.length > 0
                    ? `${configuredProviders.length} 个已配置提供商`
                    : '添加提供商以开始使用 AI 模型'}
                </Text>
              </div>
            </Flexbox>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => handleOpenModal()}
              style={{ borderRadius: 10, padding: '0 20px', height: 40 }}
            >
              添加提供商
            </Button>
          </Flexbox>
        </div>
      </div>

      {/* 主内容区 */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px' }}>
        {/* Qwen OAuth 登录 */}
        <div
          style={{
            background: 'var(--color-bg)',
            borderRadius: 12,
            border: '1px solid var(--color-border)',
            padding: 20,
            marginBottom: 24,
          }}
        >
          <Flexbox gap={16} horizontal align="center">
            <Icon icon={LockOutlined} size={20} color="var(--lobe-color-primary)" />
            <div style={{ flex: 1 }}>
              <Text strong>Qwen OAuth 登录</Text>
              <Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 4 }}>
                使用 Qwen 账号授权，无需 API Key
              </Text>
            </div>
            {oauthExpiresAt ? (
              <Flexbox gap={8} horizontal>
                <Tag color="green">{getOAuthStatusText()}</Tag>
                <Button size="small" icon={<SyncOutlined />} onClick={handleQwenOAuthRefresh}>
                  刷新
                </Button>
              </Flexbox>
            ) : (
              <Button
                type="primary"
                icon={<LinkOutlined />}
                loading={oauthLoading || oauthPolling}
                onClick={handleQwenOAuthStart}
                disabled={oauthPolling}
              >
                {oauthPolling ? '等待授权...' : '使用 Qwen 账号登录'}
              </Button>
            )}
          </Flexbox>
          {oauthVerificationUri && !oauthExpiresAt && (
            <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--color-fill-quaternary)', borderRadius: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                请访问 <a href={oauthVerificationUri} target="_blank" rel="noopener noreferrer">{oauthVerificationUri}</a> 并输入验证码：<strong>{oauthUserCode}</strong>
              </Text>
            </div>
          )}
        </div>

        {/* 已配置提供商 */}
        <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 16 }}>
          已配置提供商 ({dataSource.length})
        </Text>
        {dataSource.length === 0 ? (
          <Empty
            style={{ padding: '40px 0' }}
            description="暂无已配置的提供商，请添加或从预置中选择"
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 16,
              marginBottom: 32,
            }}
          >
            {dataSource.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                onEdit={() => handleOpenModal(provider)}
                onDelete={() => handleDelete(provider)}
                onTest={() => handleTest(provider)}
                testing={testingId === provider.id}
              />
            ))}
          </div>
        )}

        {/* 预置提供商 */}
        <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 16 }}>
          快速添加
        </Text>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 14,
          }}
        >
          {presets.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              onAdd={() => handleAddPreset(preset)}
              adding={saving}
            />
          ))}
        </div>
      </div>

      {/* 添加/编辑弹窗 */}
      <Modal
        title={editingProvider ? '编辑提供商' : '添加提供商'}
        open={modalOpen}
        onCancel={handleCloseModal}
        footer={null}
        destroyOnHidden
        centered
        width={520}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item
            name="name"
            label="提供商名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <LobeInput placeholder="例如：OpenAI" size="large" />
          </Form.Item>

          <Form.Item
            name="baseUrl"
            label="API 地址"
            rules={[{ required: true, message: '请输入 Base URL' }]}
          >
            <LobeInput placeholder="https://api.openai.com" size="large" />
          </Form.Item>

          <Form.Item name="apiKey" label="API Key">
            <LobeInput.Password placeholder="sk-..." size="large" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Flexbox gap={12} horizontal justify="flex-end">
              <Button onClick={handleCloseModal}>取消</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={saving}
                style={{ borderRadius: 10, padding: '0 24px' }}
              >
                {editingProvider ? '保存' : '添加'}
              </Button>
            </Flexbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
