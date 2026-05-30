'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { message, Modal, Form, Input } from 'antd';
import { Button, Text, Flexbox } from '@/lib/ui';
import { Skeleton } from 'antd';
import {
  FolderOutlined,
  CodeOutlined,
  SettingOutlined,
  EditOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
  ApiOutlined,
  ArrowRightOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import type { ProjectListItem } from '@/lib/api/project-types';

export default function ProjectDetailPage() {
  const t = useTranslations('project');
  const router = useRouter();
  const resolvedParams = useParams();
  const projectId = resolvedParams.id as string;
  const [project, setProject] = useState<ProjectListItem | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const fetchProject = useCallback(async () => {
    setFetching(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) throw new Error(`HTTP ${String(response.status)}`);
      const result = await response.json() as {
        success: boolean;
        data?: ProjectListItem;
        error?: { message: string };
      };
      if (result.success && result.data) {
        setProject(result.data);
      } else {
        setError(result.error?.message ?? t('fetchFailed'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('fetchFailed'));
    } finally {
      setFetching(false);
    }
  }, [projectId, t]);

  useEffect(() => {
    (async () => {
      setFetching(true);
      setError(null);
      try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (!response.ok) throw new Error(`HTTP ${String(response.status)}`);
        const result = await response.json() as {
          success: boolean;
          data?: ProjectListItem;
          error?: { message: string };
        };
        if (result.success && result.data) {
          setProject(result.data);
        } else {
          setError(result.error?.message ?? t('fetchFailed'));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t('fetchFailed'));
      } finally {
        setFetching(false);
      }
    })();
  }, [projectId, t]);

  const handleEdit = useCallback(async () => {
    try {
      const values = await editForm.validateFields();
      setSaving(true);
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (data.success) {
        message.success(t('updateSuccess'));
        setEditModalOpen(false);
        editForm.resetFields();
        fetchProject();
      } else {
        message.error(data.error?.message ?? t('updateFailed'));
      }
    } catch {
      // 表单验证失败
    } finally {
      setSaving(false);
    }
  }, [editForm, projectId, t, fetchProject]);

  const openEditModal = useCallback(() => {
    if (project) {
      editForm.setFieldsValue({
        name: project.name,
        description: project.description || '',
      });
      setEditModalOpen(true);
    }
  }, [project, editForm]);

  const menuItems = [
    { icon: <CodeOutlined />, title: t('terminal'), desc: t('terminalDesc'), path: `/project/${projectId}/terminal` },
    { icon: <SettingOutlined />, title: t('settings'), desc: t('settingsDesc'), path: `/project/${projectId}/detail` },
    { icon: <ApiOutlined />, title: t('channel'), desc: t('channelDesc'), path: `/project/${projectId}/channel` },
  ];

  if (fetching) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px' }}>
        <Skeleton active paragraph={{ rows: 4 }} />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px', textAlign: 'center' }}>
        <FolderOutlined style={{ fontSize: 48, color: 'var(--text-tertiary)', marginBottom: 16 }} />
        <Text strong style={{ fontSize: 18, display: 'block', marginBottom: 8 }}>{t('loadFailed')}</Text>
        <Text type="secondary">{error ?? t('projectNotExist')}</Text>
        <Flexbox gap={12} horizontal justify="center" style={{ marginTop: 24 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/project')}>{t('backToList')}</Button>
           <Button icon={<ReloadOutlined />} onClick={fetchProject}>{t('retry')}</Button>
        </Flexbox>
      </div>
    );
  }

  const created = new Date(project.createdAt);
  const updated = new Date(project.updatedAt);
  const fmt = (d: Date) => `${String(d.getFullYear())}/${String(d.getMonth() + 1)}/${String(d.getDate())}`;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px' }}>
      {/* 头部 */}
      <div style={{ marginBottom: 32 }}>
        <button
          onClick={() => router.push('/project')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 13,
            color: 'var(--text-tertiary)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            marginBottom: 20,
          }}
        >
          <ArrowLeftOutlined style={{ fontSize: 12 }} />
          {t('back')}
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 10,
              background: 'var(--bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <FolderOutlined style={{ fontSize: 22, color: 'var(--text-secondary)' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Text strong style={{ fontSize: 20 }}>{project.name}</Text>
              <button
                onClick={openEditModal}
                style={{
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 6,
                  background: 'var(--bg-primary)',
                  cursor: 'pointer',
                  color: 'var(--text-tertiary)',
                  fontSize: 13,
                }}
              >
                <EditOutlined />
              </button>
            </div>
            <Text type="secondary" style={{ fontSize: 13, display: 'block', marginTop: 4, fontStyle: project.description ? 'normal' : 'italic' }}>
              {project.description || t('noDescription')}
            </Text>
            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <ClockCircleOutlined style={{ fontSize: 11 }} />
                创建于 {fmt(created)}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                更新于 {fmt(updated)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 功能入口 */}
      <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {t('features')}
      </Text>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {menuItems.map((item) => (
          <div
            key={item.path}
            onClick={() => router.push(item.path)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 16px',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'background 0.1s ease',
            }}
            onMouseEnter={(e) => { (e.currentTarget).style.background = 'var(--bg-secondary)'; }}
            onMouseLeave={(e) => { (e.currentTarget).style.background = 'transparent'; }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: 'var(--text-secondary)',
                fontSize: 16,
              }}
            >
              {item.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 14, display: 'block' }}>{item.title}</Text>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 2 }}>
                {item.desc}
              </Text>
            </div>
            <ArrowRightOutlined style={{ fontSize: 12, color: 'var(--text-tertiary)' }} />
          </div>
        ))}
      </div>

      {/* 编辑弹窗 */}
      <Modal
        title={t('editProject')}
        open={editModalOpen}
        onOk={handleEdit}
        confirmLoading={saving}
        onCancel={() => {
          setEditModalOpen(false);
          editForm.resetFields();
        }}
        okText={t('update')}
        cancelText={t('cancel')}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="name"
            label={t('projectName')}
            rules={[{ required: true, message: t('projectNameRequired') }]}
          >
            <Input placeholder={t('projectNamePlaceholder')} />
          </Form.Item>
          <Form.Item name="description" label={t('projectDescription')}>
            <Input.TextArea rows={3} placeholder={t('projectDescriptionPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}