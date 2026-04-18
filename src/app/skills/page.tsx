'use client';

import { useState, useEffect, useCallback } from 'react';
import { Table, Tag, Space, Button, message, Empty, Switch, Modal, Form, Input as AntdInput } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Text, Input as LobeInput } from '@lobehub/ui';
import { useTranslations } from 'next-intl';

interface Skill {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  tools: number;
  createdAt: string;
  updatedAt: string;
}

interface SkillFormData {
  name: string;
  description: string;
  enabled: boolean;
}

export default function SkillsPage() {
  const t = useTranslations('skills');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [form] = Form.useForm();

  const fetchSkills = useCallback(async () => {
    try {
      const response = await fetch('/api/skills');
      const result: { success: boolean; data?: Skill[]; error?: { message: string } } = await response.json();
      if (result.success) {
        setSkills(result.data ?? []);
      } else {
        message.error(result.error?.message ?? t('skills.fetchFailed'));
      }
    } catch {
      message.error(t('skills.fetchFailed'));
    } finally {
      setFetching(false);
    }
  }, [t]);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  const handleOpenModal = (skill?: Skill) => {
    if (skill) {
      setEditingSkill(skill);
      form.setFieldsValue({
        name: skill.name,
        description: skill.description,
        enabled: skill.enabled,
      });
    } else {
      setEditingSkill(null);
      form.resetFields();
      form.setFieldValue('enabled', true);
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingSkill(null);
    form.resetFields();
  };

  const handleSubmit = async (values: SkillFormData) => {
    setLoading(true);
    try {
      const url = '/api/skills';
      const method = editingSkill ? 'PUT' : 'POST';
      const body = editingSkill
        ? { id: editingSkill.id, ...values }
        : values;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result: { success: boolean; error?: { message: string } } = await response.json();

      if (result.success) {
        message.success(editingSkill ? t('skills.updateSuccess') : t('skills.createSuccess'));
        handleCloseModal();
        fetchSkills();
      } else {
        message.error(result.error?.message ?? t('skills.saveFailed'));
      }
    } catch {
      message.error(t('skills.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/skills?id=${id}`, { method: 'DELETE' });
      const result: { success: boolean; error?: { message: string } } = await response.json();
      if (result.success) {
        message.success(t('skills.deleteSuccess'));
        fetchSkills();
      } else {
        message.error(result.error?.message ?? t('skills.deleteFailed'));
      }
    } catch {
      message.error(t('skills.deleteFailed'));
    }
  };

  const handleToggle = async (skill: Skill) => {
    try {
      const response = await fetch('/api/skills', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: skill.id,
          enabled: !skill.enabled,
        }),
      });
      const result: { success: boolean; error?: { message: string } } = await response.json();
      if (result.success) {
        message.success(skill.enabled ? t('env.disabled') : t('env.enabled'));
        fetchSkills();
      } else {
        message.error(result.error?.message ?? t('skills.toggleSuccess'));
      }
    } catch {
      message.error(t('skills.toggleSuccess'));
    }
  };

  const columns = [
    {
      title: t('skills.name'),
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: t('skills.description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: t('skills.tools'),
      dataIndex: 'tools',
      key: 'tools',
      render: (tools: number) => <Tag>{tools}</Tag>,
    },
    {
      title: t('env.status'),
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'green' : 'default'}>{enabled ? t('env.enabled') : t('env.disabled')}</Tag>
      ),
    },
    {
      title: t('env.actions'),
      key: 'actions',
      render: (_: unknown, record: Skill) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => { handleToggle(record); }}
          >
            {record.enabled ? t('env.disabled') : t('env.enabled')}
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => { handleOpenModal(record); }}
          >
            {t('env.edit')}
          </Button>
          <Button
            type="link"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => { handleDelete(record.id); }}
          >
            {t('env.delete')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Text strong style={{ fontSize: 20, display: 'block' }}>
            {t('skills.title')}
          </Text>
          <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
            {t('skills.description')}
          </Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { handleOpenModal(); }}>
          {t('skills.addSkill')}
        </Button>
      </div>

      {fetching ? (
        <Empty description={t('env.loading')} />
      ) : skills.length === 0 ? (
        <Empty description={t('skills.noSkills')} />
      ) : (
        <Table
          columns={columns}
          dataSource={skills}
          rowKey="id"
          pagination={false}
          size="middle"
        />
      )}

      <Modal
        title={editingSkill ? t('skills.editSkill') : t('skills.addSkill')}
        open={modalOpen}
        onCancel={handleCloseModal}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="name"
            label={t('skills.name')}
            rules={[{ required: true, message: t('skills.nameRequired') }]}
          >
            <LobeInput placeholder={t('skills.namePlaceholder')} />
          </Form.Item>

          <Form.Item name="description" label={t('skills.description')}>
            <AntdInput.TextArea placeholder={t('skills.descriptionPlaceholder')} rows={3} />
          </Form.Item>

          <Form.Item name="enabled" label={t('skills.enabled')} valuePropName="checked">
            <Switch checkedChildren={t('env.enabled')} unCheckedChildren={t('env.disabled')} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCloseModal}>{t('env.cancel')}</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingSkill ? t('env.save') : t('env.add')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}