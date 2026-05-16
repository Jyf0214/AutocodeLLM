'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { message, Modal, Form, Dropdown } from 'antd';
import { PageContainer, Button, Text, Flexbox } from '@/lib/ui';
import {
  PlusOutlined,
  FolderOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowRightOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import type { ProjectListItem } from '@/lib/api/project-types';
import { Input } from 'antd';

interface ProjectCardProps {
  project: ProjectListItem;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function ProjectCard({ project, onClick, onEdit, onDelete }: ProjectCardProps) {
  const t = useTranslations('project');
  const [hovered, setHovered] = useState(false);
  const date = new Date(project.createdAt);
  const dateStr = `${String(date.getFullYear())}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const menuItems = [
    { key: 'edit', icon: <EditOutlined />, label: t('edit') },
    { key: 'delete', icon: <DeleteOutlined />, label: t('delete'), danger: true },
  ];

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--bg-primary)',
        borderRadius: 8,
        border: '1px solid var(--border-primary)',
        padding: '16px 20px',
        cursor: 'pointer',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        boxShadow: hovered ? '0 2px 12px rgba(0,0,0,0.06)' : 'none',
        borderColor: hovered ? 'var(--text-primary)' : 'var(--border-primary)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        {/* 图标 */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            background: hovered ? 'var(--text-primary)' : 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.15s ease',
          }}
        >
          <FolderOutlined
            style={{
              fontSize: 18,
              color: hovered ? '#fff' : 'var(--text-secondary)',
              transition: 'color 0.15s ease',
            }}
          />
        </div>

        {/* 内容 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text
              strong
              style={{
                fontSize: 15,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {project.name}
            </Text>
            <Dropdown
              menu={{
                items: menuItems.map((item) => ({
                  key: item.key,
                  icon: item.icon,
                  label: item.label,
                  danger: item.danger,
                })),
                onClick: ({ key, domEvent }) => {
                  domEvent.stopPropagation();
                  if (key === 'edit') onEdit();
                  if (key === 'delete') onDelete();
                },
              }}
              trigger={['click']}
            >
              <button
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  borderRadius: 6,
                  background: hovered ? 'var(--bg-secondary)' : 'transparent',
                  cursor: 'pointer',
                  color: 'var(--text-tertiary)',
                  flexShrink: 0,
                  opacity: hovered ? 1 : 0,
                  transition: 'opacity 0.15s ease',
                }}
              >
                <MoreOutlined style={{ fontSize: 16 }} />
              </button>
            </Dropdown>
          </div>

          <Text
            type="secondary"
            style={{
              fontSize: 13,
              display: 'block',
              marginTop: 4,
              fontStyle: project.description ? 'normal' : 'italic',
            }}
          >
            {project.description || t('noDescription')}
          </Text>
        </div>
      </div>

      {/* 底部 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 14,
          paddingTop: 12,
          borderTop: '1px solid var(--border-primary)',
        }}
      >
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <ClockCircleOutlined style={{ fontSize: 12 }} />
          创建于 {dateStr}
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: hovered ? 'var(--text-primary)' : 'var(--text-tertiary)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            transition: 'color 0.15s ease',
          }}
        >
          {t('enter')}
          <ArrowRightOutlined style={{ fontSize: 12 }} />
        </span>
      </div>
    </div>
  );
}

export default function ProjectPage() {
  const router = useRouter();
  const t = useTranslations('project');
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editModal, setEditModal] = useState<{ open: boolean; project?: ProjectListItem }>({ open: false });
  const [createModal, setCreateModal] = useState(false);
  const [form] = Form.useForm();

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.success) setProjects(data.data ?? []);
    } catch {
      message.error(t('fetchFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/projects');
        const data = await res.json();
        if (data.success) setProjects(data.data ?? []);
      } catch {
        message.error(t('fetchFailed'));
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);

  const filtered = useMemo(() => {
    if (!search) return projects;
    const q = search.toLowerCase();
    return projects.filter((w) => w.name.toLowerCase().includes(q));
  }, [projects, search]);

  const handleCreate = useCallback(async () => {
    try {
      const values = await form.validateFields();
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (data.success) {
        message.success(t('createSuccess'));
        setCreateModal(false);
        form.resetFields();
        fetchProjects();
      } else {
        message.error(data.error?.message ?? t('createFailed'));
      }
    } catch {
      // form validation error
    }
  }, [form, t, fetchProjects]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          message.success(t('deleteSuccess'));
          fetchProjects();
        } else {
          message.error(data.error?.message ?? t('deleteFailed'));
        }
      } catch {
        message.error(t('deleteFailed'));
      }
    },
    [t, fetchProjects],
  );

  return (
    <PageContainer
      title={t('title')}
      subtitle={projects.length > 0 ? t('projectCount', { count: String(projects.length) }) : t('startByCreating')}
      extra={
        <Button icon={<PlusOutlined />} onClick={() => setCreateModal(true)}>
          {t('new')}
        </Button>
      }
    >
      {/* 搜索 */}
      <Input
        prefix={<SearchOutlined style={{ color: 'var(--text-tertiary)' }} />}
        placeholder={t('search')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        allowClear
        style={{ marginBottom: 20 }}
      />

      {/* 列表 */}
      {loading ? (
        <Flexbox gap={12}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: 100,
                borderRadius: 8,
                background: 'var(--bg-secondary)',
              }}
            />
          ))}
        </Flexbox>
      ) : filtered.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 0',
            color: 'var(--text-tertiary)',
          }}
        >
          <FolderOutlined style={{ fontSize: 40, marginBottom: 12, display: 'block' }} />
          <Text type="secondary">{search ? t('noMatchFound') : t('empty')}</Text>
        </div>
       ) : (
         <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
           {filtered.map((proj) => (
             <ProjectCard
               key={proj.id}
               project={proj}
               onClick={() => router.push(`/project/${proj.id}`)}
               onEdit={() => {
                 setEditModal({ open: true, project: proj });
                 form.setFieldsValue(proj);
               }}
               onDelete={() => {
                 Modal.confirm({
                   title: t('confirmDelete'),
                   content: t('deleteProjectConfirm', { name: proj.name }),
                   okText: t('delete'),
                   cancelText: t('cancel'),
                   okButtonProps: { danger: true },
                   onOk: () => handleDelete(proj.id),
                 });
               }}
             />
           ))}
         </div>
       )}

      {/* 创建弹窗 */}
      <Modal
        title={t('createNew')}
        open={createModal}
        onOk={handleCreate}
        onCancel={() => {
          setCreateModal(false);
          form.resetFields();
        }}
        okText={t('createBtn')}
        cancelText={t('cancel')}
      >
        <Form form={form} layout="vertical">
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

      {/* 编辑弹窗 */}
      <Modal
        title={t('editProject')}
        open={editModal.open}
        onOk={async () => {
          try {
            const values = await form.validateFields();
            const res = await fetch(`/api/projects/${editModal.project?.id ?? ''}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(values),
            });
            const data = await res.json();
            if (data.success) {
              message.success(t('updateSuccess'));
              setEditModal({ open: false });
              form.resetFields();
              fetchProjects();
            } else {
              message.error(data.error?.message ?? t('updateFailed'));
            }
          } catch {
            // validation error
          }
        }}
        onCancel={() => {
          setEditModal({ open: false });
          form.resetFields();
        }}
        okText={t('update')}
        cancelText={t('cancel')}
      >
        <Form form={form} layout="vertical">
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
    </PageContainer>
  );
}