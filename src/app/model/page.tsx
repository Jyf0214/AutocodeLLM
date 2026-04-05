'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Text, Empty, Modal, Form, Input } from '@lobehub/ui';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Table, Tag, Space, Popconfirm, Switch, message } from 'antd';
import { useTranslations } from 'next-intl';
import AppLayout from '@/components/layout/AppLayout';
import type { ModelConfig } from '@/lib/api/model-types';

interface ModelFormData {
  name: string;
  provider: string;
  apiKey: string;
  baseUrl?: string;
  enabled: boolean;
}

export default function ModelPage() {
  const t = useTranslations('models');
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelConfig | null>(null);
  const [form] = Form.useForm();

  const fetchModels = useCallback(async () => {
    try {
      const response = await fetch('/api/models');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result: { success: boolean; data?: ModelConfig[]; error?: { message: string } } = await response.json();

      if (result.success) {
        setModels(result.data ?? []);
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
    fetchModels();
  }, [fetchModels]);

  const handleOpenModal = (model?: ModelConfig) => {
    if (model) {
      setEditingModel(model);
      form.setFieldsValue({
        name: model.name,
        provider: model.provider,
        apiKey: model.apiKey,
        baseUrl: model.baseUrl,
        enabled: model.enabled,
      });
    } else {
      setEditingModel(null);
      form.resetFields();
      form.setFieldValue('enabled', true);
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingModel(null);
    form.resetFields();
  };

  const handleSubmit = async (values: ModelFormData) => {
    setLoading(true);
    try {
      const url = editingModel ? '/api/models' : '/api/models';
      const method = editingModel ? 'PUT' : 'POST';
      const body = editingModel
        ? { id: editingModel.id, ...values }
        : values;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result: { success: boolean; error?: { message: string } } = await response.json();

      if (result.success) {
        message.success(editingModel ? t('updateSuccess') : t('createSuccess'));
        handleCloseModal();
        fetchModels();
      } else {
        message.error(result.error?.message ?? (editingModel ? t('updateFailed') : t('createFailed')));
      }
    } catch {
      message.error(editingModel ? t('updateFailed') : t('createFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/models?id=${id}`, {
        method: 'DELETE',
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result: { success: boolean; error?: { message: string } } = await response.json();

      if (result.success) {
        message.success(t('deleteSuccess'));
        fetchModels();
      } else {
        message.error(result.error?.message ?? t('deleteFailed'));
      }
    } catch {
      message.error(t('deleteFailed'));
    }
  };

  const columns = [
    {
      title: t('modelName'),
      dataIndex: 'name',
      key: 'name',
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'] as const,
    },
    {
      title: t('provider'),
      dataIndex: 'provider',
      key: 'provider',
      responsive: ['sm', 'md', 'lg', 'xl'] as const,
    },
    {
      title: t('status'),
      dataIndex: 'enabled',
      key: 'enabled',
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'] as const,
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'green' : 'default'}>{enabled ? t('enabled') : t('disabled')}</Tag>
      ),
    },
    {
      title: t('actions'),
      key: 'actions',
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'] as const,
      render: (_: unknown, record: ModelConfig) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              handleOpenModal(record);
            }}
          >
            {t('edit')}
          </Button>
          <Popconfirm
            title={t('confirmDelete')}
            onConfirm={() => {
              handleDelete(record.id);
            }}
            okText={t('delete')}
            cancelText="取消"
          >
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>
              {t('delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* 页面标题和操作按钮 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong style={{ fontSize: 20 }}>
            {t('title')}
          </Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => {
            handleOpenModal();
          }}>
            {t('addModel')}
          </Button>
        </div>

        <Text type="secondary">{t('description')}</Text>

        {/* 模型列表 */}
        {fetching ? (
          <Empty description="加载中..." />
        ) : models.length === 0 ? (
          <Empty description={t('noModelsDesc')} />
        ) : (
          <Table
            columns={columns}
            dataSource={models}
            rowKey="id"
            pagination={false}
            size="middle"
          />
        )}
      </div>

      {/* 添加/编辑模型弹窗 */}
      <Modal
        title={editingModel ? t('editModel') : t('addModel')}
        open={modalOpen}
        onCancel={handleCloseModal}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="name"
            label={t('modelName')}
            rules={[{ required: true, message: t('modelNameRequired') }]}
          >
            <Input placeholder={t('modelNamePlaceholder')} />
          </Form.Item>

          <Form.Item
            name="provider"
            label={t('provider')}
            rules={[{ required: true, message: t('providerRequired') }]}
          >
            <Input placeholder={t('providerPlaceholder')} />
          </Form.Item>

          <Form.Item
            name="apiKey"
            label={t('apiKey')}
            rules={[{ required: true, message: t('apiKeyRequired') }]}
          >
            <Input.Password placeholder={t('apiKeyPlaceholder')} />
          </Form.Item>

          <Form.Item name="baseUrl" label={t('baseUrl')}>
            <Input placeholder={t('baseUrlPlaceholder')} />
          </Form.Item>

          <Form.Item name="enabled" label={t('status')} valuePropName="checked">
            <Switch checkedChildren={t('enabled')} unCheckedChildren={t('disabled')} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCloseModal}>取消</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingModel ? t('updateSuccess') : t('createSuccess')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  );
}
