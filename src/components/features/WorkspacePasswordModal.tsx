'use client';

import { useState } from 'react';
import { Modal, Form, Input, Button, Space } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { Text } from '@/lib/ui';
import { useTranslations } from 'next-intl';
import { message } from 'antd';
import type { VerifyPasswordResponse } from '@/lib/api/workspace-log-types';

interface WorkspacePasswordModalProps {
  open: boolean;
  workspaceId: string;
  workspaceName: string;
  onVerified: () => void;
  onCancel: () => void;
}

export default function WorkspacePasswordModal({
  open,
  workspaceId,
  workspaceName,
  onVerified,
  onCancel,
}: WorkspacePasswordModalProps) {
  const t = useTranslations('workspace');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: { password: string }) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: values.password }),
      });

      if (!response.ok) {
        message.error(t('verifyFailed'));
        return;
      }

      const result = (await response.json()) as VerifyPasswordResponse;

      if (result.success && result.data) {
        if (result.data.verified) {
          message.success(t('passwordVerified'));
          form.resetFields();
          onVerified();
        } else {
          message.error(t('passwordIncorrect'));
          form.setFields([{ name: 'password', errors: [t('passwordIncorrect')] }]);
        }
      } else {
        message.error(result.error?.message ?? t('verifyFailed'));
      }
    } catch {
      message.error(t('verifyFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={
        <Space>
          <LockOutlined />
          <Text>{t('enterPassword')}</Text>
        </Space>
      }
      open={open}
      onCancel={handleCancel}
      footer={null}
      destroyOnHidden
      mask={{ closable: false }}
      closable
    >
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">{t('workspaceName')}: {workspaceName}</Text>
      </div>
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Form.Item
          name="password"
          label={t('accessPassword')}
          rules={[{ required: true, message: t('passwordRequired') }]}
        >
          <Input.Password
            placeholder={t('passwordPlaceholder')}
            prefix={<LockOutlined />}
            onPressEnter={() => { form.submit(); }}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Space>
            <Button onClick={handleCancel}>{t('cancel')}</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {t('verify')}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}
