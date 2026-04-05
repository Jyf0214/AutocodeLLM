'use client';

import { useState } from 'react';
import { Button, Form, Input, Typography, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import type { LoginResponse } from '@/lib/api/types';

const { Title, Text } = Typography;

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
        // 存储用户信息到 sessionStorage
        sessionStorage.setItem('userId', result.data?.userId ?? '');
        sessionStorage.setItem('username', result.data?.username ?? '');
        sessionStorage.setItem('forceChangePassword', String(result.data?.forceChangePassword));

        // 如果需要强制修改密码
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
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
      }}
    >
      <Card
        style={{
          width: 400,
          boxShadow: 'var(--shadow-modal)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={3} style={{ marginBottom: 8 }}>
            {t('login.title')}
          </Title>
          <Text type="secondary">{t('login.subtitle')}</Text>
        </div>
        <Form name="login" onFinish={onFinish} size="large">
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder={t('login.username')} />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={t('login.password')}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              {t('login.submit')}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
