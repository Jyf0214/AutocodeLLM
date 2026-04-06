'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Text, Flexbox, Button, Icon } from '@lobehub/ui';
import { message, Card, Alert, Tag, Modal } from 'antd';
import {
  LinkOutlined,
  ReloadOutlined,
  BugOutlined,
  CopyOutlined,
  SwapOutlined,
  CloudServerOutlined,
  BrowserOutlined,
} from '@ant-design/icons';

// Qwen OAuth 配置（与后端一致）
const QWEN_OAUTH_CONFIG = {
  clientId: 'f0304373b74a44d2b584a3fb70ca9e56',
  deviceCodeUrl: 'https://chat.qwen.ai/api/v1/oauth2/device/code',
  tokenUrl: 'https://chat.qwen.ai/api/v1/oauth2/token',
  scope: 'openid profile email model.completion',
};

interface OAuthStatus {
  deviceCode: string;
  userCode: string;
  verificationUriComplete: string;
  expiresIn: number;
  interval: number;
  codeVerifier: string;
}

interface TokenInfo {
  providerId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  resourceUrl: string;
}

interface DebugInfo {
  oauthStatus: OAuthStatus | null;
  tokenInfo: TokenInfo | null;
  pollingActive: boolean;
  error: string | null;
}

type AuthMode = 'backend' | 'frontend';

/**
 * PKCE 工具函数：生成 code_verifier
 */
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

