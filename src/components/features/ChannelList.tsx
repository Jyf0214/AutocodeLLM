'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { message as antMessage } from 'antd';
import { Button, Text, Flexbox } from '@lobehub/ui';
import { Card, Table, Switch, Modal, Input, Select, Tag, Empty, Skeleton } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  DeleteOutlined,
  ApiOutlined,
  ReloadOutlined,
} from '@ant-design/icons';

interface ChannelItem {
  id: string;
  name: string;
  discordGuildId: string;
  discordChannelId: string;
  type: string;
  enabled: boolean;
  lastSyncedAt: string | null;
  createdAt: string;
  workspace: { id: string; name: string };
  _count: { messages: number };
}

interface GuildInfo {
  id: string;
  name: string;
  icon: string | null;
}

interface ChannelInfo {
  id: string;
  name: string;
  type: number;
}

interface ChannelListProps {
  workspaceId: string;
  onChannelClick?: (channelId: string, channelName: string) => void;
}

/** 频道列表组件 */
export default function ChannelList({ workspaceId, onChannelClick }: ChannelListProps) {
  const t = useTranslations('common');
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // 添加频道表单状态
  const [formName, setFormName] = useState('');
  const [formGuildId, setFormGuildId] = useState('');
  const [formChannelId, setFormChannelId] = useState('');
  const [formType, setFormType] = useState('TEXT');

  // Discord 服务器和频道数据
  const [guilds, setGuilds] = useState<GuildInfo[]>([]);
  const [guildChannels, setGuildChannels] = useState<ChannelInfo[]>([]);
  const [loadingGuilds, setLoadingGuilds] = useState(false);
  const [loadingChannels, setLoadingChannels] = useState(false);

  /** 获取频道列表 */
  const fetchChannels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/channels?workspaceId=${workspaceId}`);
      const result = await res.json();
      if (result.success && result.data) {
        setChannels(result.data as ChannelItem[]);
      }
    } catch {
      antMessage.error('获取频道列表失败');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  /** 获取 Discord 服务器列表 */
  const fetchGuilds = useCallback(async () => {
    setLoadingGuilds(true);
    try {
      const res = await fetch('/api/discord/status');
      const result = await res.json();
      if (result.success && result.data?.guildList) {
        setGuilds(result.data.guildList as GuildInfo[]);
      }
    } catch {
      // 静默处理
    } finally {
      setLoadingGuilds(false);
    }
  }, []);

  /** 获取指定服务器的频道列表 */
  const fetchGuildChannels = useCallback(async (guildId: string) => {
    setLoadingChannels(true);
    setFormChannelId('');
    setGuildChannels([]);
    try {
      const res = await fetch(`/api/discord/guilds/${guildId}/channels`);
      const result = await res.json();
      if (result.success && result.data) {
        setGuildChannels(result.data as ChannelInfo[]);
      }
    } catch {
      // 静默处理
    } finally {
      setLoadingChannels(false);
    }
  }, []);

  /** 打开添加频道弹窗 */
  const openModal = useCallback(() => {
    setFormName('');
    setFormGuildId('');
    setFormChannelId('');
    setFormType('TEXT');
    setGuildChannels([]);
    setModalOpen(true);
    void fetchGuilds();
  }, [fetchGuilds]);

  /** 提交创建频道 */
  const handleCreate = useCallback(async () => {
    if (!formName.trim()) {
      antMessage.warning(t('channel.channelName'));
      return;
    }
    if (!formGuildId) {
      antMessage.warning(t('channel.selectGuild'));
      return;
    }
    if (!formChannelId) {
      antMessage.warning(t('channel.selectChannel'));
      return;
    }

    setConfirmLoading(true);
    try {
      const res = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          name: formName.trim(),
          discordGuildId: formGuildId,
          discordChannelId: formChannelId,
          type: formType,
        }),
      });
      const result = await res.json();
      if (result.success) {
        antMessage.success(t('channel.bindChannel'));
        setModalOpen(false);
        await fetchChannels();
      } else {
        antMessage.error(result.error?.message ?? '绑定失败');
      }
    } catch {
      antMessage.error('绑定失败');
    } finally {
      setConfirmLoading(false);
    }
  }, [formName, formGuildId, formChannelId, formType, workspaceId, t, fetchChannels]);

  /** 删除频道 */
  const handleDelete = useCallback(async (channelId: string) => {
    Modal.confirm({
      title: t('channel.deleteChannel'),
      content: t('channel.confirmDelete'),
      okType: 'danger',
      onOk: async () => {
        try {
          const res = await fetch(`/api/channels/${channelId}`, { method: 'DELETE' });
          const result = await res.json();
          if (result.success) {
            antMessage.success(t('channel.unbindChannel'));
            await fetchChannels();
          } else {
            antMessage.error(result.error?.message ?? '删除失败');
          }
        } catch {
          antMessage.error('删除失败');
        }
      },
    });
  }, [t, fetchChannels]);

  /** 切换频道启用状态 */
  const handleToggleEnabled = useCallback(async (channelId: string, enabled: boolean) => {
    try {
      const res = await fetch(`/api/channels/${channelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      const result = await res.json();
      if (result.success) {
        await fetchChannels();
      }
    } catch {
      antMessage.error('更新失败');
    }
  }, [fetchChannels]);

  const typeMap: Record<string, string> = {
    TEXT: t('channel.typeText'),
    VOICE: t('channel.typeVoice'),
    ANNOUNCEMENT: t('channel.typeAnnouncement'),
  };

  const columns: ColumnsType<ChannelItem> = [
    {
      title: t('channel.channelName'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: ChannelItem) => (
        <Button
          type="link"
          style={{ padding: 0 }}
          onClick={() => onChannelClick?.(record.id, name)}
        >
          {name}
        </Button>
      ),
    },
    {
      title: t('channel.discordChannel'),
      dataIndex: 'discordChannelId',
      key: 'discordChannelId',
      render: (id: string) => (
        <Text type="secondary" style={{ fontSize: 12, fontFamily: 'monospace' }}>
          {id}
        </Text>
      ),
    },
    {
      title: t('channel.channelType'),
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => <Tag>{typeMap[type] ?? type}</Tag>,
    },
    {
      title: t('channel.enabled') + '/' + t('channel.disabled'),
      dataIndex: 'enabled',
      key: 'enabled',
      width: 80,
      render: (enabled: boolean, record: ChannelItem) => (
        <Switch
          checked={enabled}
          size="small"
          onChange={(checked) => handleToggleEnabled(record.id, checked)}
        />
      ),
    },
    {
      title: t('channel.messageCount', { count: '' }),
      key: 'messageCount',
      width: 100,
      render: (_: unknown, record: ChannelItem) => (
        <Text type="secondary">{record._count.messages}</Text>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_: unknown, record: ChannelItem) => (
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

  if (loading) {
    return <Card><Skeleton active paragraph={{ rows: 4 }} /></Card>;
  }

  return (
    <Card>
      <Flexbox gap={16}>
        <Flexbox horizontal align="center" justify="space-between">
          <Text strong style={{ fontSize: 16 }}>{t('channel.title')}</Text>
          <Flexbox horizontal gap={8}>
            <Button type="text" icon={<ReloadOutlined />} onClick={fetchChannels} size="small" />
            <Button type="primary" icon={<PlusOutlined />} onClick={openModal} size="small">
              {t('channel.addChannel')}
            </Button>
          </Flexbox>
        </Flexbox>

        {channels.length === 0 ? (
          <Empty
            description={t('channel.noChannels')}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={openModal}>
              {t('channel.addChannel')}
            </Button>
          </Empty>
        ) : (
          <Table
            dataSource={channels}
            columns={columns}
            rowKey="id"
            pagination={false}
            size="small"
          />
        )}

        {/* 添加频道弹窗 */}
        <Modal
          title={t('channel.addChannel')}
          open={modalOpen}
          onOk={handleCreate}
          onCancel={() => setModalOpen(false)}
          confirmLoading={confirmLoading}
          okText={t('channel.bindChannel')}
        >
          <Flexbox gap={16} style={{ marginTop: 16 }}>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>
                {t('channel.channelName')}
              </Text>
              <Input
                placeholder={t('channel.channelName')}
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            <div>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>
                {t('channel.discordGuild')}
              </Text>
              <Select
                style={{ width: '100%' }}
                placeholder={t('channel.selectGuild')}
                loading={loadingGuilds}
                value={formGuildId || undefined}
                onChange={(value) => {
                  setFormGuildId(value);
                  void fetchGuildChannels(value);
                }}
                options={guilds.map((g) => ({
                  value: g.id,
                  label: g.name,
                }))}
                notFoundContent={t('discord.noGuilds')}
              />
            </div>

            <div>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>
                {t('channel.discordChannel')}
              </Text>
              <Select
                style={{ width: '100%' }}
                placeholder={t('channel.selectChannel')}
                loading={loadingChannels}
                value={formChannelId || undefined}
                onChange={setFormChannelId}
                disabled={!formGuildId}
                options={guildChannels.map((c) => ({
                  value: c.id,
                  label: `# ${c.name}`,
                }))}
              />
            </div>

            <div>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>
                {t('channel.channelType')}
              </Text>
              <Select
                style={{ width: '100%' }}
                value={formType}
                onChange={setFormType}
                options={[
                  { value: 'TEXT', label: t('channel.typeText') },
                  { value: 'VOICE', label: t('channel.typeVoice') },
                  { value: 'ANNOUNCEMENT', label: t('channel.typeAnnouncement') },
                ]}
              />
            </div>
          </Flexbox>
        </Modal>
      </Flexbox>
    </Card>
  );
}
