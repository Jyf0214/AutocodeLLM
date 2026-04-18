'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Spin, Space } from 'antd';
import { ReloadOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Flexbox, Text, Avatar } from '@lobehub/ui';
import { useRouter } from 'next/navigation';

interface WorkspaceBackup {
  workspaceId: string;
  workspaceName: string;
  lastBackup: string | null;
  nextBackup: string | null;
  status: 'ok' | 'failed' | 'no_backup';
  backupCount: number;
}

interface GlobalBackupsResponse {
  success: boolean;
  data?: WorkspaceBackup[];
  error?: { message: string };
}

export default function GlobalBackupsPage() {
  const router = useRouter();
  const [backups, setBackups] = useState<WorkspaceBackup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBackups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cloud/backups');
      const data: GlobalBackupsResponse = await res.json();
      if (data.success && data.data) {
        setBackups(data.data);
      }
    } catch {
      // 忽略错误
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'ok':
        return <Tag icon={<CheckCircleOutlined />} color="success">正常</Tag>;
      case 'failed':
        return <Tag icon={<CloseCircleOutlined />} color="error">失败</Tag>;
      case 'no_backup':
        return <Tag icon={<ClockCircleOutlined />} color="default">未备份</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('zh-CN');
  };

  const columns = [
    {
      title: '工作区',
      dataIndex: 'workspaceName',
      key: 'workspaceName',
      render: (name: string) => (
        <Flexbox horizontal gap={8} align="center">
          <Avatar size="small" style={{ backgroundColor: '#1677ff' }}>
            {name.charAt(0)}
          </Avatar>
          <Text style={{ fontWeight: 500 }}>{name}</Text>
        </Flexbox>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '上次备份',
      dataIndex: 'lastBackup',
      key: 'lastBackup',
      render: (date: string | null) => formatDate(date),
    },
    {
      title: '下次备份',
      dataIndex: 'nextBackup',
      key: 'nextBackup',
      render: (date: string | null) => formatDate(date),
    },
    {
      title: '备份次数',
      dataIndex: 'backupCount',
      key: 'backupCount',
      render: (count: number) => count,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: WorkspaceBackup) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => router.push(`/workplace/${record.workspaceId}/backups`)}
          >
            查看详情
          </Button>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <Flexbox align="center" justify="center" style={{ height: '100%' }}>
        <Spin size="large" />
      </Flexbox>
    );
  }

  return (
    <Flexbox gap={16} style={{ flexDirection: 'column', height: '100%', maxHeight: 'calc(100dvh - 64px)', overflowY: 'auto', padding: '0 16px 24px' }}>
      <Text style={{ fontSize: 20, fontWeight: 700 }}>全局备份监控</Text>
      <Text type="secondary">查看所有工作区的备份状态（只读视图）</Text>

      <Card
        title="备份概览"
        extra={
          <Button
            type="text"
            size="small"
            icon={<ReloadOutlined />}
            onClick={fetchBackups}
          >
            刷新
          </Button>
        }
      >
        {backups.length === 0 ? (
          <Flexbox align="center" justify="center" style={{ padding: 48 }}>
            <Text type="secondary">暂无备份数据</Text>
          </Flexbox>
        ) : (
          <Table
            columns={columns}
            dataSource={backups}
            rowKey="workspaceId"
            pagination={false}
          />
        )}
      </Card>
    </Flexbox>
  );
}