'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Form, InputPassword, Text, Alert } from '@lobehub/ui';
import { LockOutlined, SafetyOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { message, Tag, Divider, Card } from 'antd';
import { useTranslations } from 'next-intl';
import AppLayout from '@/components/layout/AppLayout';

interface UserInfo {
  id: string;
  username: string;
  forceChangePassword: boolean;
  isInitialPassword: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AccountPage() {
  const t = useTranslations('account');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [passwordForm] = Form.useForm();

  const fetchUserInfo = useCallback(async (id: string) => {
    try {
      const response = await fetch('/api/account', {
        headers: { 'x-user-id': id },
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result: { success: boolean; data?: UserInfo; error?: { message: string } } = await response.json();

      if (result.success) {
        setUserInfo(result.data ?? null);
      } else {
        message.error(result.error?.message ?? '获取用户信息失败');
        router.push('/login');
      }
    } catch {
      message.error('网络错误，请重试');
    } finally {
      setFetching(false);
    }
  }, [router]);

  useEffect(() => {
    const storedUserId = sessionStorage.getItem('userId');

    if (!storedUserId) {
      router.push('/login');
      return;
    }

    setUserId(storedUserId);
    fetchUserInfo(storedUserId);
  }, [fetchUserInfo, router]);

  const handleUpdatePassword = async (values: {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }

    if (!userId) return;

    setLoading(true);
    try {
      const response = await fetch('/api/account', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          oldPassword: values.oldPassword,
          newPassword: values.newPassword,
        }),
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result: { success: boolean; data?: UserInfo; error?: { message: string } } = await response.json();

      if (result.success) {
        message.success('密码修改成功');
        passwordForm.resetFields();
        setUserInfo(result.data ?? null);
      } else {
        message.error(result.error?.message ?? '密码修改失败');
      }
    } catch {
      message.error('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFlags = async () => {
    if (!userId || !userInfo) return;

    setLoading(true);
    try {
      const response = await fetch('/api/account', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          forceChangePassword: false,
          isInitialPassword: false,
        }),
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result: { success: boolean; data?: UserInfo; error?: { message: string } } = await response.json();

      if (result.success) {
        message.success('状态更新成功');
        setUserInfo(result.data ?? null);
      } else {
        message.error(result.error?.message ?? '状态更新失败');
      }
    } catch {
      message.error('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (fetching || !userInfo) {
    return null;
  }

  return (
    <AppLayout>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* 页面标题 */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <SafetyOutlined style={{ fontSize: 24, marginRight: 12 }} />
          <Text strong style={{ fontSize: 20 }}>
            {t('title')}
          </Text>
        </div>

        {/* 用户信息卡片 */}
        <Card title={t('userInfo')} size="small">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text type="secondary">{t('username')}</Text>
              <Text strong>{userInfo.username}</Text>
            </div>

            <Divider style={{ margin: 0 }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text type="secondary">{t('forceChangePassword')}</Text>
              <Tag color={userInfo.forceChangePassword ? 'orange' : 'green'}>
                {userInfo.forceChangePassword ? t('enabled') : t('disabled')}
              </Tag>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text type="secondary">{t('isInitialPassword')}</Text>
              <Tag color={userInfo.isInitialPassword ? 'orange' : 'green'}>
                {userInfo.isInitialPassword ? t('yes') : t('no')}
              </Tag>
            </div>

            <Divider style={{ margin: 0 }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text type="secondary">{t('createdAt')}</Text>
              <Text>{new Date(userInfo.createdAt).toLocaleString('zh-CN')}</Text>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text type="secondary">{t('updatedAt')}</Text>
              <Text>{new Date(userInfo.updatedAt).toLocaleString('zh-CN')}</Text>
            </div>

            {(userInfo.forceChangePassword || userInfo.isInitialPassword) && (
              <Alert
                icon={<InfoCircleOutlined />}
                description={t('flagWarning')}
                type="info"
                action={
                  <Button size="small" onClick={handleUpdateFlags} loading={loading}>
                    {t('disableFlags')}
                  </Button>
                }
              />
            )}
          </div>
        </Card>

        {/* 修改密码表单 */}
        <Card title={t('changePassword')} size="small">
          <Form
            form={passwordForm}
            onFinish={handleUpdatePassword}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="oldPassword"
              label={t('oldPassword')}
              rules={[{ required: true, message: t('oldPasswordRequired') }]}
            >
              <InputPassword
                prefix={<LockOutlined />}
                placeholder={t('oldPasswordPlaceholder')}
              />
            </Form.Item>

            <Form.Item
              name="newPassword"
              label={t('newPassword')}
              rules={[
                { required: true, message: t('newPasswordRequired') },
                { min: 8, message: t('passwordMinLength') },
              ]}
            >
              <InputPassword
                prefix={<LockOutlined />}
                placeholder={t('newPasswordPlaceholder')}
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label={t('confirmPassword')}
              rules={[
                { required: true, message: t('confirmPasswordRequired') },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error(t('passwordMismatch')));
                  },
                }),
              ]}
            >
              <InputPassword
                prefix={<LockOutlined />}
                placeholder={t('confirmPasswordPlaceholder')}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" loading={loading} block>
                {t('submit')}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </AppLayout>
  );
}
