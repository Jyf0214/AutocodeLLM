'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, Descriptions, Tag, Button, Spin, Space } from 'antd';
import { useTranslations } from 'next-intl';
import { ReloadOutlined, CopyOutlined } from '@ant-design/icons';
import { Flexbox, Text } from '@lobehub/ui';
import { useParams } from 'next/navigation';
import { message } from 'antd';

interface WorkspaceDetail {
  id: string;
  name: string;
  description: string | null;
  accessPassword: string | null;
  createdAt: string;
  updatedAt: string;
}

interface WorkspaceResponse {
  success: boolean;
  data?: WorkspaceDetail;
  error?: { message: string };
}

export default function WorkplaceDetailPage() {
  const params = useParams();
  const workspaceId = params?.id as string;
  const t = useTranslations();
  const [workspace, setWorkspace] = useState<WorkspaceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`);
      const data: WorkspaceResponse = await res.json();
      if (data.success && data.data) {
        setWorkspace(data.data);
      } else {
        setError(data.error?.message ?? '获取工作区详情失败');
      }
    } catch (err) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (workspaceId) {
      fetchDetail();
    }
  }, [workspaceId, fetchDetail]);

  const copyId = () => {
    if (workspace?.id) {
      navigator.clipboard.writeText(workspace.id);
      message.success('ID 已复制');
    }
  };

  if (loading) {
    return (
      <Flexbox align="center" justify="center" style={{ minHeight: '50vh' }}>
        <Spin size="large" />
      </Flexbox>
    );
  }

  if (error || !workspace) {
    return (
      <Flexbox align="center" justify="center" style={{ minHeight: '50vh', padding: 16 }}>
        <Card>
          <Flexbox gap={16} style={{ flexDirection: 'column' }}>
            <Text type="danger">{error || '工作区不存在'}</Text>
            <Button icon={<ReloadOutlined />} onClick={fetchDetail}>
              {t('retry') || '重试'}
            </Button>
          </Flexbox>
        </Card>
      </Flexbox>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('zh-CN');
  };

  return (
    <Flexbox gap={16} style={{ flexDirection: 'column', padding: '0 16px' }}>
      <Text style={{ fontSize: 20, fontWeight: 700 }}>
        {workspace.name}
      </Text>

      <Card>
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="ID">
            <Space>
              <Text style={{ fontFamily: 'monospace' }}>{workspace.id}</Text>
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={copyId}
              />
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label={t('description') || '描述'}>
            {workspace.description || '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('accessPassword') || '访问密码'}>
            <Tag color={workspace.accessPassword ? 'green' : 'default'}>
              {workspace.accessPassword ? t('enabled') || '已启用' : t('disabled') || '未启用'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('createdAt') || '创建时间'}>
            {formatDate(workspace.createdAt)}
          </Descriptions.Item>
          <Descriptions.Item label={t('updatedAt') || '更新时间'}>
            {formatDate(workspace.updatedAt)}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </Flexbox>
  );
}