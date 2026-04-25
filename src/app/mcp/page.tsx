'use client';

import { useState, useCallback } from 'react';

import { Text } from '@/lib/ui';
import { useTranslations } from 'next-intl';
import {
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Switch,
  message,
  Popconfirm,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import type { McpServer, McpServerResponse, TestMcpServerResponse } from '@/lib/api/mcp-types';
import { useFetchData } from '@/hooks';

interface McpFormValues {
  name: string;
  url: string;
  enabled: boolean;
}

export default function McpPage() {
  const t = useTranslations();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<McpServer | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [form] = Form.useForm<McpFormValues>();

  const { data: dataSource, loading, refresh } = useFetchData<McpServer[]>('/api/mcp', {
    errorMsg: t('mcp.fetchFailed'),
  });

  const handleOpenModal = useCallback(
    (server?: McpServer) => {
      if (server) {
        setEditingServer(server);
        form.setFieldsValue({
          name: server.name,
          url: server.url,
          enabled: server.enabled,
        });
      } else {
        setEditingServer(null);
        form.resetFields();
      }
      setModalOpen(true);
    },
    [form]
  );

  const handleSave = useCallback(async () => {
    try {
      const values = await form.validateFields();
      if (editingServer) {
        const res = await fetch('/api/mcp', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingServer.id,
            ...values,
          }),
        });
        const data: McpServerResponse = await res.json();
        if (data.success) {
          message.success(t('mcp.updateSuccess'));
          setModalOpen(false);
          refresh();
        } else {
          message.error(data.error?.message ?? t('mcp.updateFailed'));
        }
      } else {
        const res = await fetch('/api/mcp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
        const data: McpServerResponse = await res.json();
        if (data.success) {
          message.success(t('mcp.createSuccess'));
          setModalOpen(false);
          refresh();
        } else {
          message.error(data.error?.message ?? t('mcp.createFailed'));
        }
      }
    } catch {
      message.error(editingServer ? t('mcp.updateFailed') : t('mcp.createFailed'));
    }
  }, [editingServer, form, refresh]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/mcp?id=${id}`, { method: 'DELETE' });
        const data: McpServerResponse = await res.json();
        if (data.success) {
          message.success(t('mcp.deleteSuccess'));
          refresh();
        } else {
          message.error(data.error?.message ?? t('mcp.deleteFailed'));
        }
      } catch {
        message.error(t('mcp.deleteFailed'));
      }
    },
    [refresh, t]
  );

  const handleTest = useCallback(
    async (server: McpServer) => {
      setTestingId(server.id);
      try {
        const res = await fetch('/api/mcp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: server.id, url: server.url }),
        });
        const data: TestMcpServerResponse = await res.json();
        if (data.success && data.data) {
          if (data.data.connected) {
            message.success(data.data.message);
          } else {
            message.warning(data.data.message);
          }
        } else {
          message.error(data.error?.message ?? t('mcp.testFailed'));
        }
      } catch {
        message.error(t('mcp.testFailed'));
      } finally {
        setTestingId(null);
      }
    },
    [t]
  );

  const columns = [
    {
      title: t('mcp.name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('mcp.url'),
      dataIndex: 'url',
      key: 'url',
      ellipsis: true,
    },
    {
      title: t('mcp.status'),
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'green' : 'red'}>{enabled ? t('mcp.enabled') : t('env.disabled')}</Tag>
      ),
    },
    {
      title: t('mcp.connectionStatus'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'connected' ? 'green' : status === 'disconnected' ? 'default' : 'orange'}>
          {status === 'connected' ? t('mcp.connected') : status === 'disconnected' ? t('mcp.disconnected') : status}
        </Tag>
      ),
    },
    {
      title: t('mcp.tools'),
      dataIndex: 'tools',
      key: 'tools',
      render: (tools: string[]) => tools.length,
    },
    {
      title: t('env.actions'),
      key: 'action',
      render: (_: unknown, record: McpServer) => (
        <Space>
          <Tooltip title={t('mcp.testConnection')}>
            <Button
              type="text"
              icon={<ThunderboltOutlined />}
              onClick={() => { handleTest(record); }}
              loading={testingId === record.id}
            />
          </Tooltip>
          <Tooltip title={t('env.edit')}>
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => { handleOpenModal(record); }}
            />
          </Tooltip>
          <Popconfirm
            title={t('mcp.confirmDelete')}
            onConfirm={() => { void handleDelete(record.id); }}
            okText={t('env.delete')}
            cancelText={t('env.cancel')}
          >
            <Tooltip title={t('env.delete')}>
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Text strong style={{ fontSize: 20, display: 'block', marginBottom: 8 }}>
        {t('mcp.title')}
      </Text>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        {t('mcp.description')}
      </Text>

      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => { handleOpenModal(); }}
        style={{ marginBottom: 16 }}
      >
        {t('mcp.addServer')}
      </Button>

      <Table
        columns={columns}
        dataSource={dataSource ?? []}
        rowKey="id"
        loading={loading}
        pagination={false}
      />

      <Modal
        title={editingServer ? t('mcp.editServer') : t('mcp.addServer')}
        open={modalOpen}
        onOk={() => { void handleSave(); }}
        onCancel={() => { setModalOpen(false); }}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label={t('mcp.name')}
            rules={[{ required: true, message: t('mcp.nameRequired') }]}
          >
            <Input placeholder={t('mcp.namePlaceholder')} />
          </Form.Item>
          <Form.Item
            name="url"
            label={t('mcp.url')}
            rules={[{ required: true, message: t('mcp.urlRequired') }, { type: 'url', message: t('mcp.urlInvalid') }]}
          >
            <Input placeholder="https://example.com/mcp" />
          </Form.Item>
          <Form.Item name="enabled" label={t('mcp.enabled')} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}