'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Text, Empty, Modal, Form, Input as LobeInput } from '@lobehub/ui';
import { PlusOutlined } from '@ant-design/icons';
import { Table, Space, Input as AntdInput } from 'antd';
import { useTranslations } from 'next-intl';
import { message } from 'antd';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import type { WorkspaceListItem } from '@/lib/api/workspace-types';

interface WorkspaceFormData {
  name: string;
  description?: string;
}

export default function WorkplacePage() {
  const t = useTranslations('workplace');
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<WorkspaceListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchWorkspaces = useCallback(async () => {
    try {
      const response = await fetch('/api/workspaces');
      const result: { success: boolean; data?: WorkspaceListItem[]; error?: { message: string } } =
        await response.json();

      if (result.success) {
        setWorkspaces(result.data ?? []);
      } else {
        message.error(result.error?.message ?? t('fetchFailed'));
      }
    } catch {
      message.error(t('fetchFailed'));
    } finally {
      setFetching(false);
    }
  }, [t]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleOpenModal = () => {
    form.resetFields();
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    form.resetFields();
  };

  const handleSubmit = async (values: WorkspaceFormData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const result: {
        success: boolean;
        data?: WorkspaceListItem;
        error?: { message: string };
      } = await response.json();

      if (result.success && result.data) {
        message.success(t('createSuccess'));
        handleCloseModal();
        fetchWorkspaces();
        router.push(`/workplace/${result.data.id}`);
      } else {
        message.error(result.error?.message ?? t('createFailed'));
      }
    } catch {
      message.error(t('createFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (record: WorkspaceListItem) => {
    router.push(`/workplace/${record.id}`);
  };

  const columns = [
    {
      title: t('workspaceName'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('workspaceDescription'),
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => text || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
  ];

  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong style={{ fontSize: 20 }}>
            {t('title')}
          </Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModal}>
            {t('create')}
          </Button>
        </div>

        {fetching ? (
          <Empty description="加载中..." />
        ) : workspaces.length === 0 ? (
          <Empty description={t('emptyDesc')} />
        ) : (
          <Table
            columns={columns}
            dataSource={workspaces}
            rowKey="id"
            pagination={false}
            size="middle"
            onRow={(record) => ({
              onClick: () => {
                handleRowClick(record);
              },
              style: { cursor: 'pointer' },
            })}
          />
        )}
      </div>

      <Modal
        title={t('create')}
        open={modalOpen}
        onCancel={handleCloseModal}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="name"
            label={t('workspaceName')}
            rules={[{ required: true, message: t('workspaceNameRequired') }]}
          >
            <LobeInput placeholder={t('workspaceNamePlaceholder')} />
          </Form.Item>

          <Form.Item name="description" label={t('workspaceDescription')}>
            <AntdInput.TextArea
              rows={3}
              placeholder={t('workspaceDescriptionPlaceholder')}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCloseModal}>取消</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {t('create')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  );
}
