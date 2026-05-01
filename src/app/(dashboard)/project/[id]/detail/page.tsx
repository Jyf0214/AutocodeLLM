'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, Descriptions, Tag, Button, Spin, Space } from 'antd';
import { useTranslations } from 'next-intl';
import { ReloadOutlined, CopyOutlined } from '@ant-design/icons';
import { Flexbox, Text } from '@/lib/ui';
import { useParams } from 'next/navigation';
import { message } from 'antd';
import type { ProjectDetail, ProjectResponse } from '@/lib/api/project-types';

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const t = useTranslations();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      const data: ProjectResponse = await res.json();
      if (data.success && data.data) {
        setProject(data.data as ProjectDetail);
      } else {
        setError(data.error?.message ?? '获取项目详情失败');
      }
    } catch {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      fetchDetail();
    }
  }, [projectId, fetchDetail]);

  const copyId = () => {
    if (project?.id) {
      navigator.clipboard.writeText(project.id);
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

  if (error || !project) {
    return (
      <Flexbox align="center" justify="center" style={{ minHeight: '50vh', padding: 16 }}>
        <Card>
          <Flexbox gap={16} style={{ flexDirection: 'column' }}>
            <Text type="danger">{error ?? '项目不存在'}</Text>
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
        {project.name}
      </Text>

      <Card>
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="ID">
            <Space>
              <Text style={{ fontFamily: 'monospace' }}>{project.id}</Text>
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={copyId}
              />
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label={t('description') || '描述'}>
            {project.description ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('accessPassword') || '访问密码'}>
            <Tag color={project.accessPassword ? 'green' : 'default'}>
              {project.accessPassword ? t('enabled') || '已启用' : t('disabled') || '未启用'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('createdAt') || '创建时间'}>
            {formatDate(project.createdAt)}
          </Descriptions.Item>
          <Descriptions.Item label={t('updatedAt') || '更新时间'}>
            {formatDate(project.updatedAt)}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </Flexbox>
  );
}
