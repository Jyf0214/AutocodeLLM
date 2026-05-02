'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button, Form, Input, InputPassword, Flexbox, Text } from '@lobehub/ui';
import {
  UserOutlined,
  LockOutlined,
  SafetyOutlined,
  MobileOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { message, Card, Radio } from 'antd';
import type { RadioChangeEvent } from 'antd';

/** 登录模式 */
type LoginMode = 'password' | 'verificationCode';

/** 登录 API 响应 */
interface LoginResponse {
  success: boolean;
  data?: {
    userId: string;
    username: string;
    role: string;
    forceChangePassword: boolean;
  };
  error?: { message: string; code: string };
}

/** 验证码 API 响应 */
interface CodeResponse {
  success: boolean;
  error?: { message: string };
  data?: { message: string };
}

/** 登录表单值 */
interface LoginFormValues {
  username: string;
  password?: string;
  verificationCode?: string;
}

/** 认证配置 */
interface AuthConfig {
  clerkEnabled: boolean;
  providers: {
    password: boolean;
    verificationCode: boolean;
    clerk: boolean;
  };
}

export default function LoginPage() {
  const t = useTranslations('login');
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<LoginMode>('password');
  const [codeLoading, setCodeLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [username, setUsername] = useState('');
  const [authConfig, setAuthConfig] = useState<AuthConfig | null>(null);
  const [clerkLoading, setClerkLoading] = useState(false);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 获取认证配置
  useEffect(() => {
    fetch('/api/auth/config')
      .then(res => res.json())
      .then(setAuthConfig)
      .catch(err => console.error('Failed to fetch auth config:', err));
  }, []);

  // 清理倒计时
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  /** 发送验证码 */
  const handleSendCode = useCallback(async () => {
    if (!username.trim()) {
      message.warning(t('enterUsernameFirst'));
      return;
    }

    setCodeLoading(true);
    try {
      const res = await fetch('/api/auth/verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });
      const result: CodeResponse = await res.json();

      if (result.success) {
        message.success(t('codeSent'));
        setCountdown(60);
        countdownRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              if (countdownRef.current) clearInterval(countdownRef.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        message.error(result.error?.message ?? t('codeSendFailed'));
      }
    } catch {
      message.error(t('networkError'));
    } finally {
      setCodeLoading(false);
    }
  }, [username, t]);

  /** Clerk 登录 */
  const handleClerkLogin = useCallback(async () => {
    setClerkLoading(true);
    try {
      const res = await fetch('/api/auth/clerk/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const result = await res.json();

      if (result.success && result.data) {
        if (result.data.forceChangePassword) {
          message.warning(t('firstLoginWarning'));
          router.push('/change-password');
        } else {
          message.success(t('loginSuccess'));
          router.push('/project');
        }
      } else {
        message.error(result.error?.message ?? 'Clerk login failed');
      }
    } catch {
      message.error(t('networkError'));
    } finally {
      setClerkLoading(false);
    }
  }, [router, t]);

  /** 表单提交 */
  const onFinish = useCallback(
    async (values: LoginFormValues) => {
      setLoading(true);
      try {
        const body: Record<string, unknown> = {
          username: values.username.trim(),
          useVerificationCode: loginMode === 'verificationCode',
        };

        if (loginMode === 'password') {
          body.password = values.password;
        } else {
          body.verificationCode = values.verificationCode;
        }

        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const result: LoginResponse = await res.json();

        if (result.success && result.data) {
          if (result.data.forceChangePassword) {
            message.warning(t('firstLoginWarning'));
            router.push('/change-password');
          } else {
            message.success(t('loginSuccess'));
            router.push('/project');
          }
        } else {
          const errorCode = result.error?.code;
          let errorMsg = result.error?.message ?? t('loginFailed');

          switch (errorCode) {
            case 'USER_NOT_FOUND':
              errorMsg = t('userNotFound');
              break;
            case 'INVALID_CREDENTIALS':
              errorMsg = t('wrongPassword');
              break;
            case 'CODE_EXPIRED':
              errorMsg = t('codeExpired');
              break;
            case 'INVALID_CODE':
              errorMsg = t('codeInvalid');
              break;
          }

          message.error(errorMsg);
        }
      } catch {
        message.error(t('networkError'));
      } finally {
        setLoading(false);
      }
    },
    [loginMode, router, t],
  );

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ffffff',
        padding: 24,
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 440,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.12)',
          borderRadius: 16,
        }}
      >
        {/* 标题 */}
        <Flexbox align="center" gap={8} style={{ marginBottom: 32, textAlign: 'center' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background:
                'linear-gradient(135deg, var(--lobe-color-primary), var(--lobe-color-violet))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <UserOutlined style={{ fontSize: 24, color: '#fff' }} />
          </div>
          <Text strong style={{ fontSize: 26, color: '#333333' }}>
            {t('title')}
          </Text>
          <Text type="secondary" style={{ fontSize: 14, marginTop: 8, color: '#666666' }}>
            {t('subtitle')}
          </Text>
        </Flexbox>

        {/* 登录模式切换 */}
        <div style={{ marginBottom: 24 }}>
          <Radio.Group
            value={loginMode}
            onChange={(e: RadioChangeEvent) => setLoginMode(e.target.value)}
            block
          >
            <Radio.Button
              value="password"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <LockOutlined /> {t('passwordLogin')}
            </Radio.Button>
            <Radio.Button
              value="verificationCode"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <SafetyOutlined /> {t('codeLogin')}
            </Radio.Button>
          </Radio.Group>
        </div>

        {/* 登录表单 */}
        <Form name="login" onFinish={onFinish} size="large" layout="vertical">
          <Form.Item
            name="username"
            label={t('username')}
            rules={[{ required: true, message: t('usernameRequired') }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: 'var(--ant-color-text-tertiary)' }} />}
              placeholder={t('usernamePlaceholder')}
              onChange={(e) => setUsername(e.target.value)}
              style={{ borderRadius: 10, height: 44 }}
              allowClear
            />
          </Form.Item>

          {loginMode === 'password' ? (
            <Form.Item
              name="password"
              label={t('password')}
              rules={[{ required: true, message: t('passwordRequired') }]}
            >
              <InputPassword
                prefix={<LockOutlined style={{ color: 'var(--ant-color-text-tertiary)' }} />}
                placeholder={t('passwordPlaceholder')}
                style={{ borderRadius: 10, height: 44 }}
              />
            </Form.Item>
          ) : (
            <Form.Item
              name="verificationCode"
              label={t('verificationCode')}
              rules={[{ required: true, message: t('verificationCodeRequired') }]}
            >
              <Input
                prefix={<MobileOutlined style={{ color: 'var(--ant-color-text-tertiary)' }} />}
                placeholder={t('verificationCodePlaceholder')}
                maxLength={12}
                style={{ borderRadius: 10, height: 44 }}
                suffix={
                  <Button
                    type="link"
                    size="small"
                    loading={codeLoading}
                    disabled={countdown > 0}
                    onClick={(e) => {
                      e.preventDefault();
                      handleSendCode();
                    }}
                    style={{ padding: 0, minWidth: 'auto' }}
                  >
                    {countdown > 0 ? `${String(countdown)}s` : t('getCode')}
                  </Button>
                }
              />
            </Form.Item>
          )}

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              icon={<ArrowRightOutlined />}
              style={{ borderRadius: 10, height: 44, fontWeight: 600 }}
            >
              {loginMode === 'password' ? t('submitPassword') : t('submitCode')}
            </Button>
          </Form.Item>
        </Form>

        {/* 验证码提示 */}
        {loginMode === 'verificationCode' && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t('codeHint')}
            </Text>
          </div>
        )}

        {/* Clerk 登录选项 */}
        {authConfig?.clerkEnabled && (
          <>
            <div style={{ margin: '24px 0', textAlign: 'center' }}>
              <div style={{ position: 'relative', margin: '16px 0' }}>
                <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, background: 'var(--color-border)' }} />
                <span style={{ position: 'relative', padding: '0 12px', background: '#fff', color: '#999', fontSize: 12 }}>
                  {t('orContinueWith') || '或使用以下方式登录'}
                </span>
              </div>
            </div>
            <Button
              block
              size="large"
              loading={clerkLoading}
              onClick={handleClerkLogin}
              style={{ borderRadius: 10, height: 44, fontWeight: 600, borderColor: '#ddd' }}
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              }
            >
              {t('clerkLogin') || '使用 Clerk 登录'}
            </Button>
          </>
        )}
 
      </Card>
    </div>
  );
}
