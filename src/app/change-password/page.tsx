'use client';

import { useState, useEffect } from 'react';
import { Button, Form, Input, Typography, Card, message, Alert } from 'antd';
import { LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import type { ChangePasswordResponse } from '@/lib/api/types';

const { Title, Text } = Typography;

export default function ChangePasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState('');

  useEffect(() => {
    // 从 sessionStorage 获取用户信息
    const storedUserId = sessionStorage.getItem('userId');
    const storedUsername = sessionStorage.getItem('username');
    const forceChange = sessionStorage.getItem('forceChangePassword');

    if (!storedUserId || forceChange !== 'true') {
      // 如果不需要强制修改密码，跳转回登录页或工作空间
      router.push('/login');
      return;
    }

    setUserId(storedUserId);
    setUsername(storedUsername ?? '');
  }, [router]);

  const onFinish = async (values: { newPassword: string; confirmPassword: string }) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          newPassword: values.newPassword,
        }),
      });

      const result = (await response.json()) as ChangePasswordResponse;

      if (result.success) {
        message.success({ content: '密码修改成功，请登录', key: 'change-pwd' });
        // 清除 sessionStorage
        sessionStorage.removeItem('userId');
        sessionStorage.removeItem('username');
        sessionStorage.removeItem('forceChangePassword');
        // 跳转回登录页
        router.push('/login');
      } else {
        message.error(result.error?.message ?? '密码修改失败');
      }
    } catch {
      message.error('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
    return null;
  }

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
          width: 450,
          boxShadow: 'var(--shadow-modal)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ marginBottom: 8 }}>
            <SafetyOutlined style={{ marginRight: 8 }} />
            强制修改密码
          </Title>
          <Text type="secondary">
            首次登录，为了安全请修改初始密码
          </Text>
        </div>

        <Alert
          title={`当前用户: ${username}`}
          description="请使用高强度密码（至少 8 位，包含字母、数字和特殊字符）"
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form
          name="change-password"
          onFinish={onFinish}
          size="large"
          layout="vertical"
        >
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 8, message: '密码长度至少为 8 位' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入新密码"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            rules={[
              { required: true, message: '请再次输入新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请再次输入新密码"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              修改密码并登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
