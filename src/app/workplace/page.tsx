'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { message, Card, Modal as AntdModal } from 'antd';
import {
  Button,
  Text,
  Empty,
  Modal,
  Form,
  Input as LobeInput,
  Flexbox,
  Icon,
  Avatar,
  TextArea,
} from '@lobehub/ui';
import {
  PlusOutlined,
  FolderOutlined,
  ClockCircleOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import AppLayout from '@/components/layout/AppLayout';
import type { WorkspaceListItem } from '@/lib/api/workspace-types';

interface WorkspaceFormData {
  name: string;
  description?: string;
}

function WorkspaceCard({
  workspace,
  onClick,
  onEdit,
  onDelete,
}: {
  workspace: WorkspaceListItem;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const createdAt = new Date(workspace.createdAt).toLocaleDateString('zh-CN');

  return (
    <Card
      hoverable
      onClick={onClick}
      style={{
        height: '100%',
        cursor: 'pointer',
        transition: 'all 200ms',
      }}
      actions={[
        <Icon
          key="edit"
          icon={EditOutlined}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onEdit();
          }}
        />,
        <Icon
          key="delete"
          icon={DeleteOutlined}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onDelete();
          }}
          color="var(--lobe-color-error)"
        />,
      ]}
    >
      <Flexbox gap={12} align="flex-start">
        <Avatar
          avatar={<FolderOutlined style={{ fontSize: 20 }} />}
          size={40}
          background="var(--lobe-color-primary)"
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 4 }}>
            {workspace.name}
          </Text>
          <Text type="secondary" style={{ fontSize: 13, display: 'block' }}>
            {workspace.description || '暂无描述'}
          </Text>
        </div>
      </Flexbox>
      <Flexbox
        gap={16}
        horizontal
        style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}
      >
        <Flexbox gap={4} horizontal align="center">
          <Icon icon={ClockCircleOutlined} size={12} color="var(--color-text-tertiary)" />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {createdAt}
          </Text>
        </Flexbox>
      </Flexbox>
    </Card>
  );
}

export default function WorkplacePage() {
  const t = useTranslations('workplace');
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<WorkspaceListItem[]>([]);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<WorkspaceListItem | null>(null);
  const [form] = Form.useForm();

  const fetchWorkspaces = useCallback(async () => {
    try {
      const response = await fetch('/api/workspaces');
      const result: { success: boolean; data?: WorkspaceListItem[]; error?: { message: string } } =
        await response.json();

      if (result.success) {
        setWorkspaces(result.data ?? []);
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
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleOpenModal = (workspace?: WorkspaceListItem) => {
    if (workspace) {
      setEditingWorkspace(workspace);
      form.setFieldsValue({ name: workspace.name, description: workspace.description });
    } else {
      setEditingWorkspace(null);
      form.resetFields();
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingWorkspace(null);
    form.resetFields();
  };

  const handleSubmit = async (values: WorkspaceFormData) => {
    setLoading(true);
    try {
      const url = editingWorkspace
        ? `/api/workspaces/${editingWorkspace.id}`
        : '/api/workspaces';
      const method = editingWorkspace ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const result: {
        success: boolean;
        data?: WorkspaceListItem;
        error?: { message: string };
      } = await response.json();

      if (result.success && result.data) {
        message.success(editingWorkspace ? '更新成功' : t('createSuccess'));
        handleCloseModal();
        fetchWorkspaces();
        if (!editingWorkspace) {
          router.push(`/workplace/${result.data.id}`);
        }
      } else {
        message.error(result.error?.message ?? (editingWorkspace ? '更新失败' : t('createFailed')));
      }
    } catch {
      message.error(editingWorkspace ? '更新失败' : t('createFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = useCallback(
    (workspace: WorkspaceListItem) => {
      AntdModal.confirm({
        title: '确认删除',
        content: `确定要删除工作区"${workspace.name}"吗？此操作不可恢复。`,
        okText: '删除',
        okButtonProps: { danger: true },
        cancelText: '取消',
        onOk: async () => {
          try {
            const response = await fetch(`/api/workspaces/${workspace.id}`, {
              method: 'DELETE',
            });
            const result: { success: boolean; error?: { message: string } } =
              await response.json();

            if (result.success) {
              message.success('删除成功');
              fetchWorkspaces();
            } else {
              message.error(result.error?.message ?? '删除失败');
            }
          } catch {
            message.error('删除失败');
          }
        },
      });
    },
    [fetchWorkspaces],
  );

  return (
    <AppLayout>
      <Flexbox gap={24}>
        <Flexbox horizontal align="center" justify="space-between">
          <Text strong style={{ fontSize: 20 }}>
            {t('title')}
          </Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { handleOpenModal(); }}>
            {t('create')}
          </Button>
        </Flexbox>

        {fetching ? (
          <Empty icon={<FolderOutlined />} description="加载中..." />
        ) : workspaces.length === 0 ? (
          <Empty
            icon={<FolderOutlined />}
            title={t('emptyTitle')}
            description={t('emptyDesc')}
            action={
              <Button type="primary" icon={<PlusOutlined />} onClick={() => { handleOpenModal(); }}>
                {t('create')}
              </Button>
            }
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 16,
            }}
          >
            {workspaces.map((workspace) => (
              <WorkspaceCard
                key={workspace.id}
                workspace={workspace}
                onClick={() => { router.push(`/workplace/${workspace.id}`); }}
                onEdit={() => { handleOpenModal(workspace); }}
                onDelete={() => { handleDelete(workspace); }}
              />
            ))}
          </div>
        )}
      </Flexbox>

      <Modal
        title={editingWorkspace ? '编辑工作区' : t('create')}
        open={modalOpen}
        onCancel={handleCloseModal}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="name"
            label={t('workspaceName')}
            rules={[{ required: true, message: t('workspaceNameRequired') }]}
          >
            <LobeInput placeholder={t('workspaceNamePlaceholder')} />
          </Form.Item>

          <Form.Item name="description" label={t('workspaceDescription')}>
            <TextArea rows={3} placeholder={t('workspaceDescriptionPlaceholder')} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Flexbox gap={8} horizontal justify="flex-end">
              <Button onClick={handleCloseModal}>取消</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingWorkspace ? '保存' : t('create')}
              </Button>
            </Flexbox>
          </Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  );
}
