'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Text, Empty, Modal, Form, Input, InputNumber } from '@lobehub/ui';
import { PlusOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined, PauseCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { Table, Tag, Space, Popconfirm, Progress, Collapse, Select as AntdSelect } from 'antd';
import { useTranslations } from 'next-intl';
import { message } from 'antd';
import AppLayout from '@/components/layout/AppLayout';
import type { AgentTask } from '@/lib/api/agent-task-types';

interface AgentTaskFormData {
  name: string;
  description?: string;
  mode: 'read_only' | 'yolo';
  maxAgents: number;
}

const STATUS_COLORS = {
  ready: 'blue',
  running: 'green',
  completed: 'default',
  failed: 'red',
} as const;

const MODE_COLORS = {
  read_only: 'orange',
  yolo: 'purple',
} as const;

export default function AgentsPage() {
  const t = useTranslations('agents');
  const [agents, setAgents] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentTask | null>(null);
  const [viewingAgent, setViewingAgent] = useState<AgentTask | null>(null);
  const [form] = Form.useForm();

  const fetchAgents = useCallback(async () => {
    try {
      const response = await fetch('/api/agents');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result: { success: boolean; data?: AgentTask[]; error?: { message: string } } = await response.json();

      if (result.success) {
        setAgents(result.data ?? []);
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
    fetchAgents();
  }, [fetchAgents]);

  const handleOpenModal = (agent?: AgentTask) => {
    if (agent) {
      setEditingAgent(agent);
      form.setFieldsValue({
        name: agent.name,
        description: agent.description,
        mode: agent.mode,
        maxAgents: agent.maxAgents,
      });
    } else {
      setEditingAgent(null);
      form.resetFields();
      form.setFieldValue('maxAgents', 5);
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingAgent(null);
    form.resetFields();
  };

  const handleSubmit = async (values: AgentTaskFormData) => {
    setLoading(true);
    try {
      const url = '/api/agents';
      const method = editingAgent ? 'PUT' : 'POST';
      const body = editingAgent
        ? { id: editingAgent.id, ...values }
        : values;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result: { success: boolean; error?: { message: string } } = await response.json();

      if (result.success) {
        message.success(editingAgent ? t('updateSuccess') : t('createSuccess'));
        handleCloseModal();
        fetchAgents();
      } else {
        message.error(result.error?.message ?? (editingAgent ? t('updateFailed') : t('createFailed')));
      }
    } catch {
      message.error(editingAgent ? t('updateFailed') : t('createFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/agents?id=${id}`, {
        method: 'DELETE',
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result: { success: boolean; error?: { message: string } } = await response.json();

      if (result.success) {
        message.success(t('deleteSuccess'));
        fetchAgents();
      } else {
        message.error(result.error?.message ?? t('deleteFailed'));
      }
    } catch {
      message.error(t('deleteFailed'));
    }
  };

  const handleToggleTask = async (agent: AgentTask) => {
    const isRunning = agent.status === 'running';
    
    if (isRunning) {
      if (agent.status !== 'running') {
        message.error(t('cannotStop'));
        return;
      }
    } else {
      if (agent.status !== 'ready') {
        message.error(t('cannotStart'));
        return;
      }
    }

    try {
      const response = await fetch('/api/agents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: agent.id,
          status: isRunning ? 'ready' : 'running',
          progress: isRunning ? 0 : agent.progress,
        }),
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result: { success: boolean; error?: { message: string } } = await response.json();

      if (result.success) {
        message.success(isRunning ? t('stopSuccess') : t('startSuccess'));
        fetchAgents();
      } else {
        message.error(isRunning ? t('stopFailed') : t('startFailed'));
      }
    } catch {
      message.error(isRunning ? t('stopFailed') : t('startFailed'));
    }
  };

  const handleViewLogs = (agent: AgentTask) => {
    setViewingAgent(agent);
    setLogModalOpen(true);
  };

  const formatMode = (mode: keyof typeof MODE_COLORS) => {
    const labels: Record<string, string> = {
      read_only: t('readOnly'),
      yolo: t('yoloMode'),
    };
    return labels[mode] ?? mode;
  };

  const formatLogs = (logs: Record<string, unknown>[] | null) => {
    if (!logs || logs.length === 0) return t('noLogs');
    return logs.map((log, index) => (
      <div key={index} style={{ marginBottom: 8, fontFamily: 'monospace', fontSize: 12 }}>
        <Text type="secondary">{JSON.stringify(log)}</Text>
      </div>
    ));
  };

  const columns = [
    {
      title: t('agentName'),
      dataIndex: 'name',
      key: 'name',
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'] as const,
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
      title: t('executionMode'),
      dataIndex: 'mode',
      key: 'mode',
      responsive: ['sm', 'md', 'lg', 'xl'] as const,
      render: (mode: keyof typeof MODE_COLORS) => (
        <Tag color={MODE_COLORS[mode]}>{formatMode(mode)}</Tag>
      ),
    },
    {
      title: t('maxAgents'),
      dataIndex: 'maxAgents',
      key: 'maxAgents',
      responsive: ['md', 'lg', 'xl'] as const,
    },
    {
      title: t('progress'),
      dataIndex: 'progress',
      key: 'progress',
      responsive: ['sm', 'md', 'lg', 'xl'] as const,
      render: (progress: number, record: AgentTask) => (
        <Progress 
          percent={progress} 
          size="small" 
          status={record.status === 'failed' ? 'exception' : record.status === 'completed' ? 'success' : 'active'}
        />
      ),
    },
    {
      title: t('actions'),
      key: 'actions',
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'] as const,
      render: (_: unknown, record: AgentTask) => (
        <Space orientation="vertical" size="small">
          <Space>
            {record.status === 'ready' && (
              <Button
                type="link"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => {
                  handleToggleTask(record);
                }}
              >
                {t('startTask')}
              </Button>
            )}
            {record.status === 'running' && (
              <Button
                type="link"
                size="small"
                danger
                icon={<PauseCircleOutlined />}
                onClick={() => {
                  handleToggleTask(record);
                }}
              >
                {t('stopTask')}
              </Button>
            )}
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                handleViewLogs(record);
              }}
            >
              {t('logs')}
            </Button>
          </Space>
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
            {t('addAgent')}
          </Button>
        </div>

        <Text type="secondary">{t('description')}</Text>

        {fetching ? (
          <Empty description="加载中..." />
        ) : agents.length === 0 ? (
          <Empty description={t('noAgentsDesc')} />
        ) : (
          <Table
            columns={columns}
            dataSource={agents}
            rowKey="id"
            pagination={false}
            size="middle"
          />
        )}
      </div>

      <Modal
        title={editingAgent ? t('editAgent') : t('addAgent')}
        open={modalOpen}
        onCancel={handleCloseModal}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="name"
            label={t('agentName')}
            rules={[{ required: true, message: t('agentNameRequired') }]}
          >
            <Input placeholder={t('agentNamePlaceholder')} />
          </Form.Item>

          <Form.Item name="description" label={t('agentDescription')}>
            <Input.TextArea
              rows={3}
              placeholder={t('descriptionPlaceholder')}
            />
          </Form.Item>

          <Form.Item
            name="mode"
            label={t('executionMode')}
            rules={[{ required: true, message: t('modeRequired') }]}
          >
            <AntdSelect
              placeholder={t('modeRequired')}
              options={[
                { value: 'read_only', label: t('readOnly') },
                { value: 'yolo', label: t('yoloMode') },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="maxAgents"
            label={t('maxAgents')}
            rules={[{ required: true, message: t('maxAgentsRequired') }]}
          >
            <InputNumber
              min={1}
              max={20}
              placeholder={t('maxAgentsPlaceholder')}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCloseModal}>取消</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingAgent ? t('updateSuccess') : t('createSuccess')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`${t('logs')} - ${viewingAgent?.name ?? ''}`}
        open={logModalOpen}
        onCancel={() => {
          setLogModalOpen(false);
          setViewingAgent(null);
        }}
        footer={null}
        width={800}
        destroyOnHidden
      >
        {viewingAgent && (
          <div style={{ maxHeight: 500, overflow: 'auto' }}>
            {viewingAgent.result && (
              <Collapse
                items={[
                  {
                    key: 'result',
                    label: t('result'),
                    children: <Text>{viewingAgent.result}</Text>,
                  },
                ]}
                style={{ marginBottom: 16 }}
              />
            )}
            <Collapse
              items={[
                {
                  key: 'logs',
                  label: t('logs'),
                  children: formatLogs(viewingAgent.logs),
                },
              ]}
              defaultActiveKey={['logs']}
            />
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}
