'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Text, Empty, Modal, Form, Input, Switch } from '@lobehub/ui';
import { PlusOutlined, EditOutlined, DeleteOutlined, HeartOutlined } from '@ant-design/icons';
import { Table, Tag, Space, Popconfirm, Select as AntSelect } from 'antd';
import { useTranslations } from 'next-intl';
import { message } from 'antd';
import AppLayout from '@/components/layout/AppLayout';
import type { Worker } from '@/lib/api/worker-types';

interface WorkerFormData {
  name: string;
  type: 'compute' | 'storage' | 'inference';
  url: string;
  metadata?: string;
  enabled: boolean;
}

const STATUS_COLORS = {
  online: 'green',
  offline: 'default',
  busy: 'blue',
  error: 'red',
} as const;

const TYPE_LABELS = {
  compute: 'compute',
  storage: 'storage',
  inference: 'inference',
} as const;

export default function WorkersPage() {
  const t = useTranslations('workers');
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [form] = Form.useForm();

  const fetchWorkers = useCallback(async () => {
    try {
      const response = await fetch('/api/workers');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result: { success: boolean; data?: Worker[]; error?: { message: string } } = await response.json();

      if (result.success) {
        setWorkers(result.data ?? []);
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
    fetchWorkers();
  }, [fetchWorkers]);

  const handleOpenModal = (worker?: Worker) => {
    if (worker) {
      setEditingWorker(worker);
      form.setFieldsValue({
        name: worker.name,
        type: worker.type,
        url: worker.url,
        metadata: worker.metadata ? JSON.stringify(worker.metadata, null, 2) : undefined,
        enabled: worker.enabled,
      });
    } else {
      setEditingWorker(null);
      form.resetFields();
      form.setFieldValue('enabled', true);
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingWorker(null);
    form.resetFields();
  };

  const handleSubmit = async (values: WorkerFormData) => {
    setLoading(true);
    try {
      let metadata: Record<string, unknown> | undefined;
      if (values.metadata) {
        try {
          metadata = JSON.parse(values.metadata) as Record<string, unknown>;
        } catch {
          message.error('元数据 JSON 格式错误');
          setLoading(false);
          return;
        }
      }

      const url = '/api/workers';
      const method = editingWorker ? 'PUT' : 'POST';
      const body = editingWorker
        ? { id: editingWorker.id, name: values.name, type: values.type, url: values.url, metadata, enabled: values.enabled }
        : { name: values.name, type: values.type, url: values.url, metadata, enabled: values.enabled };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result: { success: boolean; error?: { message: string } } = await response.json();

      if (result.success) {
        message.success(editingWorker ? t('updateSuccess') : t('createSuccess'));
        handleCloseModal();
        fetchWorkers();
      } else {
        message.error(result.error?.message ?? (editingWorker ? t('updateFailed') : t('createFailed')));
      }
    } catch {
      message.error(editingWorker ? t('updateFailed') : t('createFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/workers?id=${id}`, {
        method: 'DELETE',
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result: { success: boolean; error?: { message: string } } = await response.json();

      if (result.success) {
        message.success(t('deleteSuccess'));
        fetchWorkers();
      } else {
        message.error(result.error?.message ?? t('deleteFailed'));
      }
    } catch {
      message.error(t('deleteFailed'));
    }
  };

  const handleHealthCheck = async (worker: Worker) => {
    try {
      const response = await fetch(`${worker.url}/health`, { method: 'GET' });
      if (response.ok) {
        message.success(t('healthCheckSuccess'));
        await fetchWorkers();
      } else {
        message.error(t('healthCheckFailed'));
      }
    } catch {
      message.error(t('healthCheckFailed'));
    }
  };

  const formatHeartbeat = (heartbeat: string | null) => {
    if (!heartbeat) return '-';
    const date = new Date(heartbeat);
    return date.toLocaleString('zh-CN');
  };

  const columns = [
    {
      title: t('workerName'),
      dataIndex: 'name',
      key: 'name',
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'] as const,
    },
    {
      title: t('workerType'),
      dataIndex: 'type',
      key: 'type',
      responsive: ['sm', 'md', 'lg', 'xl'] as const,
      render: (type: keyof typeof TYPE_LABELS) => (
        <Tag>{t(TYPE_LABELS[type])}</Tag>
      ),
    },
    {
      title: t('status'),
      dataIndex: 'status',
      key: 'status',
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'] as const,
      render: (status: keyof typeof STATUS_COLORS) => (
        <Tag color={STATUS_COLORS[status]}>{t(status)}</Tag>
      ),
    },
    {
      title: t('lastHeartbeat'),
      dataIndex: 'lastHeartbeat',
      key: 'lastHeartbeat',
      responsive: ['md', 'lg', 'xl'] as const,
      render: (heartbeat: string | null) => formatHeartbeat(heartbeat),
    },
    {
      title: t('actions'),
      key: 'actions',
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'] as const,
      render: (_: unknown, record: Worker) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<HeartOutlined />}
            onClick={() => {
              handleHealthCheck(record);
            }}
          >
            {t('runHealthCheck')}
          </Button>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong style={{ fontSize: 20 }}>
            {t('title')}
          </Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => {
            handleOpenModal();
          }}>
            {t('addWorker')}
          </Button>
        </div>

        <Text type="secondary">{t('description')}</Text>

        {fetching ? (
          <Empty description="加载中..." />
        ) : workers.length === 0 ? (
          <Empty description={t('noWorkersDesc')} />
        ) : (
          <Table
            columns={columns}
            dataSource={workers}
            rowKey="id"
            pagination={false}
            size="middle"
          />
        )}
      </div>

      <Modal
        title={editingWorker ? t('editWorker') : t('addWorker')}
        open={modalOpen}
        onCancel={handleCloseModal}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="name"
            label={t('workerName')}
            rules={[{ required: true, message: t('workerNameRequired') }]}
          >
            <Input placeholder={t('workerNamePlaceholder')} />
          </Form.Item>

          <Form.Item
            name="type"
            label={t('workerType')}
            rules={[{ required: true, message: t('workerTypeRequired') }]}
          >
          <AntSelect
            placeholder={t('workerTypeRequired')}
            options={[
              { value: 'compute', label: t('compute') },
              { value: 'storage', label: t('storage') },
              { value: 'inference', label: t('inference') },
            ]}
          />
          </Form.Item>

          <Form.Item
            name="url"
            label={t('url')}
            rules={[{ required: true, message: t('urlRequired') }]}
          >
            <Input placeholder={t('urlPlaceholder')} />
          </Form.Item>

          <Form.Item name="metadata" label={t('metadata')}>
            <Input.TextArea
              rows={4}
              placeholder={t('metadataPlaceholder')}
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>

          <Form.Item name="enabled" label={t('status')} valuePropName="checked">
            <Switch checkedChildren={t('enabled')} unCheckedChildren={t('disabled')} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCloseModal}>取消</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingWorker ? t('updateSuccess') : t('createSuccess')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  );
}
