'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { message, Modal, Form } from 'antd';
import {
  Button,
  Text,
  Flexbox,
  Icon,
  Avatar,
  Skeleton,
  TextArea,
} from '@lobehub/ui';
import {
  PlusOutlined,
  FolderOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowRightOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { WorkspaceListItem } from '@/lib/api/workspace-types';
import { Input } from 'antd';

/**
 * 工作区卡片属性
 */
interface WorkspaceCardProps {
  workspace: WorkspaceListItem;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * 工作区卡片组件
 * 展示单个工作区的信息和操作按钮
 */
function WorkspaceCard({
  workspace,
  onClick,
  onEdit,
  onDelete,
}: WorkspaceCardProps) {
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
        border: `1px solid ${
          hovered ? 'var(--lobe-color-primary)' : 'var(--color-border)'
        }`,
        padding: 20,
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered
          ? '0 8px 24px rgba(0,0,0,0.12)'
          : '0 2px 8px rgba(0,0,0,0.04)',
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
            gap: 8,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Icon
            icon={EditOutlined}
            size={18}
            onClick={onEdit}
            style={{
              padding: 6,
              borderRadius: 6,
              background: 'var(--color-fill-quaternary)',
              cursor: 'pointer',
              color: 'var(--lobe-color-primary)',
            }}
          />
          <Icon
            icon={DeleteOutlined}
            size={18}
            onClick={onDelete}
            style={{
              padding: 6,
              borderRadius: 6,
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
            hovered ? 'var(--lobe-color-primary)' : 'var(--color-fill-quaternary)'
          }
          shape="square"
          style={{
            borderRadius: 12,
            transition: 'all 0.25s ease',
          }}
        />
        <div
          style={{
            flex: 1,
            minWidth: 0,
            paddingRight: hovered ? 60 : 0,
          }}
        >
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
            {workspace.description || t('noDescription')}
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
          <Icon
            icon={ClockCircleOutlined}
            size={12}
            color="var(--color-text-tertiary)"
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {createdDate}
          </Text>
        </Flexbox>
        <Flexbox
          gap={4}
          horizontal
          align="center"
          style={{ marginLeft: 'auto' }}
        >
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t('enter')}
          </Text>
          <Icon
            icon={ArrowRightOutlined}
            size={12}
            color="var(--lobe-color-primary)"
          />
        </Flexbox>
      </Flexbox>
    </div>
  );
}

/**
 * 加载骨架屏组件
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
              <div
                style={{
                  width: '60%',
                  height: 20,
                  marginBottom: 8,
                  background: 'var(--color-fill-quaternary)',
                  borderRadius: 4,
                }}
              />
              <div
                style={{
                  width: '80%',
                  height: 16,
                  background: 'var(--color-fill-quaternary)',
                  borderRadius: 4,
                }}
              />
            </div>
          </Flexbox>
          <div
            style={{
              marginTop: 16,
              paddingTop: 14,
              borderTop: '1px solid var(--color-border)',
            }}
          >
            <div
              style={{
                width: 80,
                height: 14,
                background: 'var(--color-fill-quaternary)',
                borderRadius: 4,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 错误状态组件
 */
interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

function ErrorState({ error, onRetry }: ErrorStateProps) {
  const t = useTranslations('workplace');
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 400,
      }}
    >
      <Modal
        title={t('loadFailed')}
        open={true}
        onCancel={() => {}}
        footer={
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={onRetry}
            style={{ borderRadius: 10 }}
          >
            {t('retry')}
          </Button>
        }
      >
        <Text type="secondary">{error}</Text>
      </Modal>
    </div>
  );
}

/**
 * 空状态组件
 */
interface EmptyStateProps {
  onCreate: () => void;
}

