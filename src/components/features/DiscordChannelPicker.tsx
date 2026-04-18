'use client';

import { useState, useEffect, useCallback } from 'react';
import { Select, Space, Empty, Skeleton } from 'antd';
import { ServerOutlined, HashOutlined } from '@ant-design/icons';
import { Text } from '@lobehub/ui';
import { useTranslations } from 'next-intl';
import type { ApiResponse, DiscordGuildInfo, DiscordChannelInfo } from '@/lib/api/channel-types';

interface DiscordChannelPickerProps {
  onSelect: (guildId: string, channelId: string, channelName: string) => void;
}

export default function DiscordChannelPicker({ onSelect }: DiscordChannelPickerProps) {
  const t = useTranslations('channel');
  const td = useTranslations('discord');

  const [guilds, setGuilds] = useState<DiscordGuildInfo[]>([]);
  const [channels, setChannels] = useState<DiscordChannelInfo[]>([]);
  const [selectedGuildId, setSelectedGuildId] = useState<string | undefined>(undefined);
  const [selectedChannelId, setSelectedChannelId] = useState<string | undefined>(undefined);
  const [guildsLoading, setGuildsLoading] = useState(false);
  const [channelsLoading, setChannelsLoading] = useState(false);

  /** 获取 Bot 所在服务器列表 */
  const fetchGuilds = useCallback(async () => {
    setGuildsLoading(true);
    try {
      const response = await fetch('/api/discord/status');
      if (!response.ok) return;
      const result = (await response.json()) as ApiResponse<DiscordGuildInfo[]>;
      if (result.success && result.data) {
        setGuilds(result.data);
      }
    } catch {
      // 静默处理
    } finally {
      setGuildsLoading(false);
    }
  }, []);

  /** 获取指定服务器的频道列表 */
  const fetchChannels = useCallback(async (guildId: string) => {
    setChannelsLoading(true);
    setChannels([]);
    setSelectedChannelId(undefined);
    try {
      const response = await fetch(`/api/discord/guilds/${guildId}/channels`);
      if (!response.ok) return;
      const result = (await response.json()) as ApiResponse<DiscordChannelInfo[]>;
      if (result.success && result.data) {
        setChannels(result.data);
      }
    } catch {
      // 静默处理
    } finally {
      setChannelsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGuilds();
  }, [fetchGuilds]);

  /** 选择服务器时加载频道 */
  const handleGuildChange = (guildId: string) => {
    setSelectedGuildId(guildId);
    setSelectedChannelId(undefined);
    fetchChannels(guildId);
  };

  /** 选择频道时触发回调 */
  const handleChannelChange = (channelId: string) => {
    setSelectedChannelId(channelId);
    const channel = channels.find((ch) => ch.id === channelId);
    if (channel && selectedGuildId) {
      onSelect(selectedGuildId, channelId, channel.name);
    }
  };

  // 加载中骨架屏
  if (guildsLoading) {
    return <Skeleton active paragraph={{ rows: 1 }} />;
  }

  // 无可用服务器
  if (!guildsLoading && guilds.length === 0) {
    return <Empty description={td('noGuilds')} image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={12}>
      <div>
        <Text style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>
          {t('selectGuild')}
        </Text>
        <Select
          style={{ width: '100%' }}
          placeholder={t('selectGuild')}
          value={selectedGuildId}
          onChange={handleGuildChange}
          suffixIcon={<ServerOutlined />}
          options={guilds.map((g) => ({
            label: g.name,
            value: g.id,
          }))}
          notFoundContent={td('noGuilds')}
        />
      </div>

      {selectedGuildId && (
        <div>
          <Text style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>
            {t('selectChannel')}
          </Text>
          <Select
            style={{ width: '100%' }}
            placeholder={t('selectChannel')}
            value={selectedChannelId}
            onChange={handleChannelChange}
            loading={channelsLoading}
            suffixIcon={<HashOutlined />}
            options={channels.map((ch) => ({
              label: `# ${ch.name}`,
              value: ch.id,
            }))}
            notFoundContent={channelsLoading ? undefined : t('noChannels')}
          />
        </div>
      )}
    </Space>
  );
}
