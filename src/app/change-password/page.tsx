'use client';

import { useState, useEffect } from 'react';
import { Button, Form, InputPassword, Text, Alert } from '@/lib/ui';
import { LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import type { ChangePasswordResponse } from '@/lib/api/types';
import { message, Card } from 'antd';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const storedUserId = sessionStorage.getItem('userId');
    const storedUsername = sessionStorage.getItem('username');
    const forceChange = sessionStorage.getItem('forceChangePassword');

    if (!storedUserId || forceChange !== 'true') {
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
        sessionStorage.removeItem('userId');
        sessionStorage.removeItem('username');
        sessionStorage.removeItem('forceChangePassword');
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
        background: '#ffffff',
      }}
    >
      <Card style={{ width: 450 }} variant="borderless">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Text strong style={{ fontSize: 20, display: 'block', marginBottom: 8, color: '#333333' }}>
            <SafetyOutlined style={{ marginRight: 8 }} />
            强制修改密码
          </Text>
          <Text type="secondary" style={{ color: '#666666' }}>首次登录，为了安全请修改初始密码</Text>
        </div>

        <Alert
          title={`当前用户: ${username}`}
          description="请使用高强度密码（至少 8 位，包含字母、数字和特殊字符）"
          type="warning"
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
            <InputPassword
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
            <InputPassword
              prefix={<LockOutlined />}
              placeholder="请再次输入新密码"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={loading} block>
              修改密码并登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
