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
  CopyOutlined,
  SwapOutlined,
  CloudOutlined,
  LaptopOutlined,
} from '@ant-design/icons';
import { OpenAI, Anthropic, Google, DeepSeek, Nvidia, Zhipu, Moonshot, Groq, Mistral, OpenRouter, Ollama, Azure, Cohere, Fireworks, Perplexity, ZeroOne, Alibaba, Tencent, IFlyTekCloud, SiliconCloud, Together, XAI, Minimax } from '@lobehub/icons';
import type { Provider, ProviderResponse, TestProviderResponse } from '@/lib/api/provider-types';
import { PRESET_PROVIDERS } from '@/lib/providers';
import type { PresetProvider } from '@/lib/providers';
void PRESET_PROVIDERS;

type AuthMode = 'backend' | 'frontend';

// Qwen OAuth 配置（与后端一致）
const QWEN_OAUTH_CONFIG = {
  clientId: 'f0304373b74a44d2b584a3fb70ca9e56',
  deviceCodeUrl: 'https://chat.qwen.ai/api/v1/oauth2/device/code',
  tokenUrl: 'https://chat.qwen.ai/api/v1/oauth2/token',
  scope: 'openid profile email model.completion',
};

function objectToUrlEncoded(data: Record<string, string>): string {
  return Object.entries(data)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

async function generateCodeVerifierAndChallenge(): Promise<{ codeVerifier: string; codeChallenge: string }> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const codeVerifier = btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(digest);
  const codeChallenge = btoa(String.fromCharCode(...hashArray))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  return { codeVerifier, codeChallenge };
}

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
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<ProviderFormValues>();

  // OAuth 状态
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthPolling, setOauthPolling] = useState(false);
  const [oauthVerificationUri, setOauthVerificationUri] = useState('');
  const [oauthUserCode, setOauthUserCode] = useState('');
  const [oauthProviderId, setOauthProviderId] = useState<string | null>(null);
  const [oauthExpiresAt, setOauthExpiresAt] = useState<string | null>(null);
  const [oauthErrorDetail, setOauthErrorDetail] = useState<{ message: string; code: string; rawResponse: string } | null>(null);
  const [oauthAuthMode, setOauthAuthMode] = useState<AuthMode>('backend');
  const [oauthFrontendPolling, setOauthFrontendPolling] = useState(false);

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
        form.setFieldsValue({ authType: 'apiKey', enabled: true, baseUrl: '' });
      }
      setModalOpen(true);
    },
    [form]
  );

  // 选择预置提供商时自动填充
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

  // 保存提供商
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
      // 区分 Ant Design 表单验证错误和网络错误
      if (error && typeof error === 'object' && 'errorFields' in error) {
        // 表单验证错误，Ant Design 会自动显示错误信息，不需要额外处理
        return;
      }
      message.error(editingProvider ? '更新提供商失败' : '创建提供商失败');
    } finally {
      setSaving(false);
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

  // 保存 OAuth token 到数据库
  const saveOAuthTokenToDb = useCallback(async (tokenData: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    resourceUrl?: string;
    codeVerifier: string;
  }): Promise<string> => {
    const expiresAt = new Date(Date.now() + tokenData.expiresIn * 1000).toISOString();
    const providerData = {
      name: 'Qwen (OAuth)',
      baseUrl: tokenData.resourceUrl ?? 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      apiKey: tokenData.accessToken,
      authType: 'oauth',
      sdkType: 'openai',
      enabled: true,
      oauthAccessToken: tokenData.accessToken,
      oauthRefreshToken: tokenData.refreshToken,
      oauthExpiresAt: expiresAt,
      oauthDeviceCode: tokenData.codeVerifier,
      metadata: JSON.stringify({ authMode: 'frontend' }),
    };

    // 检查是否已有 Qwen provider
    const res = await fetch('/api/providers');
    const data: ProviderResponse & { data?: { id: string; name: string }[] } = await res.json();
    const existing = data.data?.find((p) => p.name === 'Qwen (OAuth)');

    let saveRes: Response;
    if (existing) {
      saveRes = await fetch(`/api/providers?id=${existing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: existing.id, ...providerData }),
      });
    } else {
      saveRes = await fetch('/api/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(providerData),
      });
    }

    const saveData: ProviderResponse = await saveRes.json();
    if (!saveData.success) {
      throw new Error(saveData.error?.message ?? '保存 token 失败');
    }
    return (saveData.data as { id?: string } | undefined)?.id ?? existing?.id ?? 'unknown';
  }, []);

  // 前端模式 OAuth
  const handleFrontendOAuthStart = useCallback(async () => {
    setOauthLoading(true);
    setOauthVerificationUri('');
    setOauthUserCode('');
    setOauthErrorDetail(null);
    try {
      const { codeVerifier, codeChallenge } = await generateCodeVerifierAndChallenge();
      const bodyData = {
        client_id: QWEN_OAUTH_CONFIG.clientId,
        scope: QWEN_OAUTH_CONFIG.scope,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
      };

      const deviceCodeRes = await fetch(QWEN_OAUTH_CONFIG.deviceCodeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
        body: objectToUrlEncoded(bodyData),
      });

      if (!deviceCodeRes.ok) {
        const errorText = await deviceCodeRes.text();
        throw new Error(`HTTP ${String(deviceCodeRes.status)} - ${errorText.slice(0, 300)}`);
      }

      const deviceData: { device_code: string; user_code: string; verification_uri_complete: string; expires_in: number; interval?: number } = await deviceCodeRes.json();
      setOauthVerificationUri(deviceData.verification_uri_complete);
      setOauthUserCode(deviceData.user_code);
      setOauthFrontendPolling(true);
      window.open(deviceData.verification_uri_complete, '_blank');

      const poll = async () => {
        try {
          const pollRes = await fetch(QWEN_OAUTH_CONFIG.tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
            body: objectToUrlEncoded({
              grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
              client_id: QWEN_OAUTH_CONFIG.clientId,
              device_code: deviceData.device_code,
              code_verifier: codeVerifier,
            }),
          });

          const pollData: { access_token?: string; refresh_token?: string; expires_in?: number; resource_url?: string; error?: string; error_description?: string } = await pollRes.json();

          if (pollData.access_token) {
            setOauthFrontendPolling(false);
            message.success('授权成功，正在保存...');
            try {
              const providerId = await saveOAuthTokenToDb({
                accessToken: pollData.access_token,
                refreshToken: pollData.refresh_token ?? '',
                expiresIn: pollData.expires_in ?? 3600,
                resourceUrl: pollData.resource_url ?? '',
                codeVerifier,
              });
              setOauthProviderId(providerId);
              const expiresAt = new Date(Date.now() + (pollData.expires_in ?? 3600) * 1000).toISOString();
              setOauthExpiresAt(expiresAt);
              message.success('Qwen OAuth 登录成功，Token 已保存！');
              fetchProviders();
            } catch (saveError: unknown) {
              const errMsg = saveError instanceof Error ? saveError.message : '保存失败';
              message.error(`Token 获取成功，但保存到数据库失败：${errMsg}`);
            }
          } else if (pollData.error === 'authorization_pending') {
            setTimeout(poll, 2000);
          } else if (pollData.error === 'slow_down') {
            setTimeout(poll, 4000);
          } else {
            setOauthFrontendPolling(false);
            const errMsg = pollData.error_description ?? pollData.error ?? '获取 Token 失败';
            message.error(errMsg);
          }
        } catch {
          setTimeout(poll, 2000);
        }
      };

      setTimeout(poll, 2000);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : '前端 OAuth 启动失败';
      message.error(errMsg);
      setOauthErrorDetail({ message: errMsg, code: 'FRONTEND_START_FAILED', rawResponse: '' });
    } finally {
      setOauthLoading(false);
    }
  }, [fetchProviders, saveOAuthTokenToDb]);

  // 启动 Qwen OAuth 登录（后端模式）
  const handleQwenOAuthStart = useCallback(async () => {
    if (oauthAuthMode === 'frontend') {
      void handleFrontendOAuthStart();
      return;
    }

    setOauthLoading(true);
    setOauthVerificationUri('');
    setOauthUserCode('');
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

        // 后端失败，提示切换前端模式
        Modal.confirm({
          title: '后端启动失败',
          content: '后端调用 Qwen OAuth API 失败，可能是网络或安全策略限制。是否切换到前端模式？前端模式将直接从浏览器调用 Qwen OAuth 接口。',
          okText: '切换到前端模式',
          cancelText: '保持后端模式',
          onOk: () => {
            setOauthAuthMode('frontend');
            message.info('已切换到前端模式，正在重新启动 OAuth...');
            setTimeout(() => { void handleFrontendOAuthStart(); }, 300);
          },
        });
        return;
      }

      const data: { success: boolean; data?: { verificationUri: string; userCode: string; deviceCode: string; interval: number; codeVerifier: string }; error?: { message: string } } = await res.json();

      if (data.success && data.data) {
        const { verificationUri, userCode, deviceCode, interval, codeVerifier } = data.data;
        setOauthVerificationUri(verificationUri);
        setOauthUserCode(userCode);
        setOauthPolling(true);
        window.open(verificationUri, '_blank');

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
  }, [fetchProviders, oauthAuthMode, handleFrontendOAuthStart]);

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

      {/* Qwen OAuth 登录 */}
      <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 12 }}>
        <Icon icon={LockOutlined} /> Qwen OAuth 登录
      </Text>
      <Card style={{ marginBottom: 32 }}>
        <Flexbox gap={16}>
          <Flexbox gap={8} horizontal align="center">
            <Tag color={oauthAuthMode === 'backend' ? 'blue' : 'green'}>
              <Icon icon={oauthAuthMode === 'backend' ? CloudOutlined : LaptopOutlined} />
              {oauthAuthMode === 'backend' ? '后端模式' : '前端模式'}
            </Tag>
            <Button
              size="small"
              icon={<SwapOutlined />}
              onClick={() => {
                const newMode = oauthAuthMode === 'backend' ? 'frontend' : 'backend';
                setOauthAuthMode(newMode);
                message.info(`已切换到${newMode === 'backend' ? '后端' : '前端'}模式`);
              }}
            >
              切换模式
            </Button>
          </Flexbox>

          {oauthAuthMode === 'frontend' && (
            <Alert
              type="info"
              showIcon
              title="前端授权模式"
              description="浏览器将直接调用 Qwen OAuth 接口，获取的 token 会自动保存到后端数据库。"
            />
          )}

          <Button
            type="primary"
            size="large"
            icon={<LockOutlined />}
            loading={oauthLoading || oauthPolling || oauthFrontendPolling}
            onClick={() => { void handleQwenOAuthStart(); }}
            disabled={oauthPolling || oauthFrontendPolling}
          >
            {oauthPolling || oauthFrontendPolling
              ? '等待授权...'
              : oauthLoading
                ? '启动中...'
                : '使用 Qwen 账号登录'}
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

        {/* OAuth 错误详情（可折叠 + 一键复制） */}
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
