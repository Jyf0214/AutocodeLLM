'use client';

import { useState } from 'react';
import { Card, Form, Input, Button, Space, Divider, Switch, Flex } from 'antd';
import { LockOutlined, SaveOutlined, DeleteOutlined } from '@ant-design/icons';
import { Text } from '@lobehub/ui';
import { useTranslations } from 'next-intl';
import { message } from 'antd';
import type { SetPasswordResponse } from '@/lib/api/workspace-log-types';

interface WorkspaceSettingsProps {
  workspaceId: string;
  hasPassword: boolean;
  onPasswordChanged?: () => void;
}

export default function WorkspaceSettings({
  workspaceId,
  hasPassword,
  onPasswordChanged,
}: WorkspaceSettingsProps) {
  const t = useTranslations('workspace');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [enablePassword, setEnablePassword] = useState(hasPassword);

  const handleSubmit = async (values: { password: string; confirmPassword: string }) => {
    if (values.password !== values.confirmPassword) {
      message.error(t('passwordMismatch'));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: values.password || '' }),
      });

      if (!response.ok) {
        message.error(t('passwordSetFailed'));
        return;
      }

      const result = (await response.json()) as SetPasswordResponse;

      if (result.success) {
        message.success(t('passwordSetSuccess'));
        form.resetFields();
        setEnablePassword(!!values.password);
        onPasswordChanged?.();
      } else {
        message.error(result.error?.message ?? t('passwordSetFailed'));
      }
    } catch {
      message.error(t('passwordSetFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePassword = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: '' }),
      });

      if (!response.ok) {
        message.error(t('passwordRemoveFailed'));
        return;
      }

      const result = (await response.json()) as SetPasswordResponse;

      if (result.success) {
        message.success(t('passwordRemoved'));
        setEnablePassword(false);
        form.resetFields();
        onPasswordChanged?.();
      } else {
        message.error(result.error?.message ?? t('passwordRemoveFailed'));
      }
    } catch {
      message.error(t('passwordRemoveFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title={t('workspaceSettings')} size="small">
      <Flex vertical gap={16}>
        <div>
          <Flex align="center" justify="space-between">
            <Text>{t('enableAccessPassword')}</Text>
            <Switch
              checked={enablePassword}
              onChange={setEnablePassword}
              disabled={loading}
            />
          </Flex>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {enablePassword ? t('accessPasswordEnabled') : t('accessPasswordDisabled')}
          </Text>
        </div>

        {enablePassword && (
          <>
            <Divider style={{ margin: 0 }} />
            <Form
              form={form}
              onFinish={handleSubmit}
              layout="vertical"
              initialValues={{ password: '', confirmPassword: '' }}
            >
              <Form.Item
                name="password"
                label={t('accessPassword')}
                rules={[
                  { required: true, message: t('passwordRequired') },
                  { min: 4, message: t('passwordMinLength') },
                ]}
              >
                <Input.Password
                  placeholder={t('passwordPlaceholder')}
                  prefix={<LockOutlined />}
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label={t('confirmPassword')}
                rules={[
                  { required: true, message: t('confirmPasswordRequired') },
                ]}
              >
                <Input.Password
                  placeholder={t('confirmPasswordPlaceholder')}
                  prefix={<LockOutlined />}
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={loading}
                  >
                    {t('savePassword')}
                  </Button>
                  {hasPassword && (
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={handleRemovePassword}
                      loading={loading}
                    >
                      {t('removePassword')}
                    </Button>
                  )}
                </Space>
              </Form.Item>
            </Form>
          </>
        )}
      </Flex>
    </Card>
  );
}
