'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Input, Button, Tag, Space } from 'antd';
import { LinkOutlined, DisconnectOutlined, RobotOutlined } from '@ant-design/icons';
import { Flexbox, Text } from '@lobehub/ui';
import { useTranslations } from 'next-intl';
import { message } from 'antd';
import type { ApiResponse, DiscordBotStatus } from '@/lib/api/channel-types';

export default function ChannelConnect() {
  const t = useTranslations('discord');

  const [token, setToken] = useState('');
  const [status, setStatus] = useState<DiscordBotStatus>({
    connected: false,
    tag: null,
    guilds: 0,
  });
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);

  /** 获取 Bot 连接状态 */
  const fetchStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const response = await fetch('/api/discord/status');
      if (!response.ok) return;
      const result = (await response.json()) as ApiResponse<DiscordBotStatus>;
      if (result.success && result.data) {
        setStatus(result.data);
      }
    } catch {
      // 静默处理
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  /** 连接 Discord Bot */
  const handleConnect = async () => {
    if (!token.trim()) {
      message.error(t('tokenLabel') + ' required');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/discord/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      });
      if (!response.ok) {
        message.error(t('connectFailed'));
        return;
      }
      const result = (await response.json()) as ApiResponse<{ tag: string }>;
      if (result.success) {
        message.success(t('connectSuccess'));
        setToken('');
        await fetchStatus();
      } else {
        message.error(result.error?.message ?? t('connectFailed'));
      }
    } catch {
      message.error(t('connectFailed'));
    } finally {
      setLoading(false);
    }
  };

  /** 断开 Discord Bot */
  const handleDisconnect = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/discord/disconnect', {
        method: 'POST',
      });
      if (!response.ok) {
        message.error(t('disconnectFailed'));
        return;
      }
      const result = (await response.json()) as ApiResponse<{ disconnected: boolean }>;
      if (result.success) {
        message.success(t('disconnectSuccess'));
        await fetchStatus();
      } else {
        message.error(result.error?.message ?? t('disconnectFailed'));
      }
    } catch {
      message.error(t('disconnectFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title={t('title')} size="small">
      <Flexbox vertical gap={16}>
        {/* 连接状态指示 */}
        <Flexbox horizontal gap={8} align="center">
          <Text style={{ fontWeight: 500 }}>{t('status')}:</Text>
          {statusLoading ? (
            <Tag color="processing">{t('connecting')}</Tag>
          ) : status.connected ? (
            <Tag color="green">{t('connected')}</Tag>
          ) : (
            <Tag color="default">{t('disconnected')}</Tag>
          )}
        </Flexbox>

        {/* 已连接时显示 Bot 信息 */}
        {status.connected && (
          <Flexbox horizontal gap={16} align="center" wrap="wrap">
            <Space>
              <RobotOutlined />
              <Text>{t('botTag', { tag: status.tag })}</Text>
            </Space>
            <Space>
              <LinkOutlined />
              <Text>{t('guildCount', { count: status.guilds })}</Text>
            </Space>
          </Flexbox>
        )}

        {/* 未连接时显示 Token 输入 */}
        {!status.connected && (
          <Flexbox gap={8}>
            <Input.Password
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={t('tokenPlaceholder')}
              prefix={<RobotOutlined />}
              onPressEnter={handleConnect}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t('tokenHint')}
            </Text>
          </Flexbox>
        )}

        {/* 操作按钮 */}
        <Flexbox horizontal gap={8}>
          {!status.connected ? (
            <Button
              type="primary"
              icon={<LinkOutlined />}
              onClick={handleConnect}
              loading={loading}
              disabled={!token.trim()}
            >
              {t('connect')}
            </Button>
          ) : (
            <Button
              danger
              icon={<DisconnectOutlined />}
              onClick={handleDisconnect}
              loading={loading}
            >
              {t('disconnect')}
            </Button>
          )}
        </Flexbox>
      </Flexbox>
    </Card>
  );
}
