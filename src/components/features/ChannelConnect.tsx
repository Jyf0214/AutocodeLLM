'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { message as antMessage } from 'antd';
import { Button, Text, Flexbox } from '@lobehub/ui';
import { Card, Input, Tag, Skeleton } from 'antd';
import { LinkOutlined, DisconnectOutlined, ReloadOutlined } from '@ant-design/icons';

/** Discord Bot 连接配置组件 */
export default function ChannelConnect() {
  const t = useTranslations('common');
  const [token, setToken] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [status, setStatus] = useState<{
    connected: boolean;
    tag: string | null;
    guilds: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  /** 获取 Bot 连接状态 */
  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/discord/status');
      const result = await res.json();
      if (result.success && result.data) {
        setStatus(result.data);
      }
    } catch {
      // 静默处理
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  /** 连接 Bot */
  const handleConnect = useCallback(async () => {
    if (!token.trim()) {
      antMessage.warning(t('discord.tokenLabel'));
      return;
    }
    setConnecting(true);
    try {
      const res = await fetch('/api/discord/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      });
      const result = await res.json();
      if (result.success) {
        antMessage.success(t('discord.connectSuccess'));
        setToken('');
        await fetchStatus();
      } else {
        antMessage.error(result.error?.message ?? t('discord.connectFailed'));
      }
    } catch {
      antMessage.error(t('discord.connectFailed'));
    } finally {
      setConnecting(false);
    }
  }, [token, t, fetchStatus]);

  /** 断开 Bot */
  const handleDisconnect = useCallback(async () => {
    setDisconnecting(true);
    try {
      await fetch('/api/discord/disconnect', { method: 'POST' });
      antMessage.success(t('discord.disconnectSuccess'));
      await fetchStatus();
    } catch {
      antMessage.error('断开失败');
    } finally {
      setDisconnecting(false);
    }
  }, [fetchStatus, t]);

  if (loading) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 2 }} />
      </Card>
    );
  }

  return (
    <Card>
      <Flexbox gap={16}>
        <Flexbox horizontal align="center" justify="space-between">
          <Flexbox horizontal align="center" gap={8}>
            <Text strong style={{ fontSize: 16 }}>
              {t('discord.title')}
            </Text>
            {status?.connected ? (
              <Tag color="success">{t('discord.connected')}</Tag>
            ) : (
              <Tag color="default">{t('discord.disconnected')}</Tag>
            )}
          </Flexbox>
          <Button
            type="text"
            icon={<ReloadOutlined />}
            onClick={fetchStatus}
            size="small"
          />
        </Flexbox>

        {status?.connected ? (
          <Flexbox gap={8}>
            <Text type="secondary">
              {t('discord.botTag', { tag: status.tag ?? '' })}
            </Text>
            <Text type="secondary">
              {t('discord.guildCount', { count: status.guilds })}
            </Text>
            <Button
              danger
              icon={<DisconnectOutlined />}
              loading={disconnecting}
              onClick={handleDisconnect}
            >
              {t('discord.disconnect')}
            </Button>
          </Flexbox>
        ) : (
          <Flexbox gap={12}>
            <Input.Password
              placeholder={t('discord.tokenPlaceholder')}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onPressEnter={handleConnect}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t('discord.tokenHint')}
            </Text>
            <Button
              type="primary"
              icon={<LinkOutlined />}
              loading={connecting}
              onClick={handleConnect}
            >
              {t('discord.connect')}
            </Button>
          </Flexbox>
        )}
      </Flexbox>
    </Card>
  );
}
