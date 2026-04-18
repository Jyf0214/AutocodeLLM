'use client';

import { useState, useCallback, useEffect } from 'react';

import { Text } from '@lobehub/ui';
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

interface McpFormValues {
  name: string;
  url: string;
  enabled: boolean;
}

export default function McpPage() {
  const t = useTranslations();
  const [dataSource, setDataSource] = useState<McpServer[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<McpServer | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [form] = Form.useForm<McpFormValues>();

  const fetchServers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/mcp');
      const data: McpServerResponse = await res.json();
      if (data.success) {
        setDataSource(data.data as McpServer[]);
      } else {
        message.error(data.error?.message ?? '获取列表失败');
      }
    } catch {
      message.error('获取 MCP 服务列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

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
          message.success('MCP 服务更新成功');
          setModalOpen(false);
          fetchServers();
        } else {
          message.error(data.error?.message ?? '更新失败');
        }
      } else {
        const res = await fetch('/api/mcp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
        const data: McpServerResponse = await res.json();
        if (data.success) {
          message.success('MCP 服务创建成功');
          setModalOpen(false);
          fetchServers();
        } else {
          message.error(data.error?.message ?? '创建失败');
        }
      }
    } catch {
      message.error(editingServer ? '更新 MCP 服务失败' : '创建 MCP 服务失败');
    }
  }, [editingServer, form, fetchServers]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/mcp?id=${id}`, { method: 'DELETE' });
        const data: McpServerResponse = await res.json();
        if (data.success) {
          message.success('MCP 服务删除成功');
          fetchServers();
        } else {
          message.error(data.error?.message ?? '删除失败');
        }
      } catch {
        message.error('删除 MCP 服务失败');
      }
    },
    [fetchServers]
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
          message.error(data.error?.message ?? '测试失败');
        }
      } catch {
        message.error('测试 MCP 服务连通性失败');
      } finally {
        setTestingId(null);
      }
    },
    []
  );

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'green' : 'red'}>{enabled ? '已启用' : '已禁用'}</Tag>
      ),
    },
    {
      title: '连接状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'connected' ? 'green' : status === 'disconnected' ? 'default' : 'orange'}>
          {status === 'connected' ? '已连接' : status === 'disconnected' ? '未连接' : status}
        </Tag>
      ),
    },
    {
      title: '工具数量',
      dataIndex: 'tools',
      key: 'tools',
      render: (tools: string[]) => tools.length,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: McpServer) => (
        <Space>
          <Tooltip title="测试连通性">
            <Button
              type="text"
              icon={<ThunderboltOutlined />}
              onClick={() => { handleTest(record); }}
              loading={testingId === record.id}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => { handleOpenModal(record); }}
            />
          </Tooltip>
          <Popconfirm
            title="确定删除此 MCP 服务吗？"
            onConfirm={() => { void handleDelete(record.id); }}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
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
        {t('common.mcp')}
      </Text>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        配置和管理 MCP（Model Context Protocol）服务连接。
      </Text>

      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => { handleOpenModal(); }}
        style={{ marginBottom: 16 }}
      >
        添加 MCP 服务
      </Button>

      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
        loading={loading}
        pagination={false}
      />

      <Modal
        title={editingServer ? '编辑 MCP 服务' : '添加 MCP 服务'}
        open={modalOpen}
        onOk={() => { void handleSave(); }}
        onCancel={() => { setModalOpen(false); }}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入 MCP 服务名称' }]}
          >
            <Input placeholder="例如：My MCP Server" />
          </Form.Item>
          <Form.Item
            name="url"
            label="URL"
            rules={[{ required: true, message: '请输入 MCP 服务 URL' }, { type: 'url', message: '请输入有效的 URL' }]}
          >
            <Input placeholder="https://example.com/mcp" />
          </Form.Item>
          <Form.Item name="enabled" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}