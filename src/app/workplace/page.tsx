'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { message, Spin } from 'antd';
import {
  Button,
  Text,
  Empty,
  Modal,
  Form,
  Input as LobeInput,
  Flexbox,
  Icon,
  TextArea,
  Avatar,
  Skeleton,
} from '@lobehub/ui';
import {
  PlusOutlined,
  FolderOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowRightOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import type { WorkspaceListItem } from '@/lib/api/workspace-types';

/**
 * 工作区卡片组件
 */
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
  const [hovered, setHovered] = useState(false);

  const createdDate = new Date(workspace.createdAt).toLocaleDateString('zh-CN');

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--color-bg)',
        borderRadius: 16,
        border: `1px solid ${hovered ? 'var(--lobe-color-primary)' : 'var(--color-border)'}`,
        padding: 20,
        cursor: 'pointer',
        transition: 'all 250ms ease',
        transform: hovered ? 'translateY(-4px)' : 'none',
        boxShadow: hovered ? '0 8px 24px rgba(0,0,0,0.12)' : 'none',
        position: 'relative',
      }}
    >
      {/* 操作按钮 - 悬停时显示 */}
      {hovered && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            display: 'flex',
            gap: 4,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Icon
            icon={EditOutlined}
            size={16}
            onClick={onEdit}
            style={{
              padding: 6,
              borderRadius: 8,
              background: 'var(--color-fill-quaternary)',
              cursor: 'pointer',
            }}
          />
          <Icon
            icon={DeleteOutlined}
            size={16}
            onClick={onDelete}
            style={{
              padding: 6,
              borderRadius: 8,
              background: 'var(--color-fill-quaternary)',
              cursor: 'pointer',
              color: 'var(--lobe-color-error)',
            }}
          />
        </div>
      )}

      {/* 图标 + 标题 */}
      <Flexbox gap={14} align="flex-start">
        <Avatar
          avatar={<FolderOutlined style={{ fontSize: 22 }} />}
          size={48}
          background={
            hovered
              ? 'var(--lobe-color-primary)'
              : 'var(--color-fill-quaternary)'
          }
          shape="square"
          style={{
            transition: 'all 250ms ease',
            borderRadius: 12,
          }}
        />
        <div style={{ flex: 1, minWidth: 0, paddingRight: hovered ? 60 : 0 }}>
          <Text
            strong
            style={{
              fontSize: 17,
              display: 'block',
              marginBottom: 6,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {workspace.name}
          </Text>
          <Text
            type="secondary"
            style={{
              fontSize: 13,
              display: 'block',
              lineHeight: 1.5,
            }}
          >
            {workspace.description || '暂无描述'}
          </Text>
        </div>
      </Flexbox>

      {/* 底部信息 */}
      <Flexbox
        gap={12}
        horizontal
        align="center"
        style={{
          marginTop: 16,
          paddingTop: 14,
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <Flexbox gap={4} horizontal align="center">
          <Icon icon={ClockCircleOutlined} size={12} color="var(--color-text-tertiary)" />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {createdDate}
          </Text>
        </Flexbox>
        <Flexbox gap={4} horizontal align="center" style={{ marginLeft: 'auto' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            进入
          </Text>
          <Icon icon={ArrowRightOutlined} size={12} color="var(--lobe-color-primary)" />
        </Flexbox>
      </Flexbox>
    </div>
  );
}

/**
 * 加载骨架屏
 */
function LoadingSkeleton() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: 20,
      }}
    >
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            background: 'var(--color-bg)',
            borderRadius: 16,
            border: '1px solid var(--color-border)',
            padding: 20,
          }}
        >
          <Flexbox gap={14} align="flex-start">
            <Skeleton.Avatar active size={48} shape="square" />
            <div style={{ flex: 1 }}>
              <Skeleton.Input active style={{ width: '60%', marginBottom: 8, height: 20 }} />
              <Skeleton.Input active style={{ width: '80%', height: 16 }} />
            </div>
          </Flexbox>
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--color-border)' }}>
            <Skeleton.Input active style={{ width: 80, height: 14 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 工作区列表页面
 */
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

  const handleSubmit = async (values: { name: string; description?: string }) => {
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
      Modal.confirm({
        title: '确认删除',
        content: `确定要删除工作区「${workspace.name}」吗？此操作不可恢复。`,
        okText: '删除',
        okButtonProps: { danger: true },
        cancelText: '取消',
        centered: true,
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
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg-layout)',
      }}
    >
      {/* 顶部标题栏 */}
      <div
        style={{
          background: 'var(--color-bg)',
          borderBottom: '1px solid var(--color-border)',
          padding: '20px 24px',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Flexbox horizontal align="center" justify="space-between">
            <Flexbox gap={12} horizontal align="center">
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'var(--lobe-color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon icon={FolderOutlined} size={20} color="#fff" />
              </div>
              <div>
                <Text strong style={{ fontSize: 22, display: 'block' }}>
                  {t('title')}
                </Text>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {workspaces.length > 0 ? `${String(workspaces.length)} 个工作区` : '创建工作区以开始'}
                </Text>
              </div>
            </Flexbox>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => handleOpenModal()}
              style={{
                borderRadius: 10,
                padding: '0 20px',
                height: 40,
              }}
            >
              {t('create')}
            </Button>
          </Flexbox>
        </div>
      </div>

      {/* 主内容区 */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px' }}>
        {fetching ? (
          <LoadingSkeleton />
        ) : workspaces.length === 0 ? (
          <Empty
            style={{ padding: '60px 0' }}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Flexbox gap={16} align="center" style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 15 }}>
                  {t('emptyDesc')}
                </Text>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleOpenModal()}
                  style={{ borderRadius: 10 }}
                >
                  {t('create')}
                </Button>
              </Flexbox>
            }
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 20,
            }}
          >
            {workspaces.map((workspace) => (
              <WorkspaceCard
                key={workspace.id}
                workspace={workspace}
                onClick={() => router.push(`/workplace/${workspace.id}`)}
                onEdit={() => handleOpenModal(workspace)}
                onDelete={() => handleDelete(workspace)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 创建/编辑弹窗 */}
      <Modal
        title={editingWorkspace ? '编辑工作区' : t('create')}
        open={modalOpen}
        onCancel={handleCloseModal}
        footer={null}
        destroyOnHidden
        centered
        width={480}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item
            name="name"
            label={t('workspaceName')}
            rules={[{ required: true, message: t('workspaceNameRequired') }]}
          >
            <LobeInput
              placeholder={t('workspaceNamePlaceholder')}
              size="large"
              style={{ borderRadius: 10 }}
            />
          </Form.Item>

          <Form.Item name="description" label={t('workspaceDescription')}>
            <TextArea
              rows={3}
              placeholder={t('workspaceDescriptionPlaceholder')}
              style={{ borderRadius: 10 }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Flexbox gap={12} horizontal justify="flex-end">
              <Button onClick={handleCloseModal} style={{ borderRadius: 10 }}>
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                style={{ borderRadius: 10, padding: '0 24px' }}
              >
                {editingWorkspace ? '保存' : t('create')}
              </Button>
            </Flexbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
