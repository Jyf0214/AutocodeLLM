'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button, Text, Empty, Modal, Form, Input as LobeInput } from '@lobehub/ui';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ImportOutlined,
  ExportOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { Table, Tag, Space, Popconfirm, Switch, message, Input as AntdInput } from 'antd';
import { useTranslations } from 'next-intl';


interface EnvVariable {
  id: string;
  key: string;
  value: string;
  description: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EnvFormData {
  key: string;
  value: string;
  description: string;
  enabled: boolean;
}

export default function EnvPage() {
  const t = useTranslations('env');
  const [envVars, setEnvVars] = useState<EnvVariable[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editingEnv, setEditingEnv] = useState<EnvVariable | null>(null);
  const [form] = Form.useForm();
  const [importForm] = Form.useForm();
  const [visibleKeys, setVisibleKeys] = useState(new Set<string>());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchEnvVars = useCallback(async () => {
    try {
      const response = await fetch('/api/env');
       
      const result: { success: boolean; data?: EnvVariable[]; error?: { message: string } } =
        await response.json();

      if (result.success) {
        setEnvVars(result.data ?? []);
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
    fetchEnvVars();
  }, [fetchEnvVars]);

  const handleOpenModal = (envVar?: EnvVariable) => {
    if (envVar) {
      setEditingEnv(envVar);
      form.setFieldsValue({
        key: envVar.key,
        value: '',
        description: envVar.description,
        enabled: envVar.enabled,
      });
    } else {
      setEditingEnv(null);
      form.resetFields();
      form.setFieldValue('enabled', true);
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingEnv(null);
    form.resetFields();
  };

  const handleSubmit = async (values: EnvFormData) => {
    setLoading(true);
    try {
      const url = '/api/env';
      const method = editingEnv ? 'PUT' : 'POST';
      const body = editingEnv
        ? { id: editingEnv.id, ...values, value: values.value || undefined }
        : values;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

       
      const result: { success: boolean; error?: { message: string } } = await response.json();

      if (result.success) {
        message.success(editingEnv ? t('updateSuccess') : t('createSuccess'));
        handleCloseModal();
        fetchEnvVars();
      } else {
        message.error(result.error?.message ?? (editingEnv ? t('updateFailed') : t('createFailed')));
      }
    } catch {
      message.error(editingEnv ? t('updateFailed') : t('createFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/env?id=${id}`, {
        method: 'DELETE',
      });

       
      const result: { success: boolean; error?: { message: string } } = await response.json();

      if (result.success) {
        message.success(t('deleteSuccess'));
        fetchEnvVars();
      } else {
        message.error(result.error?.message ?? t('deleteFailed'));
      }
    } catch {
      message.error(t('deleteFailed'));
    }
  };

  const toggleKeyVisibility = (key: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleExport = () => {
    const exportData = envVars.map((envVar) => ({
      key: envVar.key,
      value: envVar.value,
      description: envVar.description,
      enabled: envVar.enabled,
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'env-variables.json';
    a.click();
    URL.revokeObjectURL(url);
    message.success(t('exportSuccess'));
  };

  const handleImport = async (values: { jsonData: string }) => {
    setLoading(true);
    try {
       
      const parsed = JSON.parse(values.jsonData);
      if (!Array.isArray(parsed)) {
        message.error(t('importFormatError'));
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (const item of parsed as Record<string, unknown>[]) {
        if (!item.key || !item.value) {
          failCount++;
          continue;
        }

        try {
          const response = await fetch('/api/env', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              key: item.key,
              value: item.value,
              description: item.description ?? '',
              enabled: item.enabled ?? true,
            }),
          });

           
          const result: { success: boolean } = await response.json();
          if (result.success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch {
          failCount++;
        }
      }

      message.success(t('importSuccess', { success: successCount, fail: failCount }));
      setImportModalOpen(false);
      importForm.resetFields();
      fetchEnvVars();
    } catch {
      message.error(t('importFormatError'));
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        importForm.setFieldValue('jsonData', content);
      }
    };
    reader.readAsText(file);
    return false;
  };

  const columns = [
    {
      title: t('key'),
      dataIndex: 'key',
      key: 'key',
      
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: t('value'),
      dataIndex: 'value',
      key: 'value',
      
      render: (text: string, record: EnvVariable) => {
        const isVisible = visibleKeys.has(record.id);
        return (
          <Space>
            <Text code style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {isVisible ? text : '****'}
            </Text>
            <Button
              type="text"
              size="small"
              icon={isVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              onClick={() => {
                toggleKeyVisibility(record.id);
              }}
            />
          </Space>
        );
      },
    },
    {
      title: t('description'),
      dataIndex: 'description',
      key: 'description',
      
      ellipsis: true,
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
      
      render: (_: unknown, record: EnvVariable) => (
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
            cancelText={t('cancel')}
          >
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>
              {t('delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 页面标题和操作按钮 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <Text strong style={{ fontSize: 20 }}>
          {t('title')}
        </Text>
        <Space wrap>
          <Button icon={<PlusOutlined />} type="primary" onClick={() => {
            handleOpenModal();
          }}>
            {t('add')}
          </Button>
          <Button icon={<ExportOutlined />} onClick={handleExport}>
            {t('export')}
          </Button>
          <Button icon={<ImportOutlined />} onClick={() => {
            setImportModalOpen(true);
          }}>
            {t('import')}
          </Button>
        </Space>
      </div>

      <Text type="secondary">{t('description')}</Text>

      {/* 环境变量列表 */}
      {fetching ? (
        <Empty description={t('loading')} />
      ) : envVars.length === 0 ? (
        <Empty description={t('noEnvVarsDesc')} />
      ) : (
        <Table
          columns={columns}
          dataSource={envVars}
          rowKey="id"
          pagination={false}
          size="middle"
        />
      )}

      {/* 添加/编辑弹窗 */}
      <Modal
        title={editingEnv ? t('edit') : t('add')}
        open={modalOpen}
        onCancel={handleCloseModal}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="key"
            label={t('key')}
            rules={[{ required: true, message: t('keyRequired') }]}
          >
            <LobeInput placeholder={t('keyPlaceholder')} disabled={!!editingEnv} />
          </Form.Item>

          <Form.Item
            name="value"
            label={t('value')}
            rules={[{ required: !editingEnv, message: t('valueRequired') }]}
          >
            <AntdInput.Password placeholder={t('valuePlaceholder')} />
          </Form.Item>

          <Form.Item name="description" label={t('description')}>
            <AntdInput.TextArea placeholder={t('descriptionPlaceholder')} rows={2} />
          </Form.Item>

          <Form.Item name="enabled" label={t('status')} valuePropName="checked">
            <Switch checkedChildren={t('enabled')} unCheckedChildren={t('disabled')} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCloseModal}>{t('cancel')}</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingEnv ? t('update') : t('create')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 批量导入弹窗 */}
      <Modal
        title={t('import')}
        open={importModalOpen}
        onCancel={() => {
          setImportModalOpen(false);
          importForm.resetFields();
        }}
        footer={null}
        destroyOnHidden
      >
        <Form form={importForm} onFinish={handleImport} layout="vertical">
          <Form.Item
            name="jsonData"
            label={t('importData')}
            rules={[{ required: true, message: t('importDataRequired') }]}
          >
            <AntdInput.TextArea
              placeholder={t('importDataPlaceholder')}
              rows={8}
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>

          <Form.Item>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileUpload(file);
                }
              }}
            />
            <Button icon={<ImportOutlined />} onClick={() => {
              fileInputRef.current?.click();
            }}>
              {t('uploadFile')}
            </Button>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setImportModalOpen(false);
                importForm.resetFields();
              }}>
                {t('cancel')}
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {t('importConfirm')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
