'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  UserOutlined,
  LockOutlined,
  SafetyOutlined,
  MobileOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { message, Card, Radio, Button, Form, Input } from 'antd';
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

export default function LoginPage() {
  const t = useTranslations('login');
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<LoginMode>('password');
  const [codeLoading, setCodeLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [username, setUsername] = useState('');

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
        background: 'var(--bg-primary)',
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 32, textAlign: 'center' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'var(--bg-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <UserOutlined style={{ fontSize: 24, color: 'var(--text-primary)' }} />
          </div>
          <span style={{ fontWeight: 'bold', fontSize: 26, color: 'var(--text-primary)' }}>
            {t('title')}
          </span>
          <span style={{ fontSize: 14, marginTop: 8, color: 'var(--text-secondary)' }}>
            {t('subtitle')}
          </span>
        </div>

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
              <Input.Password
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
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              {t('codeHint')}
            </span>
          </div>
        )}

      </Card>
    </div>
  );
}
