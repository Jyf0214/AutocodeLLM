'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Table, Switch, Tag, Button, Modal, Form, Input, Select, Space, Empty, message } from 'antd';
import { PlusOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { Flexbox, Text } from '@lobehub/ui';
import { useTranslations } from 'next-intl';
import DiscordChannelPicker from './DiscordChannelPicker';
import type { ApiResponse, ChannelDetail, CreateChannelRequest } from '@/lib/api/channel-types';

interface ChannelListProps {
  workspaceId: string;
}

/** 频道类型映射 */
const CHANNEL_TYPE_OPTIONS = [
  { label: 'Text', value: 'TEXT' },
  { label: 'Voice', value: 'VOICE' },
  { label: 'Announcement', value: 'ANNOUNCEMENT' },
];

export default function ChannelList({ workspaceId }: ChannelListProps) {
  const t = useTranslations('channel');

  const [channels, setChannels] = useState<ChannelDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [form] = Form.useForm();

  /** 选中的 Discord 频道信息 */
  const [pickedGuildId, setPickedGuildId] = useState('');
  const [pickedChannelId, setPickedChannelId] = useState('');
  const [pickedChannelName, setPickedChannelName] = useState('');

  /** 获取频道列表 */
  const fetchChannels = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/channels?workspaceId=${encodeURIComponent(workspaceId)}`);
      if (!response.ok) {
        message.error(t('fetchFailed'));
        return;
      }
      const result = (await response.json()) as ApiResponse<ChannelDetail[]>;
      if (result.success) {
        setChannels(result.data ?? []);
      } else {
        message.error(result.error?.message ?? t('fetchFailed'));
      }
    } catch {
      message.error(t('fetchFailed'));
    } finally {
      setLoading(false);
    }
  }, [workspaceId, t]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  /** 切换频道启用状态 */
  const handleToggleEnabled = async (channelId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/channels/${channelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      if (!response.ok) {
        message.error(t('updateFailed'));
        return;
      }
      const result = (await response.json()) as ApiResponse<ChannelDetail>;
      if (result.success) {
        message.success(enabled ? t('enabled') : t('disabled'));
        await fetchChannels();
      } else {
        message.error(result.error?.message ?? t('updateFailed'));
      }
    } catch {
      message.error(t('updateFailed'));
    }
  };

  /** 删除频道 */
  const handleDelete = async (channelId: string) => {
    Modal.confirm({
      title: t('deleteChannel'),
      content: t('confirmDelete'),
      okType: 'danger',
      onOk: async () => {
        try {
          const response = await fetch(`/api/channels/${channelId}`, { method: 'DELETE' });
          if (!response.ok) {
            message.error(t('deleteFailed'));
            return;
          }
          const result = (await response.json()) as ApiResponse<{ deleted: boolean }>;
          if (result.success) {
            message.success(t('deleteSuccess'));
            await fetchChannels();
          } else {
            message.error(result.error?.message ?? t('deleteFailed'));
          }
        } catch {
          message.error(t('deleteFailed'));
        }
      },
    });
  };

  /** 打开添加频道弹窗 */
  const handleOpenModal = () => {
    form.resetFields();
    setPickedGuildId('');
    setPickedChannelId('');
    setPickedChannelName('');
    setModalOpen(true);
  };

  /** 提交创建频道 */
  const handleCreate = async (values: { name: string; type: string }) => {
    if (!pickedGuildId || !pickedChannelId) {
      message.error(t('selectGuild') + ' / ' + t('selectChannel'));
      return;
    }
    setConfirmLoading(true);
    try {
      const body: CreateChannelRequest = {
        workspaceId,
        name: values.name,
        discordGuildId: pickedGuildId,
        discordChannelId: pickedChannelId,
        type: values.type as 'TEXT' | 'VOICE' | 'ANNOUNCEMENT',
      };
      const response = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        message.error(t('createFailed'));
        return;
      }
      const result = (await response.json()) as ApiResponse<ChannelDetail>;
      if (result.success) {
        message.success(t('addChannel'));
        setModalOpen(false);
        await fetchChannels();
      } else {
        message.error(result.error?.message ?? t('createFailed'));
      }
    } catch {
      message.error(t('createFailed'));
    } finally {
      setConfirmLoading(false);
    }
  };

  /** Discord 频道选择回调 */
  const handleDiscordPick = (guildId: string, channelId: string, channelName: string) => {
    setPickedGuildId(guildId);
    setPickedChannelId(channelId);
    setPickedChannelName(channelName);
  };

  /** 频道类型显示 */
  const renderChannelType = (type: string) => {
    switch (type) {
      case 'TEXT':
        return t('typeText');
      case 'VOICE':
        return t('typeVoice');
      case 'ANNOUNCEMENT':
        return t('typeAnnouncement');
      default:
        return type;
    }
  };

  const columns = [
    {
      title: t('channelName'),
      dataIndex: 'name',
      key: 'name',
      width: 160,
      ellipsis: true,
    },
    {
      title: t('discordGuild'),
      dataIndex: 'discordGuildId',
      key: 'discordGuildId',
      width: 140,
      ellipsis: true,
    },
    {
      title: t('discordChannel'),
      dataIndex: 'discordChannelId',
      key: 'discordChannelId',
      width: 140,
      ellipsis: true,
    },
    {
      title: t('channelType'),
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => <Tag>{renderChannelType(type)}</Tag>,
    },
    {
      title: t('enabled'),
      dataIndex: 'enabled',
      key: 'enabled',
      width: 80,
      render: (enabled: boolean, record: ChannelDetail) => (
        <Switch
          size="small"
          checked={enabled}
          onChange={(checked) => handleToggleEnabled(record.id, checked)}
        />
      ),
    },
    {
      title: t('messageCount').replace('{count}', '').trim() || 'Messages',
      key: 'messageCount',
      width: 100,
      render: (_: unknown, record: ChannelDetail) => (
        <Text type="secondary">{t('messageCount', { count: record._count?.messages ?? 0 })}</Text>
      ),
    },
    {
      title: ' ',
      key: 'actions',
      width: 60,
      render: (_: unknown, record: ChannelDetail) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => handleDelete(record.id)}
        />
      ),
    },
  ];

  return (
    <>
      <Card
        title={t('title')}
        size="small"
        extra={
          <Space>
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined />}
              onClick={fetchChannels}
              loading={loading}
            />
            <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleOpenModal}>
              {t('addChannel')}
            </Button>
          </Space>
        }
      >
        {channels.length === 0 && !loading ? (
          <Empty description={t('noChannels')} image={Empty.PRESENTED_IMAGE_SIMPLE}>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
              {t('noChannelsDesc')}
            </Text>
          </Empty>
        ) : (
          <Table
            columns={columns}
            dataSource={channels}
            rowKey="id"
            loading={loading}
            pagination={false}
            size="small"
          />
        )}
      </Card>

      {/* 添加频道弹窗 */}
      <Modal
        title={t('addChannel')}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        confirmLoading={confirmLoading}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form form={form} onFinish={handleCreate} layout="vertical" initialValues={{ type: 'TEXT' }}>
          <Form.Item
            name="name"
            label={t('channelName')}
            rules={[{ required: true, message: t('channelName') + ' required' }]}
          >
            <Input placeholder={t('channelName')} />
          </Form.Item>

          <Form.Item label={`${t('discordGuild')} / ${t('discordChannel')}`}>
            <DiscordChannelPicker onSelect={handleDiscordPick} />
            {pickedChannelName && (
              <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                {t('bindChannel')}: #{pickedChannelName}
              </Text>
            )}
          </Form.Item>

          <Form.Item name="type" label={t('channelType')}>
            <Select options={CHANNEL_TYPE_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
