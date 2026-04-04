'use client';

import { useState } from 'react';
import { Button, Form, Input, Typography, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

export default function LoginPage() {
  const t = useTranslations('login');
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onFinish = (_values: { username: string; password: string }) => {
    setLoading(true);
    // TODO: 实现实际登录逻辑
    message.success('登录成功（演示）');
    router.push('/workplace');
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card
        style={{
          width: 400,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={3} style={{ marginBottom: 8 }}>
            {t('title')}
          </Title>
          <Text type="secondary">{t('subtitle')}</Text>
        </div>
        <Form name="login" onFinish={onFinish} size="large">
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder={t('username')} />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={t('password')}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              {t('submit')}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
