'use client';

import { useState } from 'react';
import { Button, Form, Input, InputPassword, Text } from '@lobehub/ui';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import type { LoginResponse } from '@/lib/api/types';
import { message, Card } from 'antd';

export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const result = (await response.json()) as LoginResponse;

      if (result.success) {
        sessionStorage.setItem('userId', result.data?.userId ?? '');
        sessionStorage.setItem('username', result.data?.username ?? '');
        sessionStorage.setItem('forceChangePassword', String(result.data?.forceChangePassword));

        if (result.data?.forceChangePassword) {
          message.warning('首次登录,请修改初始密码');
          router.push('/change-password');
        } else {
          message.success('登录成功');
          router.push('/workplace');
        }
      } else {
        message.error(result.error?.message ?? '登录失败');
      }
    } catch {
      message.error('网络错误,请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--ant-color-bg-layout)',
      }}
    >
      <Card style={{ width: 400, boxShadow: 'var(--ant-box-shadow-secondary)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Text strong style={{ fontSize: 24, display: 'block', marginBottom: 8 }}>
            {t('login.title')}
          </Text>
          <Text style={{ color: 'var(--ant-color-text-secondary)' }}>
            {t('login.subtitle')}
          </Text>
        </div>

        <Form name="login" onFinish={onFinish} size="large" layout="vertical">
          <Form.Item
            name="username"
            label={t('login.username')}
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: 'var(--ant-color-text-tertiary)' }} />}
              placeholder={t('login.usernamePlaceholder')}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={t('login.password')}
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <InputPassword
              prefix={<LockOutlined style={{ color: 'var(--ant-color-text-tertiary)' }} />}
              placeholder={t('login.passwordPlaceholder')}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              {t('login.submit')}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
