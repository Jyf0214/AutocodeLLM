'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Text } from '@lobehub/ui';
import { Select, Spin, Empty } from 'antd';

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

interface DiscordChannelPickerProps {
  onSelect: (guildId: string, channelId: string, channelName: string) => void;
}

/** Discord 服务器/频道级联选择器 */
export default function DiscordChannelPicker({ onSelect }: DiscordChannelPickerProps) {
  const t = useTranslations('common');
  const [guilds, setGuilds] = useState<GuildInfo[]>([]);
  const [channels, setChannels] = useState<ChannelInfo[]>([]);
  const [selectedGuild, setSelectedGuild] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('');
  const [loadingGuilds, setLoadingGuilds] = useState(false);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [guildsLoaded, setGuildsLoaded] = useState(false);

  /** 加载服务器列表 */
  const fetchGuilds = useCallback(async () => {
    if (guildsLoaded) return;
    setLoadingGuilds(true);
    try {
      const res = await fetch('/api/discord/status');
      const result = await res.json();
      if (result.success && result.data?.guildList) {
        setGuilds(result.data.guildList as GuildInfo[]);
        setGuildsLoaded(true);
      }
    } catch {
      // 静默处理
    } finally {
      setLoadingGuilds(false);
    }
  }, [guildsLoaded]);

  /** 加载频道列表 */
  const fetchChannels = useCallback(async (guildId: string) => {
    setLoadingChannels(true);
    setSelectedChannel('');
    setChannels([]);
    try {
      const res = await fetch(`/api/discord/guilds/${guildId}/channels`);
      const result = await res.json();
      if (result.success && result.data) {
        setChannels(result.data as ChannelInfo[]);
      }
    } catch {
      // 静默处理
    } finally {
      setLoadingChannels(false);
    }
  }, []);

  /** 选择服务器 */
  const handleGuildChange = useCallback(
    (value: string) => {
      setSelectedGuild(value);
      onSelect(value, '', '');
      void fetchChannels(value);
    },
    [fetchChannels, onSelect],
  );

  /** 选择频道 */
  const handleChannelChange = useCallback(
    (value: string) => {
      setSelectedChannel(value);
      const channelName = channels.find((c) => c.id === value)?.name ?? '';
      onSelect(selectedGuild, value, channelName);
    },
    [channels, selectedGuild, onSelect],
  );

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{ flex: 1 }}>
        <Text strong style={{ display: 'block', marginBottom: 4 }}>
          {t('channel.selectGuild')}
        </Text>
        <Select
          style={{ width: '100%' }}
          placeholder={t('channel.selectGuild')}
          loading={loadingGuilds}
          value={selectedGuild || undefined}
          onDropdownVisibleChange={(open) => {
            if (open) void fetchGuilds();
          }}
          onChange={handleGuildChange}
          options={guilds.map((g) => ({
            value: g.id,
            label: g.name,
          }))}
          notFoundContent={
            loadingGuilds ? (
              <Spin size="small" />
            ) : (
              <Empty description={t('discord.noGuilds')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )
          }
        />
      </div>

      <div style={{ flex: 1 }}>
        <Text strong style={{ display: 'block', marginBottom: 4 }}>
          {t('channel.selectChannel')}
        </Text>
        <Select
          style={{ width: '100%' }}
          placeholder={t('channel.selectChannel')}
          loading={loadingChannels}
          value={selectedChannel || undefined}
          onChange={handleChannelChange}
          disabled={!selectedGuild}
          options={channels.map((c) => ({
            value: c.id,
            label: `# ${c.name}`,
          }))}
          notFoundContent={
            loadingChannels ? (
              <Spin size="small" />
            ) : (
              <Empty description="暂无频道" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )
          }
        />
      </div>
    </div>
  );
}
