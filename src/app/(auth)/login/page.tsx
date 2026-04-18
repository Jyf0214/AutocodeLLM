'use client';

import { useState, useCallback } from 'react';
import { Button, Form, Input, InputPassword, Flexbox, Text } from '@lobehub/ui';
import {
  UserOutlined,
  LockOutlined,
  SafetyOutlined,
  MobileOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { message, Card, Radio, type RadioChangeEvent } from 'antd';

/**
 * 登录模式类型
 */
type LoginMode = 'password' | 'verificationCode';

/**
 * 验证码响应类型
 */
interface CodeResponse {
  success: boolean;
  error?: { message: string };
  data?: { message: string };
}

/**
 * 登录页面组件
 * 支持密码登录和验证码登录
 */
export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<LoginMode>('password');
  const [codeLoading, setCodeLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [username, setUsername] = useState('');

  /**
   * 发送验证码
   */
  const handleSendCode = useCallback(async () => {
    if (!username) {
      message.warning('请先输入用户名');
      return;
    }

    setCodeLoading(true);
    try {
      const response = await fetch('/api/auth/verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const result: CodeResponse = await response.json();

      if (result.success) {
        message.success('验证码已生成，请查看服务器控制台');
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        message.error(result.error?.message ?? '验证码生成失败');
      }
    } catch {
      message.error('网络错误，请重试');
    } finally {
      setCodeLoading(false);
    }
  }, [username]);

  /**
   * 表单提交处理
   */
  const onFinish = useCallback(
    async (values: {
      username: string;
      password?: string;
      verificationCode?: string;
    }) => {
      setLoading(true);
      try {
        const body: Record<string, unknown> = {
          username: values.username,
          useVerificationCode: loginMode === 'verificationCode',
        };

        if (loginMode === 'password') {
          body.password = values.password;
        } else {
          body.verificationCode = values.verificationCode;
        }

        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const result: {
          success: boolean;
          data?: {
            userId: string;
            username: string;
            forceChangePassword: boolean;
          };
          error?: { message: string };
        } = await response.json();

        if (result.success) {
          sessionStorage.setItem('userId', result.data?.userId ?? '');
          sessionStorage.setItem('username', result.data?.username ?? '');
          sessionStorage.setItem(
            'forceChangePassword',
            String(result.data?.forceChangePassword),
          );

          if (result.data?.forceChangePassword) {
            message.warning('首次登录，请修改初始密码');
            router.push('/change-password');
          } else {
            message.success('登录成功');
            router.push('/workplace');
          }
        } else {
          message.error(result.error?.message ?? '登录失败');
        }
      } catch {
        message.error('网络错误，请重试');
      } finally {
        setLoading(false);
      }
    },
    [loginMode, router],
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
        {/* 标题区域 */}
        <Flexbox align="center" gap={8} style={{ marginBottom: 32, textAlign: 'center' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'linear-gradient(135deg, var(--lobe-color-primary), var(--lobe-color-violet))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <UserOutlined style={{ fontSize: 24, color: '#fff' }} />
          </div>
          <Text
            strong
            style={{
              fontSize: 26,
              color: '#333333',
            }}
          >
            欢迎登录
          </Text>
          <Text type="secondary" style={{ fontSize: 14, marginTop: 8, color: '#666666' }}>
            AutocodeLLM 智能编码平台
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
              <LockOutlined /> 密码登录
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
              <SafetyOutlined /> 验证码
            </Radio.Button>
          </Radio.Group>
        </div>

        {/* 登录表单 */}
        <Form name="login" onFinish={onFinish} size="large" layout="vertical">
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: 'var(--ant-color-text-tertiary)' }} />}
              placeholder="请输入用户名"
              onChange={(e) => setUsername(e.target.value)}
              style={{ borderRadius: 10, height: 44 }}
              allowClear
            />
          </Form.Item>

          {loginMode === 'password' ? (
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <InputPassword
                prefix={<LockOutlined style={{ color: 'var(--ant-color-text-tertiary)' }} />}
                placeholder="请输入密码"
                style={{ borderRadius: 10, height: 44 }}
              />
            </Form.Item>
          ) : (
            <Form.Item
              name="verificationCode"
              label="验证码"
              rules={[{ required: true, message: '请输入验证码' }]}
            >
              <Input
                prefix={
                  <MobileOutlined style={{ color: 'var(--ant-color-text-tertiary)' }} />
                }
                placeholder="请输入 12 位验证码"
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
                    {countdown > 0 ? `${String(countdown)}s` : '获取验证码'}
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
              style={{
                borderRadius: 10,
                height: 44,
                fontWeight: 600,
              }}
            >
              {loginMode === 'password' ? '登录' : '验证码登录'}
            </Button>
          </Form.Item>
        </Form>

        {loginMode === 'verificationCode' && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              验证码将显示在服务器控制台，有效期 5 分钟
            </Text>
          </div>
        )}

        {/* 演示提示 */}
        <div
          style={{
            marginTop: 24,
            padding: '12px 16px',
            borderRadius: 8,
            background: 'var(--color-fill-quaternary)',
            border: '1px solid var(--color-border)',
          }}
        >
          <Text type="secondary" style={{ fontSize: 12 }}>
            💡 提示：默认用户名 <code>admin</code>，密码 <code>admin123</code>
          </Text>
        </div>
      </Card>
    </div>
  );
}
