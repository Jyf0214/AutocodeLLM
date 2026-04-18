'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { message, Tag, Modal, Card } from 'antd';
import {
  Button,
  Text,
  Empty,
  Form,
  Input as LobeInput,
  Flexbox,
  Icon,
  Skeleton,
} from '@lobehub/ui';
import {
  PlusOutlined,
  ApiOutlined,
  DeleteOutlined,
  EditOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  LockOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { ModelIcon } from '@lobehub/icons';

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
  const t = useTranslations('providers');
  const [showKey, setShowKey] = useState(false);

  const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
    openai: ({ size }) => <ModelIcon model="openai" size={size ?? 20} />,
    anthropic: ({ size }) => <ModelIcon model="anthropic" size={size ?? 20} />,
    google: ({ size }) => <ModelIcon model="gemini" size={size ?? 20} />,
    deepseek: ({ size }) => <ModelIcon model="deepseek" size={size ?? 20} />,
    qwen: ({ size }) => <ModelIcon model="qwen" size={size ?? 20} />,
    zhipu: ({ size }) => <ModelIcon model="zhipu" size={size ?? 20} />,
    moonshot: ({ size }) => <ModelIcon model="moonshot" size={size ?? 20} />,
  };

  const IconComponent = iconMap[provider.sdkType] ?? iconMap.openai;

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
              {provider.enabled ? t('enabled') : t('disabled')}
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
              ? t('oauthAuthorized')
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
          {t('test')}
        </Button>
        <Button
          size="small"
          icon={<EditOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          {t('edit')}
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
          {t('delete')}
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
  const t = useTranslations('providers');
  const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
    openai: ({ size }) => <ModelIcon model="openai" size={size ?? 24} />,
    anthropic: ({ size }) => <ModelIcon model="anthropic" size={size ?? 24} />,
    google: ({ size }) => <ModelIcon model="gemini" size={size ?? 24} />,
    deepseek: ({ size }) => <ModelIcon model="deepseek" size={size ?? 24} />,
    qwen: ({ size }) => <ModelIcon model="qwen" size={size ?? 24} />,
    zhipu: ({ size }) => <ModelIcon model="zhipu" size={size ?? 24} />,
    moonshot: ({ size }) => <ModelIcon model="moonshot" size={size ?? 24} />,
  };

  const IconComponent = iconMap[preset.sdkType] ?? iconMap.openai;

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
        {preset.isAdded ? t('configured') : t('add')}
      </Button>
    </div>
  );
}

/**
 * 主页面
 */
