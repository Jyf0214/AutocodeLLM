'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Table, Tag, Space, Button, message, Empty, Switch, Modal, Form, Input as AntdInput } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ThunderboltOutlined } from '@ant-design/icons';
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
  const t = useTranslations();
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
        message.error(result.error?.message ?? '获取技能列表失败');
      }
    } catch {
      message.error('获取技能列表失败');
    } finally {
      setFetching(false);
    }
  }, []);

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
        message.success(editingSkill ? '更新成功' : '创建成功');
        handleCloseModal();
        fetchSkills();
      } else {
        message.error(result.error?.message ?? '保存失败');
      }
    } catch {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/skills?id=${id}`, { method: 'DELETE' });
      const result: { success: boolean; error?: { message: string } } = await response.json();
      if (result.success) {
        message.success('删除成功');
        fetchSkills();
      } else {
        message.error(result.error?.message ?? '删除失败');
      }
    } catch {
      message.error('删除失败');
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
        message.success(skill.enabled ? '已禁用' : '已启用');
        fetchSkills();
      } else {
        message.error(result.error?.message ?? '操作失败');
      }
    } catch {
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '工具数量',
      dataIndex: 'tools',
      key: 'tools',
      render: (tools: number) => <Tag>{tools} 个</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'green' : 'default'}>{enabled ? '已启用' : '已禁用'}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: Skill) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => { handleToggle(record); }}
          >
            {record.enabled ? '禁用' : '启用'}
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => { handleOpenModal(record); }}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => { handleDelete(record.id); }}
          >
            删除
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
            LLM Skills 管理
          </Text>
          <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
            配置和管理 LLM Skills，扩展 AI 能力
          </Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { handleOpenModal(); }}>
          添加 Skill
        </Button>
      </div>

      {fetching ? (
        <Empty description="加载中..." />
      ) : skills.length === 0 ? (
        <Empty description="暂无技能，请添加" />
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
        title={editingSkill ? '编辑 Skill' : '添加 Skill'}
        open={modalOpen}
        onCancel={handleCloseModal}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <LobeInput placeholder="例如：代码解释器" />
          </Form.Item>

          <Form.Item name="description" label="描述">
            <AntdInput.TextArea placeholder="描述这个技能的功能..." rows={3} />
          </Form.Item>

          <Form.Item name="enabled" label="启用" valuePropName="checked">
            <Switch checkedChildren="已启用" unCheckedChildren="已禁用" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCloseModal}>取消</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingSkill ? '保存' : '添加'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}