'use client';

import { useState, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Text, Flexbox, Button, Icon } from '@lobehub/ui';
import { message, Card, Alert, Tag } from 'antd';
import {
  LinkOutlined,
  ReloadOutlined,
  BugOutlined,
  CopyOutlined,
} from '@ant-design/icons';

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

export default function QwenOAuthTestPage() {
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [oauthStatus, setOAuthStatus] = useState<OAuthStatus | null>(null);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [debugVisible, setDebugVisible] = useState(false);

  // 启动 OAuth Device Flow
  const handleStartOAuth = useCallback(async () => {
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
        startPolling(data.data.deviceCode, data.data.codeVerifier);
      } else {
        const errMsg = data.error?.message ?? '启动 OAuth 失败';
        message.error(errMsg);
        setDebugInfo({
          oauthStatus: null,
          tokenInfo: null,
          pollingActive: false,
          error: errMsg,
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
  }, []);

  // 轮询获取 Token
  const startPolling = useCallback(async (deviceCode: string, codeVerifier: string) => {
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
          // 继续轮询
          const interval = pollData.error?.code === 'SLOW_DOWN' ? 4000 : 2000;
          setTimeout(poll, interval);
        } else {
          setPolling(false);
          const errMsg = pollData.error?.message ?? '轮询失败';
          message.error(errMsg);
          setDebugInfo(prev => prev ? { ...prev, pollingActive: false, error: errMsg } : null);
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
  }, []);

  // 复制完整登录链接
  const copyLink = useCallback(() => {
    if (oauthStatus?.verificationUriComplete) {
      void navigator.clipboard.writeText(oauthStatus.verificationUriComplete);
      message.success('完整登录链接已复制到剪贴板');
    }
  }, [oauthStatus]);

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
            <Button
              size="small"
              icon={<BugOutlined />}
              onClick={() => { setDebugVisible(!debugVisible); }}
            >
              Debug
            </Button>
          </Flexbox>
        </Flexbox>

        {/* 操作卡片 */}
        <Card>
          <Flexbox gap={16}>
            <Button
              type="primary"
              size="large"
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={() => { void handleStartOAuth(); }}
              disabled={polling}
            >
              {polling ? '等待授权...' : loading ? '启动中...' : '启动 Qwen OAuth 登录'}
            </Button>

            {oauthStatus && (
              <Alert
                type="info"
                showIcon
                title="请完成授权"
                description={
                  <Flexbox gap={12}>
                    <Text>请在浏览器中访问以下链接并输入验证码：</Text>
                    <Text strong copyable={{ text: oauthStatus.verificationUriComplete }}>
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
                    {JSON.stringify(debugInfo.oauthStatus, null, 2) ?? '无'}
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
                  description={<pre style={{ margin: 0, fontSize: 12, whiteSpace: 'pre-wrap' }}>{debugInfo.error}</pre>}
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
