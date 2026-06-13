'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { message, Modal, Form, Input, Dropdown } from 'antd';
import { PageContainer, CustomButton, FilterPill } from '@/lib/ui';
import { ProCard } from '@/ui/pro-card';
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

function ProjectCard({ project, onClick, onEdit, onDelete }: {
  project: ProjectListItem;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations('project');
  const date = new Date(project.createdAt);
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-xl border transition-all duration-200 hover:shadow-md p-5"
      style={{
        background: 'var(--bg-primary)',
        borderColor: 'var(--border-primary)',
      }}
    >
      <div className="flex items-start gap-3.5">
        {/* 图标 */}
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 group-hover:bg-zinc-900"
             style={{ background: 'var(--bg-secondary)' }}>
          <FolderOutlined className="text-base transition-all duration-200 group-hover:text-white"
                          style={{ color: 'var(--text-secondary)' }} />
        </div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-[15px] font-semibold truncate"
                style={{ color: 'var(--text-primary)' }}>
              {project.name}
            </h3>
            <Dropdown
              menu={{
                items: [
                  { key: 'edit', icon: <EditOutlined />, label: t('edit') },
                  { key: 'delete', icon: <DeleteOutlined />, label: t('delete'), danger: true },
                ],
                onClick: ({ key, domEvent }) => {
                  domEvent.stopPropagation();
                  if (key === 'edit') onEdit();
                  if (key === 'delete') onDelete();
                },
              }}
              trigger={['click']}
            >
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className="w-7 h-7 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-tertiary)' }}
              >
                <MoreOutlined style={{ fontSize: 16 }} />
              </button>
            </Dropdown>
          </div>
          <p className="text-sm mt-1 truncate"
             style={{ color: 'var(--text-tertiary)' }}>
            {project.description || <span className="italic">{t('noDescription')}</span>}
          </p>
        </div>
      </div>

      {/* 底部 */}
      <div className="flex justify-between items-center mt-3.5 pt-3 border-t"
           style={{ borderColor: 'var(--border-primary)' }}>
        <span className="text-xs flex items-center gap-1.5"
              style={{ color: 'var(--text-tertiary)' }}>
          <ClockCircleOutlined style={{ fontSize: 12 }} />
          {t('createdAt')} {dateStr}
        </span>
        <span className="text-xs font-medium flex items-center gap-1 transition-all duration-200 group-hover:text-zinc-900"
              style={{ color: 'var(--text-tertiary)' }}>
          {t('enter')}
          <ArrowRightOutlined style={{ fontSize: 11 }} />
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
    } catch { message.error(t('fetchFailed')); }
    finally { setLoading(false); }
  }, [t]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const filtered = useMemo(() => {
    if (!search) return projects;
    const q = search.toLowerCase();
    return projects.filter((w) => w.name.toLowerCase().includes(q));
  }, [projects, search]);

  const handleCreate = useCallback(async () => {
    try {
      const values = await form.validateFields();
      const res = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
      const data = await res.json();
      if (data.success) { message.success(t('createSuccess')); setCreateModal(false); form.resetFields(); fetchProjects(); }
      else message.error(data.error?.message ?? t('createFailed'));
    } catch { /* validation error */ }
  }, [form, t, fetchProjects]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { message.success(t('deleteSuccess')); fetchProjects(); }
      else message.error(data.error?.message ?? t('deleteFailed'));
    } catch { message.error(t('deleteFailed')); }
  }, [t, fetchProjects]);

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 animate-fade-in">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('title')}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            {projects.length > 0 ? t('projectCount', { count: String(projects.length) }) : t('startByCreating')}
          </p>
        </div>
        <CustomButton variant="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)}>
          {t('new')}
        </CustomButton>
      </div>

      {/* 搜索 */}
      <div className="relative mb-5">
        <SearchOutlined className="absolute left-3.5 top-1/2 -translate-y-1/2"
                       style={{ fontSize: 15, color: 'var(--text-tertiary)' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('search')}
          className="w-full h-10 pl-10 pr-3 rounded-lg border text-sm outline-none transition-all duration-200 focus:border-zinc-800"
          style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
        />
      </div>

      {/* 列表 */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: 'var(--bg-secondary)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 animate-fade-in">
          <FolderOutlined className="text-4xl mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <p style={{ color: 'var(--text-tertiary)' }}>{search ? t('noMatchFound') : t('empty')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((proj) => (
            <ProjectCard
              key={proj.id}
              project={proj}
              onClick={() => router.push(`/project/${proj.id}`)}
              onEdit={() => { setEditModal({ open: true, project: proj }); form.setFieldsValue(proj); }}
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
      <Modal title={t('createNew')} open={createModal}
        onOk={handleCreate} onCancel={() => { setCreateModal(false); form.resetFields(); }}
        okText={t('createBtn')} cancelText={t('cancel')}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label={t('projectName')} rules={[{ required: true, message: t('projectNameRequired') }]}>
            <Input placeholder={t('projectNamePlaceholder')} />
          </Form.Item>
          <Form.Item name="description" label={t('projectDescription')}>
            <Input.TextArea rows={3} placeholder={t('projectDescriptionPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑弹窗 */}
      <Modal title={t('editProject')} open={editModal.open}
        onOk={async () => {
          try {
            const values = await form.validateFields();
            const res = await fetch(`/api/projects/${editModal.project?.id ?? ''}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
            const data = await res.json();
            if (data.success) { message.success(t('updateSuccess')); setEditModal({ open: false }); form.resetFields(); fetchProjects(); }
            else message.error(data.error?.message ?? t('updateFailed'));
          } catch { /* validation */ }
        }}
        onCancel={() => { setEditModal({ open: false }); form.resetFields(); }}
        okText={t('update')} cancelText={t('cancel')}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label={t('projectName')} rules={[{ required: true, message: t('projectNameRequired') }]}>
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