export default function ProviderPage() {
  const t = useTranslations('providers');
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
  const [oauthAuthorizationUrl, setOauthAuthorizationUrl] = useState<string | null>(null);
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
        message.error(data.error?.message ?? t('fetchFailed'));
      }
    } catch {
      message.error(t('fetchFailed'));
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
          message.success(t('addSuccessWithApiKey'));
          fetchProviders();
        } else {
          message.error(data.error?.message ?? t('addFailed'));
        }
      } catch {
        message.error(t('addFailed'));
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
    // 验证 baseURL 格式
    if (!values.baseUrl || (!values.baseUrl.startsWith('http://') && !values.baseUrl.startsWith('https://'))) {
      message.error(t('apiUrlFormat'));
      return;
    }

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
        message.success(editingProvider ? t('updateSuccess') : t('addSuccess'));
        handleCloseModal();
        fetchProviders();
      } else {
        message.error(result.error?.message ?? t('updateFailed'));
      }
    } catch {
      message.error(t('updateFailed'));
    } finally {
      setSaving(false);
    }
  };

  // 测试连通性
  const handleTest = useCallback(
    async (provider: Provider) => {
      setTestingId(provider.id);
      try {
        // OAuth 提供商使用 access token，而不是 API Key
        const testApiKey = provider.apiKey === 'oauth'
          ? (provider.oauthAccessToken ?? '')
          : provider.apiKey;

        const res = await fetch('/api/providers/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: provider.id,
            baseUrl: provider.baseUrl,
            apiKey: testApiKey,
          }),
        });
        const data = await res.json();
        if (data.success && data.data?.connected) {
          message.success(t('latency', { latency: String(data.data.latency) }));
        } else {
          message.error(data.data?.message ?? t('testFailed'));
        }
      } catch {
        message.error(t('testFailed'));
      } finally {
        setTestingId(null);
      }
    },
    [],
  );

  // 删除提供商
  const handleDelete = useCallback(
    (provider: Provider) => {
      Modal.confirm({
        title: t('confirmDelete'),
        content: t('deleteProviderConfirm', { name: provider.name }),
        okText: t('delete'),
        okButtonProps: { danger: true },
        cancelText: t('cancel'),
        onOk: async () => {
          try {
            const res = await fetch(`/api/providers?id=${provider.id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
              message.success(t('deleteSuccess'));
              fetchProviders();
            } else {
              message.error(data.error?.message ?? t('deleteFailed'));
            }
          } catch {
            message.error(t('deleteFailed'));
          }
        },
      });
    },
    [fetchProviders],
  );

  // Qwen OAuth 登录
  const handleQwenOAuthStart = useCallback(async () => {
    setOauthLoading(true);
    setOauthAuthorizationUrl(null);
    try {
      const res = await fetch('/api/providers/qwen-oauth/start', {
        method: 'POST',
      });
if (!res.ok) {
        message.error(t('qwenOAuthFailed'));
        return;
      }
      const data = await res.json();
      if (data.success && data.data) {
        const { authorizationUrl, deviceCode, codeVerifier, interval } = data.data;

        // 保存授权 URL 以便显示和复制
        if (authorizationUrl) {
          setOauthAuthorizationUrl(authorizationUrl);
          // 尝试自动打开，但可能被浏览器拦截
          window.open(authorizationUrl, '_blank');
        }

        setOauthPolling(true);

        // 轮询获取 Token
        const poll = async (currentInterval = interval) => {
          try {
            const pollRes = await fetch('/api/providers/qwen-oauth/poll', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ deviceCode, codeVerifier }),
            });
            const pollData = await pollRes.json();
            if (pollData.success && pollData.data) {
              setOauthPolling(false);
              setOauthAuthorizationUrl(null); // 登录成功后清除 URL
              setOauthProviderId(pollData.data.providerId);
              setOauthExpiresAt(new Date(Date.now() + pollData.data.expiresIn * 1000).toISOString());
              message.success(t('qwenOAuthSuccess'));
              fetchProviders();
            } else if (pollData.error?.code === 'AUTHORIZATION_PENDING') {
              setTimeout(() => poll(currentInterval), currentInterval * 1000);
           } else if (pollData.error?.code === 'SLOW_DOWN') {
               // 增加轮询间隔（官方建议 +2s）
               const newInterval = Number(currentInterval) + 2;
               setTimeout(() => poll(newInterval), newInterval * 1000);
           } else {
               setOauthPolling(false);
               message.error(pollData.error?.message ?? t('getTokenFailed'));
             }
          } catch {
            setTimeout(() => poll(currentInterval), currentInterval * 1000);
          }
        };
        setTimeout(() => poll(interval), interval * 1000);
      }
    } catch {
      message.error(t('qwenOAuthFailed'));
    } finally {
      setOauthLoading(false);
    }
  }, [fetchProviders]);

  const getOAuthStatusText = () => {
    if (!oauthExpiresAt) return t('notLoggedIn');
    const expires = new Date(oauthExpiresAt);
    const diff = expires.getTime() - Date.now();
    if (diff <= 0) return t('expired');
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return t('remaining', { minutes: String(minutes) });
    const hours = Math.floor(minutes / 60);
    return t('remainingHours', { hours: String(hours), minutes: String(minutes % 60) });
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
        message.success(t('refreshSuccess'));
      } else {
        message.error(data.error?.message ?? t('refreshFailed'));
      }
    } catch {
      message.error(t('refreshFailed'));
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
                  {t('title')}
                </Text>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {configuredProviders.length > 0
                    ? t('configuredProviders', { count: String(configuredProviders.length) })
                    : t('noProvidersDesc')}
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
              {t('addProvider')}
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
              <Text strong>{t('qwenOAuth')}</Text>
              <Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 4 }}>
                {t('qwenOAuthDesc')}
              </Text>
            </div>
            {oauthExpiresAt ? (
              <Flexbox gap={8} horizontal>
                <Tag color="green">{getOAuthStatusText()}</Tag>
                <Button size="small" icon={<SyncOutlined />} onClick={handleQwenOAuthRefresh}>
                  {t('refreshToken')}
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
                {oauthPolling ? t('oauthWaiting') : t('oauthLogin')}
              </Button>
            )}
          </Flexbox>

          {/* OAuth 授权 URL 显示（防止浏览器拦截弹窗） */}
          {oauthPolling && oauthAuthorizationUrl && (
            <div
              style={{
                marginTop: 16,
                padding: '12px 14px',
                background: 'var(--color-fill-quaternary)',
                borderRadius: 10,
                border: '1px solid var(--color-border)',
              }}
            >
              <Flexbox gap={8} horizontal align="center" style={{ marginBottom: 8 }}>
                <Icon icon={LinkOutlined} size={14} color="var(--lobe-color-primary)" />
                <Text strong style={{ fontSize: 13 }}>
                  {t('authLinkTip')}
                </Text>
              </Flexbox>
              <Flexbox gap={8} horizontal>
                <div
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: 'var(--color-bg)',
                    borderRadius: 8,
                    border: '1px solid var(--color-border)',
                    fontSize: 12,
                    fontFamily: 'monospace',
                    wordBreak: 'break-all',
                    color: 'var(--lobe-color-primary)',
                    maxHeight: 48,
                    overflow: 'hidden',
                    lineHeight: 1.4,
                  }}
                >
                  {oauthAuthorizationUrl}
                </div>
                <Button
                  size="small"
                  onClick={() => {
                    navigator.clipboard.writeText(oauthAuthorizationUrl);
                    message.success(t('linkCopied'));
                  }}
                >
                  {t('copyLink')}
                </Button>
                <Button
                  size="small"
                  type="primary"
                  icon={<LinkOutlined />}
                  onClick={() => window.open(oauthAuthorizationUrl, '_blank')}
                >
                  {t('openLink')}
                </Button>
              </Flexbox>
            </div>
          )}
        </div>

        {/* 已配置提供商 */}
        <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 16 }}>
          {t('configuredProviders', { count: String(dataSource.length) })}
        </Text>
        {dataSource.length === 0 ? (
          <Empty
            style={{ padding: '40px 0' }}
            description={t('noProvidersDesc')}
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
          {t('quickAdd')}
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
        title={editingProvider ? t('editProvider') : t('addProvider')}
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
            label={t('providerName')}
            rules={[{ required: true, message: t('providerNameRequired') }]}
          >
            <LobeInput placeholder={t('providerNamePlaceholder')} size="large" />
          </Form.Item>

          <Form.Item
            name="baseUrl"
            label={t('apiUrl')}
            rules={[
              { required: true, message: t('apiUrlRequired') },
              {
                pattern: /^https?:\/\/.+/i,
                message: t('apiUrlFormat'),
              },
            ]}
            extra={t('apiUrlExtra')}
          >
            <LobeInput placeholder={t('apiUrlPlaceholder')} size="large" />
          </Form.Item>

          <Form.Item name="apiKey" label={t('apiKey')}>
            <LobeInput.Password placeholder={t('apiKeyPlaceholder')} size="large" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Flexbox gap={12} horizontal justify="flex-end">
              <Button onClick={handleCloseModal}>{t('cancel')}</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={saving}
                style={{ borderRadius: 10, padding: '0 24px' }}
              >
                {editingProvider ? t('save') : t('add')}
              </Button>
            </Flexbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
