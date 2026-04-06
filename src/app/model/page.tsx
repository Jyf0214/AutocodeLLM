/**
 * 模型管理页
 *
 * 职责：管理具体 AI 模型（如 gpt-4, claude-3-sonnet 等）
 * - 从已配置的提供商中选择
 * - 添加/编辑/删除模型
 * - 快速批量探测并添加模型
 */
'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Text, Modal, Form, Input } from '@lobehub/ui';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ApiOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import {
  Table,
  Tag,
  Space,
  Popconfirm,
  Switch,
  message,
  Input as AntdInput,
  Checkbox,
  Select,
  Spin,
  Alert,
  Divider,
  Empty,
} from 'antd';
import { useTranslations } from 'next-intl';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import AppLayout from '@/components/layout/AppLayout';
import type { ModelConfig } from '@/lib/api/model-types';
import { getProviderIcon, getProviderOptions } from '@/lib/model-icons';
import type { DiscoveredModel, DiscoverResponse } from '@/app/api/models/discover/route';

interface ModelFormData {
  name: string;
  provider: string;
  apiKey: string;
  baseUrl?: string;
  enabled: boolean;
}

interface QuickAddFormData {
  baseUrl: string;
  apiKey: string;
}

interface ProviderOption {
  id: string;
  name: string;
  baseUrl: string;
  enabled: boolean;
}