function EmptyState({ onCreate }: EmptyStateProps) {
  const t = useTranslations('workplace');
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 400,
        gap: 24,
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          background:
            'linear-gradient(135deg, var(--lobe-color-primary), var(--lobe-color-violet))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <FolderOutlined style={{ fontSize: 40, color: '#fff' }} />
      </div>
      <Flexbox gap={8} align="center">
        <Text
          strong
          style={{
            fontSize: 20,
            background:
              'linear-gradient(135deg, var(--lobe-color-primary), var(--lobe-color-violet))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {t('noWorkspace')}
        </Text>
        <Text type="secondary" style={{ fontSize: 14 }}>
          {t('startByCreatingFirst')}
        </Text>
      </Flexbox>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={onCreate}
        size="large"
        style={{
          borderRadius: 12,
          padding: '0 32px',
          height: 40,
        }}
      >
        {t('create')}
      </Button>
    </div>
  );
}

/**
 * 工作区列表页面组件
 */
export default function WorkplacePage() {
  const t = useTranslations('workplace');
  const tp = useTranslations('providers');
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<WorkspaceListItem[]>([]);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] =
    useState<WorkspaceListItem | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  /**
   * 获取工作区列表
   */
  const fetchWorkspaces = useCallback(async () => {
    setFetching(true);
    setError(null);
    try {
      const response = await fetch('/api/workspaces');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${String(response.status)}`);
      }
      const result: {
        success: boolean;
        data?: WorkspaceListItem[];
        error?: { message: string };
      } = await response.json();
      if (result.success) {
        setWorkspaces(result.data ?? []);
      } else {
        const errorMsg = result.error?.message ?? t('fetchFailed');
        setError(errorMsg);
        message.error(errorMsg);
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : t('fetchFailed');
      setError(errorMsg);
      message.error(errorMsg);
      console.error('获取工作区列表失败:', err);
    } finally {
      setFetching(false);
    }
  }, [t]);

  /**
   * 初始化加载
   */
  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  /**
   * 打开创建/编辑弹窗
   */
  const handleOpenModal = (workspace?: WorkspaceListItem) => {
    if (workspace) {
      setEditingWorkspace(workspace);
      form.setFieldsValue({
        name: workspace.name,
        description: workspace.description,
      });
    } else {
      setEditingWorkspace(null);
      form.resetFields();
    }
    setModalOpen(true);
  };

  /**
   * 关闭弹窗
   */
  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingWorkspace(null);
    form.resetFields();
  };

  /**
   * 提交表单
   */
  const handleSubmit = async (values: {
    name: string;
    description?: string;
  }) => {
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
        message.success(editingWorkspace ? t('updateSuccess') : t('createSuccess'));
        handleCloseModal();
        fetchWorkspaces();
        if (!editingWorkspace) {
          router.push(`/workplace/${result.data.id}`);
        }
      } else {
        message.error(
          result.error?.message ??
            (editingWorkspace ? t('updateFailed') : t('createFailed')),
        );
      }
    } catch {
      message.error(editingWorkspace ? t('updateFailed') : t('createFailed'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * 删除工作区
   */
  const handleDelete = useCallback(
    (workspace: WorkspaceListItem) => {
      Modal.confirm({
        title: t('confirmDelete'),
        content: t('deleteWorkspaceConfirm', { name: workspace.name }),
        okText: t('delete'),
        okButtonProps: {
          danger: true,
        },
        cancelText: t('cancel'),
        centered: true,
        onOk: async () => {
          try {
            const response = await fetch(
              `/api/workspaces/${workspace.id}`,
              {
                method: 'DELETE',
              },
            );
            const result: {
              success: boolean;
              error?: { message: string };
            } = await response.json();
            if (result.success) {
              message.success(t('deleteSuccess'));
              fetchWorkspaces();
            } else {
              message.error(result.error?.message ?? t('deleteFailed'));
            }
          } catch {
            message.error(t('deleteFailed'));
          }
        },
      });
    },
    [fetchWorkspaces],
  );

  /**
   * 过滤后的工作区列表（支持搜索）
   */
  const filteredWorkspaces = useMemo(() => {
    if (!searchText) return workspaces;
    return workspaces.filter(
      (ws) =>
        ws.name.toLowerCase().includes(searchText.toLowerCase()) ||
        ws.description.toLowerCase().includes(searchText.toLowerCase()),
    );
  }, [workspaces, searchText]);

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
                  {t('titleShort')}
                </Text>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {workspaces.length > 0
                    ? t('workspaceCount', { count: String(workspaces.length) })
                    : t('startByCreating')}
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
              {t('new')}
            </Button>
          </Flexbox>
        </div>
      </div>

      {/* 主内容区 */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px' }}>
        {error ? (
          <ErrorState error={error} onRetry={fetchWorkspaces} />
        ) : fetching ? (
          <LoadingSkeleton />
        ) : workspaces.length === 0 ? (
          <EmptyState onCreate={() => handleOpenModal()} />
        ) : (
          <>
            {/* 搜索框 */}
            <div
              style={{
                marginBottom: 24,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <Input
                placeholder={t('search')}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                prefix={<SearchOutlined />}
                style={{
                  maxWidth: 320,
                  borderRadius: 10,
                }}
              />
            </div>

            {/* 工作区网格 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(auto-fill, minmax(340px, 1fr))`,
                gap: 20,
              }}
            >
              {filteredWorkspaces.map((workspace) => (
                <WorkspaceCard
                  key={workspace.id}
                  workspace={workspace}
                  onClick={() =>
                    router.push(`/workplace/${workspace.id}`)
                  }
                  onEdit={() => handleOpenModal(workspace)}
                  onDelete={() => handleDelete(workspace)}
                />
              ))}
            </div>

            {filteredWorkspaces.length === 0 && searchText && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '60px 0',
                }}
              >
                <Text type="secondary">{t('noMatchFound')}</Text>
              </div>
            )}
          </>
        )}
      </div>

      {/* 创建/编辑弹窗 */}
      <Modal
        title={editingWorkspace ? t('edit') : t('createNew')}
        open={modalOpen}
        onCancel={handleCloseModal}
        footer={null}
        destroyOnHidden
        centered
        width={480}
      >
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          style={{ marginTop: 20 }}
        >
          <Form.Item
            name="name"
            label={t('name')}
            rules={[
              { required: true, message: t('nameRequired') },
              {
                max: 50,
                message: t('nameMaxLength'),
              },
            ]}
          >
            <Input
              placeholder={t('namePlaceholder')}
              size="large"
              style={{ borderRadius: 10 }}
              allowClear
            />
          </Form.Item>
          <Form.Item name="description" label={t('description')}>
            <TextArea
              rows={3}
              placeholder={t('descriptionPlaceholder')}
              style={{ borderRadius: 10 }}
              showCount
              maxLength={200}
            />
          </Form.Item>
          <Form.Item
            style={{
              marginBottom: 0,
              marginTop: 24,
            }}
          >
            <Flexbox gap={12} horizontal justify="flex-end">
              <Button
                onClick={handleCloseModal}
                style={{ borderRadius: 10 }}
              >
                {t('cancel')}
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                style={{
                  borderRadius: 10,
                  padding: '0 24px',
                }}
              >
                {editingWorkspace ? t('save') : t('createBtn')}
              </Button>
            </Flexbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
