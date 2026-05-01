'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Table, Tag, Space, Select, Button } from 'antd';
import { FunctionOutlined, MessageOutlined, ReloadOutlined } from '@ant-design/icons';
import { Text } from '@/lib/ui';
import { useTranslations } from 'next-intl';
import { message } from 'antd';
import type { WorkspaceLog, WorkspaceLogListResponse } from '@/lib/api/workspace-log-types';

interface WorkspaceLogsProps {
  workspaceId: string;
}

export default function WorkspaceLogs({ workspaceId }: WorkspaceLogsProps) {
  const t = useTranslations('workspace');
  const [logs, setLogs] = useState<WorkspaceLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('all');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: '1', pageSize: '100' });
      if (filterType !== 'all') {
        params.set('type', filterType);
      }

      const response = await fetch(`/api/workspaces/${workspaceId}/logs?${params}`);

      if (!response.ok) {
        message.error(t('fetchLogsFailed'));
        return;
      }

      const result = (await response.json()) as WorkspaceLogListResponse;

      if (result.success) {
        setLogs(result.data ?? []);
      } else {
        message.error(result.error?.message ?? t('fetchLogsFailed'));
      }
    } catch {
      message.error(t('fetchLogsFailed'));
    } finally {
      setLoading(false);
    }
  }, [workspaceId, filterType, t]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'success':
        return 'green';
      case 'error':
        return 'red';
      case 'pending':
        return 'orange';
      default:
        return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    if (type === 'function_call') {
      return <FunctionOutlined />;
    }
    return <MessageOutlined />;
  };

  const columns = [
    {
      title: t('logType'),
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => (
        <Space>
          {getTypeIcon(type)}
          <Text>{type === 'function_call' ? t('functionCall') : t('chatMessage')}</Text>
        </Space>
      ),
    },
    {
      title: t('functionName'),
      dataIndex: 'functionName',
      key: 'functionName',
      width: 150,
      render: (name: string | null) => name ?? '-',
    },
    {
      title: t('summary'),
      dataIndex: 'summary',
      key: 'summary',
      ellipsis: true,
      render: (text: string | null) => text ?? '-',
    },
    {
      title: t('status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string | null) => (
        <Tag color={getStatusColor(status)}>
          {status ? t(status) : '-'}
        </Tag>
      ),
    },
    {
      title: t('createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
  ];

  return (
    <Card
      title={t('workspaceLogs')}
      size="small"
      extra={
        <Space>
          <Select
            value={filterType}
            onChange={setFilterType}
            style={{ width: 120 }}
            size="small"
            options={[
              { label: t('all'), value: 'all' },
              { label: t('functionCall'), value: 'function_call' },
              { label: t('chatMessage'), value: 'chat_message' },
            ]}
          />
          <Button
            type="text"
            size="small"
            icon={<ReloadOutlined />}
            onClick={fetchLogs}
            loading={loading}
          />
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={logs}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20, showSizeChanger: false }}
        size="small"
        locale={{ emptyText: t('noLogs') }}
      />
    </Card>
  );
}