function objectToUrlEncoded(data: Record<string, string>): string {
  return Object.entries(data)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

export default function QwenOAuthTestPage() {
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [oauthStatus, setOAuthStatus] = useState<OAuthStatus | null>(null);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [debugVisible, setDebugVisible] = useState(false);
  const [errorCollapsed, setErrorCollapsed] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>('backend');
  const [pendingFrontendAuth, setPendingFrontendAuth] = useState(false);
  const startPollingRef = useRef<((deviceCode: string, codeVerifier: string) => void) | null>(null);

  // 保存 token 到后端数据库
  const saveTokenToBackend = useCallback(async (tokenData: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    resourceUrl?: string;
    codeVerifier: string;
  }): Promise<string> => {
    try {
      // 先检查是否已有 Qwen provider
      const providersRes = await fetch('/api/providers');
      const providersData: { data?: { id: string; name: string }[] } = await providersRes.json();
      const existingProvider = providersData.data?.find(
        (p) => p.name === 'Qwen (OAuth)'
      );

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

      let res: Response;
      if (existingProvider) {
        res = await fetch(`/api/providers?id=${existingProvider.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...providerData, id: existingProvider.id }),
        });
      } else {
        res = await fetch('/api/providers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(providerData),
        });
      }

      const result: { data?: { id?: string } } = await res.json();
      return result.data?.id ?? existingProvider?.id ?? 'unknown';
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : '保存 token 失败';
      console.error('[保存 Token 失败]', errMsg);
      throw new Error(errMsg);
    }
  }, []);

  // 前端模式：直接调用 Qwen OAuth API
  const handleFrontendOAuth = useCallback(async () => {
    setLoading(true);
    setOAuthStatus(null);
    setTokenInfo(null);
    setDebugInfo(null);

    try {
      // 1. 生成 PKCE 对
      const { codeVerifier, codeChallenge } = await generateCodeVerifierAndChallenge();

      // 2. 请求 device code
      const bodyData = {
        client_id: QWEN_OAUTH_CONFIG.clientId,
        scope: QWEN_OAUTH_CONFIG.scope,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
      };

      const deviceCodeRes = await fetch(QWEN_OAUTH_CONFIG.deviceCodeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: objectToUrlEncoded(bodyData),
      });

      if (!deviceCodeRes.ok) {
        const errorText = await deviceCodeRes.text();
        throw new Error(`请求 device code 失败：HTTP ${String(deviceCodeRes.status)} - ${errorText.slice(0, 200)}`);
      }

      const deviceData: {
        device_code: string;
        user_code: string;
        verification_uri_complete: string;
        expires_in: number;
        interval?: number;
      } = await deviceCodeRes.json();

      setOAuthStatus({
        deviceCode: deviceData.device_code,
        userCode: deviceData.user_code,
        verificationUriComplete: deviceData.verification_uri_complete,
        expiresIn: deviceData.expires_in,
        interval: deviceData.interval ?? 2,
        codeVerifier,
      });

      setDebugInfo({
        oauthStatus: {
          deviceCode: deviceData.device_code,
          userCode: deviceData.user_code,
          verificationUriComplete: deviceData.verification_uri_complete,
          expiresIn: deviceData.expires_in,
          interval: deviceData.interval ?? 2,
          codeVerifier,
        },
        tokenInfo: null,
        pollingActive: true,
        error: null,
      });

      // 3. 开始轮询
      startPollingRef.current?.(deviceData.device_code, codeVerifier);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : '前端 OAuth 启动失败';
      message.error(errMsg);
      setDebugInfo({
        oauthStatus: null,
        tokenInfo: null,
        pollingActive: false,
        error: errMsg,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // 后端模式：调用后端 API
  const handleBackendOAuth = useCallback(async () => {
    setLoading(true);
    setOAuthStatus(null);
    setTokenInfo(null);
    setDebugInfo(null);

    try {
      const res = await fetch('/api/providers/qwen-oauth/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (data.success && data.data) {
        setOAuthStatus(data.data);
        setDebugInfo({
          oauthStatus: data.data,
          tokenInfo: null,
          pollingActive: true,
          error: null,
        });

        // 自动开始轮询
        startPollingRef.current?.(data.data.deviceCode, data.data.codeVerifier);
      } else {
        // 后端启动失败，提示切换前端模式
        const errMsg = data.error?.message ?? '启动 OAuth 失败';
        setDebugInfo({
          oauthStatus: null,
          tokenInfo: null,
          pollingActive: false,
          error: errMsg,
        });

        Modal.confirm({
          title: '后端启动失败',
          content: (
            <Flexbox gap={8}>
              <Text>后端调用 Qwen OAuth API 失败，可能是网络或安全策略限制。</Text>
              <Text strong>是否切换到前端模式？</Text>
              <Text type="secondary">前端模式将直接从浏览器调用 Qwen OAuth 接口。</Text>
            </Flexbox>
          ),
          okText: '切换到前端模式',
          cancelText: '保持后端模式',
          onOk: () => {
            setAuthMode('frontend');
            setPendingFrontendAuth(true);
            message.info('已切换到前端模式，正在重新启动 OAuth...');
            setTimeout(() => {
              setPendingFrontendAuth(false);
              void handleFrontendOAuth();
            }, 300);
          },
          onCancel: () => {
            message.info('已保持后端模式，你可以稍后重试。');
          },
        });
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : '网络错误';
      message.error(errMsg);
      setDebugInfo({
        oauthStatus: null,
        tokenInfo: null,
        pollingActive: false,
        error: errMsg,
      });
    } finally {
      setLoading(false);
    }
  }, [handleFrontendOAuth]);

  // 轮询获取 Token
  const startPolling = useCallback((deviceCode: string, codeVerifier: string) => {
    setPolling(true);
    const pollStartTime = Date.now();
    const maxPollTime = 5 * 60 * 1000;

    const poll = async () => {
      if (Date.now() - pollStartTime > maxPollTime) {
        setPolling(false);
        message.error('OAuth 授权超时，请重试');
        setDebugInfo(prev => prev ? { ...prev, pollingActive: false, error: '授权超时' } : null);
        return;
      }

      try {
        // 前端模式：直接调用 Qwen token 端点
        if (authMode === 'frontend') {
          const bodyData = {
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
            client_id: QWEN_OAUTH_CONFIG.clientId,
            device_code: deviceCode,
            code_verifier: codeVerifier,
          };

          const pollRes = await fetch(QWEN_OAUTH_CONFIG.tokenUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept': 'application/json',
            },
            body: objectToUrlEncoded(bodyData),
          });

          const pollData = await pollRes.json();

          if (pollData.access_token) {
            // 获取 token 成功，保存到后端
            setPolling(false);
            message.success('Qwen OAuth 授权成功，正在保存...');

            try {
              const providerId = await saveTokenToBackend({
                accessToken: pollData.access_token,
                refreshToken: pollData.refresh_token ?? '',
                expiresIn: pollData.expires_in,
                resourceUrl: pollData.resource_url,
                codeVerifier,
              });

              setTokenInfo({
                providerId,
                accessToken: pollData.access_token,
                refreshToken: pollData.refresh_token ?? '',
                expiresAt: new Date(Date.now() + pollData.expires_in * 1000).toISOString(),
                resourceUrl: pollData.resource_url ?? '',
              });

              message.success('Qwen OAuth 登录成功，Token 已保存！');
              setDebugInfo(prev => prev ? {
                ...prev,
                tokenInfo: {
                  providerId,
                  accessToken: pollData.access_token,
                  refreshToken: pollData.refresh_token ?? '',
                  expiresAt: new Date(Date.now() + pollData.expires_in * 1000).toISOString(),
                  resourceUrl: pollData.resource_url ?? '',
                },
                pollingActive: false,
                error: null,
              } : null);
            } catch (saveError: unknown) {
              const saveErrMsg = saveError instanceof Error ? saveError.message : '保存失败';
              message.error(`Token 获取成功，但保存到数据库失败：${saveErrMsg}`);
              setDebugInfo(prev => prev ? {
                ...prev,
                pollingActive: false,
                error: `Token 获取成功，但保存失败：${saveErrMsg}`,
              } : null);
            }
          } else if (pollData.error === 'authorization_pending') {
            setTimeout(poll, 2000);
          } else if (pollData.error === 'slow_down') {
            setTimeout(poll, 4000);
          } else {
            setPolling(false);
            const errMsg = pollData.error_description ?? pollData.error ?? '轮询失败';
            message.error(errMsg);
            setDebugInfo(prev => prev ? { ...prev, pollingActive: false, error: errMsg } : null);
          }
        } else {
          // 后端模式：调用后端 poll API
          const pollRes = await fetch('/api/providers/qwen-oauth/poll', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceCode, codeVerifier }),
          });

          const pollData = await pollRes.json();

          if (pollData.success && pollData.data) {
            setPolling(false);
            setTokenInfo({
              providerId: pollData.data.providerId,
              accessToken: pollData.data.accessToken ?? '',
              refreshToken: pollData.data.refreshToken ?? '',
              expiresAt: new Date(Date.now() + pollData.data.expiresIn * 1000).toISOString(),
              resourceUrl: pollData.data.resourceUrl ?? '',
            });
            message.success('Qwen OAuth 登录成功！');
            setDebugInfo(prev => prev ? {
              ...prev,
              tokenInfo: {
                providerId: pollData.data.providerId,
                accessToken: pollData.data.accessToken ?? '',
                refreshToken: pollData.data.refreshToken ?? '',
                expiresAt: new Date(Date.now() + pollData.data.expiresIn * 1000).toISOString(),
                resourceUrl: pollData.data.resourceUrl ?? '',
              },
              pollingActive: false,
              error: null,
            } : null);
          } else if (pollData.error?.code === 'AUTHORIZATION_PENDING' || pollData.error?.code === 'SLOW_DOWN') {
            const interval = pollData.error?.code === 'SLOW_DOWN' ? 4000 : 2000;
            setTimeout(poll, interval);
          } else {
            setPolling(false);
            const errMsg = pollData.error?.message ?? '轮询失败';
            message.error(errMsg);
            setDebugInfo(prev => prev ? { ...prev, pollingActive: false, error: errMsg } : null);
          }
        }
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : '轮询网络错误';
        setPolling(false);
        message.error(errMsg);
        setDebugInfo(prev => prev ? { ...prev, pollingActive: false, error: errMsg } : null);
      }
    };

    // 开始第一次轮询
    setTimeout(poll, 2000);
  }, [authMode, saveTokenToBackend]);

  // 设置 ref
  startPollingRef.current = startPolling;

  // 手动切换到前端模式
  const handleSwitchToFrontend = useCallback(() => {
    Modal.confirm({
      title: '确认切换授权模式',
      content: (
        <Flexbox gap={8}>
          <Text>当前使用<strong>后端模式</strong>，后端服务器调用 Qwen OAuth API。</Text>
          <Text strong>切换到前端模式后：</Text>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>浏览器将直接调用 Qwen OAuth 接口</li>
            <li>获取的 token 会自动保存到后端数据库</li>
            <li>可随时在设置中切换回后端模式</li>
          </ul>
        </Flexbox>
      ),
      okText: '确认切换',
      cancelText: '取消',
      onOk: () => {
        setAuthMode('frontend');
        message.success('已切换到前端模式');
      },
    });
  }, []);

  // 切换回后端模式
  const handleSwitchToBackend = useCallback(() => {
    setAuthMode('backend');
    message.success('已切换到后端模式');
  }, []);

  // 复制完整登录链接
  const copyLink = useCallback(() => {
    if (oauthStatus?.verificationUriComplete) {
      void navigator.clipboard.writeText(oauthStatus.verificationUriComplete);
      message.success('完整登录链接已复制到剪贴板');
    }
  }, [oauthStatus]);

  // 当 pendingFrontendAuth 为 true 时触发前端 OAuth
  useEffect(() => {
    if (pendingFrontendAuth && !loading) {
      void handleFrontendOAuth();
    }
  }, [pendingFrontendAuth, loading, handleFrontendOAuth]);

  return (
    <AppLayout>
      <Flexbox gap={24}>
        {/* 页面标题 */}
        <Flexbox justify="space-between" align="center" horizontal>
          <Text strong style={{ fontSize: 20 }}>
            <Icon icon={LinkOutlined} /> Qwen OAuth 登录测试
          </Text>
          <Flexbox gap={8} horizontal>
            <Tag color={polling ? 'processing' : tokenInfo ? 'success' : 'default'}>
              {polling ? '轮询中...' : tokenInfo ? '已登录' : '未登录'}
            </Tag>
            <Tag color={authMode === 'backend' ? 'blue' : 'green'}>
              <Icon icon={authMode === 'backend' ? CloudServerOutlined : BrowserOutlined} />
              {authMode === 'backend' ? '后端模式' : '前端模式'}
            </Tag>
            <Button
              size="small"
              icon={<SwapOutlined />}
              onClick={authMode === 'backend' ? handleSwitchToFrontend : handleSwitchToBackend}
            >
              切换模式
            </Button>
            <Button
              size="small"
              icon={<BugOutlined />}
              onClick={() => { setDebugVisible(!debugVisible); }}
            >
              Debug
            </Button>
          </Flexbox>
        </Flexbox>

        {/* 授权模式提示 */}
        {authMode === 'frontend' && (
          <Alert
            type="info"
            showIcon
            title="前端授权模式"
            description="浏览器将直接调用 Qwen OAuth 接口，获取的 token 会自动保存到后端数据库。"
          />
        )}

        {/* 操作卡片 */}
        <Card>
          <Flexbox gap={16}>
            <Button
              type="primary"
              size="large"
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={() => {
                if (authMode === 'frontend') {
                  void handleFrontendOAuth();
                } else {
                  void handleBackendOAuth();
                }
              }}
              disabled={polling}
            >
              {polling
                ? '等待授权...'
                : loading
                  ? '启动中...'
                  : `启动 Qwen OAuth 登录（${authMode === 'backend' ? '后端' : '前端'}模式）`}
            </Button>

            {oauthStatus && (
              <Alert
                type="info"
                showIcon
                title="请完成授权"
                description={
                  <Flexbox gap={12}>
                    <Text>请在浏览器中访问以下链接并输入验证码：</Text>
                    <Text strong>
                      <a href={oauthStatus.verificationUriComplete} target="_blank" rel="noopener noreferrer">
                        {oauthStatus.verificationUriComplete}
                      </a>
                    </Text>
                    <Flexbox gap={8} horizontal>
                      <Tag>验证码: <Text strong>{oauthStatus.userCode}</Text></Tag>
                      <Tag>有效期: {oauthStatus.expiresIn} 秒</Tag>
                    </Flexbox>
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => { copyLink(); }}
                    >
                      复制完整链接
                    </Button>
                  </Flexbox>
                }
              />
            )}

            {tokenInfo && (
              <Alert
                type="success"
                showIcon
                title="登录成功"
                description={
                  <Flexbox gap={8}>
                    <Text>Provider ID: <Text strong>{tokenInfo.providerId}</Text></Text>
                    <Text>Token 有效期至: <Text strong>{new Date(tokenInfo.expiresAt).toLocaleString('zh-CN')}</Text></Text>
                    {tokenInfo.resourceUrl && (
                      <Text>Resource URL: <Text strong>{tokenInfo.resourceUrl}</Text></Text>
                    )}
                  </Flexbox>
                }
              />
            )}
          </Flexbox>
        </Card>

        {/* Debug 面板 */}
        {debugVisible && debugInfo && (
          <Card title={<Flexbox gap={8} horizontal><BugOutlined /> Debug 信息</Flexbox>}>
            <Flexbox gap={12}>
              <Alert
                type="info"
                title="OAuth 状态"
                description={
                  <pre style={{ margin: 0, fontSize: 12, whiteSpace: 'pre-wrap' }}>
                    {debugInfo.oauthStatus ? JSON.stringify(debugInfo.oauthStatus, null, 2) : '无'}
                  </pre>
                }
              />
              <Alert
                type={debugInfo.tokenInfo ? 'success' : 'warning'}
                title="Token 信息"
                description={
                  <pre style={{ margin: 0, fontSize: 12, whiteSpace: 'pre-wrap' }}>
                    {debugInfo.tokenInfo
                      ? JSON.stringify({ ...debugInfo.tokenInfo, accessToken: '***hidden***', refreshToken: '***hidden***' }, null, 2)
                      : '无 Token'}
                  </pre>
                }
              />
              {debugInfo.error && (
                <Alert
                  type="error"
                  title="错误信息"
                  description={
                    <Flexbox gap={8}>
                      <Button
                        size="small"
                        onClick={() => { setErrorCollapsed(!errorCollapsed); }}
                      >
                        {errorCollapsed ? '展开详情' : '收起详情'}
                      </Button>
                      {!errorCollapsed && (
                        <Flexbox gap={8}>
                          <pre
                            style={{
                              margin: 0,
                              fontSize: 12,
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              background: 'var(--ant-color-fill-quaternary)',
                              padding: 12,
                              borderRadius: 6,
                              maxHeight: 300,
                              overflow: 'auto',
                            }}
                          >
                            {debugInfo.error}
                          </pre>
                          <Button
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={() => {
                              if (debugInfo.error) {
                                void navigator.clipboard.writeText(debugInfo.error);
                                message.success('错误信息已复制');
                              }
                            }}
                          >
                            复制错误信息
                          </Button>
                          {/* 后端模式失败时，提示切换前端 */}
                          {authMode === 'backend' && (
                            <Button
                              size="small"
                              type="primary"
                              icon={<SwapOutlined />}
                              onClick={() => {
                                Modal.confirm({
                                  title: '切换到前端授权模式',
                                  content: (
                                    <Flexbox gap={8}>
                                      <Text>确认切换到前端模式？</Text>
                                      <Text type="secondary">浏览器将直接调用 Qwen OAuth 接口，token 会自动保存到数据库。</Text>
                                    </Flexbox>
                                  ),
                                  okText: '确认切换并重新启动',
                                  cancelText: '取消',
                                  onOk: () => {
                                    setAuthMode('frontend');
                                    setPendingFrontendAuth(true);
                                    message.info('已切换至前端模式，正在重新启动 OAuth...');
                                    setTimeout(() => {
                                      setPendingFrontendAuth(false);
                                      void handleFrontendOAuth();
                                    }, 300);
                                  },
                                });
                              }}
                            >
                              切换到前端模式
                            </Button>
                          )}
                        </Flexbox>
                      )}
                    </Flexbox>
                  }
                />
              )}
              <Tag color={debugInfo.pollingActive ? 'processing' : 'default'}>
                轮询状态: {debugInfo.pollingActive ? '进行中' : '已停止'}
              </Tag>
            </Flexbox>
          </Card>
        )}
      </Flexbox>
    </AppLayout>
  );
}