export default function ModelPage() {
  const t = useTranslations('models');
  const router = useRouter();
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelConfig | null>(null);
  const [form] = Form.useForm();
  const [quickAddForm] = Form.useForm();

  // 已配置的提供商列表（用于选择）
  const [configuredProviders, setConfiguredProviders] = useState<ProviderOption[]>([]);

  // 快速添加相关状态
  const [discovering, setDiscovering] = useState(false);
  const [discoveredModels, setDiscoveredModels] = useState<DiscoveredModel[]>([]);
  const [selectedModelIds, setSelectedModelIds] = useState(() => new Set<string>());
  const [addingModels, setAddingModels] = useState(false);
  const [discoverError, setDiscoverError] = useState<string | null>(null);

  const providerOptions = useMemo(() => getProviderOptions(), []);

  // 加载模型列表和已配置提供商
  const fetchModels = useCallback(async () => {
    try {
      const [modelsRes, providersRes] = await Promise.all([
        fetch('/api/models'),
        fetch('/api/providers'),
      ]);

      const modelsData: { success: boolean; data?: ModelConfig[]; error?: { message: string } } = await modelsRes.json();
      const providersData: { success: boolean; data?: { id: string; name: string; baseUrl: string; enabled: boolean }[] } = await providersRes.json();

      if (modelsData.success) {
        setModels(modelsData.data ?? []);
      } else {
        message.error(modelsData.error?.message ?? t('fetchFailed'));
      }

      if (providersData.success && providersData.data) {
        setConfiguredProviders(providersData.data.filter((p) => p.enabled));
      }
    } catch {
      message.error(t('fetchFailed'));
    } finally {
      setFetching(false);
    }
  }, [t]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const handleOpenModal = (model?: ModelConfig) => {
    if (model) {
      setEditingModel(model);
      form.setFieldsValue({
        name: model.name,
        provider: model.provider,
        apiKey: model.apiKey,
        baseUrl: model.baseUrl,
        enabled: model.enabled,
      });
    } else {
      setEditingModel(null);
      form.resetFields();
      form.setFieldValue('enabled', true);
      // 如果有已配置的提供商，自动选择第一个
      if (configuredProviders.length > 0) {
        form.setFieldValue('provider', configuredProviders[0]?.name ?? '');
        form.setFieldValue('baseUrl', configuredProviders[0]?.baseUrl ?? '');
      }
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingModel(null);
    form.resetFields();
  };

  const handleSubmit = async (values: ModelFormData) => {
    setLoading(true);
    try {
      const url = '/api/models';
      const method = editingModel ? 'PUT' : 'POST';
      const body = editingModel ? { id: editingModel.id, ...values } : values;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result: { success: boolean; error?: { message: string } } = await response.json();

      if (result.success) {
        message.success(editingModel ? t('updateSuccess') : t('createSuccess'));
        handleCloseModal();
        fetchModels();
      } else {
        message.error(result.error?.message ?? (editingModel ? t('updateFailed') : t('createFailed')));
      }
    } catch {
      message.error(editingModel ? t('updateFailed') : t('createFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/models?id=${id}`, {
        method: 'DELETE',
      });

      const result: { success: boolean; error?: { message: string } } = await response.json();

      if (result.success) {
        message.success(t('deleteSuccess'));
        fetchModels();
      } else {
        message.error(result.error?.message ?? t('deleteFailed'));
      }
    } catch {
      message.error(t('deleteFailed'));
    }
  };

  const handleOpenQuickAdd = () => {
    setQuickAddOpen(true);
    setDiscoveredModels([]);
    setSelectedModelIds(new Set());
    setDiscoverError(null);
    quickAddForm.resetFields();
    // 默认使用第一个已配置提供商的 base URL
    if (configuredProviders.length > 0) {
      quickAddForm.setFieldValue('baseUrl', configuredProviders[0]?.baseUrl ?? 'https://api.openai.com/v1');
    } else {
      quickAddForm.setFieldValue('baseUrl', 'https://api.openai.com/v1');
    }
  };

  const handleCloseQuickAdd = () => {
    setQuickAddOpen(false);
    setDiscoveredModels([]);
    setSelectedModelIds(new Set());
    setDiscoverError(null);
    quickAddForm.resetFields();
  };

  const handleDiscover = async (values: QuickAddFormData) => {
    setDiscovering(true);
    setDiscoverError(null);
    setDiscoveredModels([]);
    setSelectedModelIds(new Set());

    try {
      const response = await fetch('/api/models/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const result = (await response.json()) as DiscoverResponse;

      if (result.success && result.data) {
        setDiscoveredModels(result.data);
        message.success(t('discoverSuccess').replace('{count}', String(result.data.length)));
      } else {
        const errorMsg = result.error?.message ?? t('discoverFailed').replace('{message}', '');
        setDiscoverError(errorMsg);
        message.error(errorMsg);
      }
    } catch (error) {
      const errorMsg = t('discoverFailed').replace(
        '{message}',
        error instanceof Error ? error.message : '未知错误',
      );
      setDiscoverError(errorMsg);
      message.error(errorMsg);
    } finally {
      setDiscovering(false);
    }
  };

  const handleSelectAll = (e: CheckboxChangeEvent) => {
    if (e.target.checked) {
      setSelectedModelIds(new Set(discoveredModels.map((m) => m.id)));
    } else {
      setSelectedModelIds(new Set());
    }
  };

  const handleSelectModel = (id: string, checked: boolean) => {
    const newSet = new Set(selectedModelIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedModelIds(newSet);
  };

  const handleAddSelected = async () => {
    if (selectedModelIds.size === 0) {
      message.warning('请选择要添加的模型');
      return;
    }

    const quickAddValues = quickAddForm.getFieldsValue() as QuickAddFormData;
    const selectedModels = discoveredModels.filter((m) => selectedModelIds.has(m.id));

    setAddingModels(true);
    try {
      const response = await fetch('/api/models/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          models: selectedModels.map((m) => ({
            name: m.name,
            provider: m.owner ?? 'Unknown',
            apiKey: quickAddValues.apiKey,
            baseUrl: quickAddValues.baseUrl,
          })),
        }),
      });

      const result = await response.json();

      if (result.success) {
        const { added, skipped } = result.data;
        message.success(
          t('bulkAddSuccess')
            .replace('{added}', String(added))
            .replace('{skipped}', String(skipped)),
        );
        handleCloseQuickAdd();
        fetchModels();
      } else {
        message.error(result.error?.message ?? t('bulkAddFailed'));
      }
    } catch {
      message.error(t('bulkAddFailed'));
    } finally {
      setAddingModels(false);
    }
  };

  const renderProviderIcon = useCallback(
    (providerName: string) => {
      const { icon: Icon, label } = getProviderIcon(providerName);
      return (
        <Space>
          <Icon style={{ fontSize: 20 }} />
          <span>{label}</span>
        </Space>
      );
    },
    [],
  );

  const columns = [
    {
      title: t('modelName'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('provider'),
      dataIndex: 'provider',
      key: 'provider',
      render: (provider: string) => renderProviderIcon(provider),
    },
    {
      title: t('status'),
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'green' : 'default'}>{enabled ? t('enabled') : t('disabled')}</Tag>
      ),
    },
    {
      title: t('actions'),
      key: 'actions',
      render: (_: unknown, record: ModelConfig) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              handleOpenModal(record);
            }}
          >
            {t('edit')}
          </Button>
          <Popconfirm
            title={t('confirmDelete')}
            onConfirm={() => {
              handleDelete(record.id);
            }}
            okText={t('delete')}
            cancelText="取消"
          >
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>
              {t('delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const ProviderSelectOption = useMemo(
    () =>
      providerOptions.map((opt) => ({
        value: opt.value,
        label: (
          <Space>
            <opt.icon style={{ fontSize: 16 }} />
            <span>{opt.label}</span>
          </Space>
        ),
      })),
    [providerOptions],
  );

  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* 页面标题和操作按钮 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong style={{ fontSize: 20 }}>
            {t('title')}
          </Text>
          <Space>
            <Button icon={<SearchOutlined />} onClick={handleOpenQuickAdd}>
              {t('quickAdd')}
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                if (configuredProviders.length === 0) {
                  message.warning('请先前往「API 提供商」页面配置提供商');
                  router.push('/provider');
                  return;
                }
                handleOpenModal();
              }}
            >
              {t('addModel')}
            </Button>
          </Space>
        </div>

        <Text type="secondary">
          {configuredProviders.length === 0
            ? '暂无已配置的提供商，请先前往「API 提供商」页面配置后再添加模型。'
            : '管理可用的 AI 模型及其对应的提供商配置。'}
        </Text>

        {/* 模型列表 */}
        {fetching ? (
          <Empty description="加载中..." />
        ) : models.length === 0 ? (
          configuredProviders.length === 0 ? (
            <Empty
              description="暂无已配置的提供商"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button
                type="primary"
                onClick={() => {
                  router.push('/provider');
                }}
              >
                去配置提供商
              </Button>
            </Empty>
          ) : (
            <Empty
              description={t('noModelsDesc')}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button type="primary" icon={<PlusOutlined />} onClick={() => { handleOpenModal(); }}>
                添加第一个模型
              </Button>
            </Empty>
          )
        ) : (
          <Table
            columns={columns}
            dataSource={models}
            rowKey="id"
            pagination={false}
            size="middle"
          />
        )}
      </div>

      {/* 添加/编辑模型弹窗 */}
      <Modal
        title={editingModel ? t('editModel') : t('addModel')}
        open={modalOpen}
        onCancel={handleCloseModal}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="provider"
            label={t('provider')}
            rules={[{ required: true, message: t('providerRequired') }]}
          >
            <Select
              placeholder={t('selectProvider')}
              showSearch={{ optionFilterProp: 'label' }}
              options={ProviderSelectOption}
              onChange={(value: string) => {
                const selected = configuredProviders.find((p) => p.name === value);
                if (selected) {
                  form.setFieldValue('baseUrl', selected.baseUrl);
                }
              }}
            />
          </Form.Item>

          <Form.Item
            name="name"
            label={t('modelName')}
            rules={[{ required: true, message: t('modelNameRequired') }]}
          >
            <Input placeholder={t('modelNamePlaceholder')} />
          </Form.Item>

          <Form.Item
            name="apiKey"
            label={t('apiKey')}
            rules={[{ required: true, message: t('apiKeyRequired') }]}
          >
            <AntdInput.Password placeholder={t('apiKeyPlaceholder')} />
          </Form.Item>

          <Form.Item name="baseUrl" label={t('baseUrl')}>
            <Input placeholder={t('baseUrlPlaceholder')} />
          </Form.Item>

          <Form.Item name="enabled" label={t('status')} valuePropName="checked">
            <Switch checkedChildren={t('enabled')} unCheckedChildren={t('disabled')} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCloseModal}>取消</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingModel ? t('updateSuccess') : t('createSuccess')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 快速添加模型弹窗 */}
      <Modal
        title={t('quickAddTitle')}
        open={quickAddOpen}
        onCancel={handleCloseQuickAdd}
        footer={null}
        width={720}
        destroyOnHidden
      >
        <Text type="secondary">通过 OpenAI 兼容接口自动探测并批量添加模型。</Text>
        <Divider />

        <Form form={quickAddForm} onFinish={handleDiscover} layout="vertical">
          <Form.Item
            name="baseUrl"
            label={t('apiBaseUrl')}
            rules={[{ required: true, message: t('apiBaseUrlRequired') }]}
          >
            <Input
              placeholder={t('apiBaseUrlPlaceholder')}
              prefix={<ApiOutlined />}
            />
          </Form.Item>

          <Form.Item
            name="apiKey"
            label={t('apiKeyDiscover')}
            rules={[{ required: true, message: t('apiKeyDiscoverRequired') }]}
          >
            <AntdInput.Password placeholder={t('apiKeyDiscoverPlaceholder')} />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              htmlType="submit"
              loading={discovering}
              block
            >
              {discovering ? t('discoverLoading') : t('discover')}
            </Button>
          </Form.Item>
        </Form>

        {discoverError && (
          <Alert title={discoverError} type="error" showIcon style={{ marginBottom: 16 }} />
        )}

        {discoveredModels.length > 0 && (
          <>
            <Divider>{t('selectModels')}</Divider>

            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              <Checkbox
                indeterminate={
                  selectedModelIds.size > 0 && selectedModelIds.size < discoveredModels.length
                }
                checked={
                  selectedModelIds.size === discoveredModels.length && discoveredModels.length > 0
                }
                onChange={handleSelectAll}
              >
                {t('selectAll')}
              </Checkbox>

              <Divider style={{ margin: '8px 0' }} />

              {discoveredModels.map((model) => {
                const { icon: Icon } = getProviderIcon(model.owner ?? '');
                return (
                  <div
                    key={model.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '8px 0',
                    }}
                  >
                    <Checkbox
                      checked={selectedModelIds.has(model.id)}
                      onChange={(e) => {
                        handleSelectModel(model.id, e.target.checked);
                      }}
                    />
                    <Icon style={{ fontSize: 18, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {model.name}
                      </Text>
                      {model.owner && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {model.owner}
                        </Text>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <Divider />

            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={handleAddSelected}
              loading={addingModels}
              disabled={selectedModelIds.size === 0}
              block
            >
              {addingModels
                ? t('addingModels')
                : t('addSelected').replace('{count}', String(selectedModelIds.size))}
            </Button>
          </>
        )}

        {discoveredModels.length === 0 && !discovering && !discoverError && (
          <Empty description={t('noModelsFound')} style={{ marginTop: 24 }} />
        )}

        {discovering && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}
