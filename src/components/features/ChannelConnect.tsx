'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { message as antMessage } from 'antd';
import { Button, Text, Flexbox } from '@lobehub/ui';
import { Card, Input, Tag, Skeleton, Table, Modal } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  LinkOutlined,
  DisconnectOutlined,
  ReloadOutlined,
  UserAddOutlined,
  DeleteOutlined,
} from '@ant-design/icons';

/** 绑定用户信息 */
interface BindingItem {
  id: string;
  discordUserId: string;
  discordUserName: string;
  createdAt: string;
}

interface ChannelConnectProps {
  workspaceId: string;
}

/** Discord Bot 连接配置 + 绑定管理组件 */
export default function ChannelConnect({ workspaceId }: ChannelConnectProps) {
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

  // 绑定码输入
  const [bindCode, setBindCode] = useState('');
  const [binding, setBinding] = useState(false);

  // 已绑定用户列表
  const [bindings, setBindings] = useState<BindingItem[]>([]);
  const [loadingBindings, setLoadingBindings] = useState(false);

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

  /** 获取绑定列表 */
  const fetchBindings = useCallback(async () => {
    setLoadingBindings(true);
    try {
      const res = await fetch(`/api/discord/bind?workspaceId=${workspaceId}`);
      const result = await res.json();
      if (result.success && result.data) {
        setBindings(result.data as BindingItem[]);
      }
    } catch {
      // 静默处理
    } finally {
      setLoadingBindings(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void fetchStatus();
    void fetchBindings();
  }, [fetchStatus, fetchBindings]);

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

  /** 确认绑定码 */
  const handleBind = useCallback(async () => {
    if (!bindCode.trim()) {
      antMessage.warning(t('discord.bindCodePlaceholder'));
      return;
    }
    setBinding(true);
    try {
      const res = await fetch('/api/discord/bind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: bindCode.trim(), workspaceId }),
      });
      const result = await res.json();
      if (result.success) {
        antMessage.success(
          t('discord.bindSuccess', { user: result.data?.discordUserName ?? '' }),
        );
        setBindCode('');
        await fetchBindings();
      } else {
        antMessage.error(result.error?.message ?? t('discord.bindFailed'));
      }
    } catch {
      antMessage.error(t('discord.bindFailed'));
    } finally {
      setBinding(false);
    }
  }, [bindCode, workspaceId, t, fetchBindings]);

  /** 解绑用户 */
  const handleUnbind = useCallback(
    async (discordUserId: string) => {
      Modal.confirm({
        title: t('discord.confirmUnbind'),
        okType: 'danger',
        onOk: async () => {
          try {
            const res = await fetch('/api/discord/bind', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ discordUserId }),
            });
            const result = await res.json();
            if (result.success) {
              antMessage.success(t('discord.unbindSuccess'));
              await fetchBindings();
            } else {
              antMessage.error(result.error?.message ?? t('discord.unbindFailed'));
            }
          } catch {
            antMessage.error(t('discord.unbindFailed'));
          }
        },
      });
    },
    [t, fetchBindings],
  );

  /** 绑定列表列定义 */
  const bindingColumns: ColumnsType<BindingItem> = [
    {
      title: t('discord.discordUser'),
      dataIndex: 'discordUserName',
      key: 'discordUserName',
      render: (name: string, record: BindingItem) => (
        <Flexbox horizontal align="center" gap={8}>
          <Text>{name}</Text>
          <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>
            {record.discordUserId}
          </Text>
        </Flexbox>
      ),
    },
    {
      title: t('discord.bindTime'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {new Date(date).toLocaleString()}
        </Text>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_: unknown, record: BindingItem) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => handleUnbind(record.discordUserId)}
        />
      ),
    },
  ];

  if (loading) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 2 }} />
      </Card>
    );
  }

  return (
    <Flexbox gap={16}>
      {/* Bot 连接状态 */}
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

      {/* 绑定码输入 */}
      {status?.connected && (
        <Card>
          <Flexbox gap={16}>
            <Flexbox horizontal align="center" gap={8}>
              <UserAddOutlined />
              <Text strong style={{ fontSize: 16 }}>
                {t('discord.bindTitle')}
              </Text>
            </Flexbox>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {t('discord.bindDesc')}
            </Text>
            <Flexbox horizontal gap={8} align="center">
              <Input
                placeholder={t('discord.bindCodePlaceholder')}
                value={bindCode}
                onChange={(e) => setBindCode(e.target.value.toUpperCase())}
                onPressEnter={handleBind}
                maxLength={6}
                style={{ width: 160, fontFamily: 'monospace', letterSpacing: 4, textAlign: 'center' }}
              />
              <Button
                type="primary"
                icon={<LinkOutlined />}
                loading={binding}
                onClick={handleBind}
              >
                {t('discord.bindConfirm')}
              </Button>
            </Flexbox>
          </Flexbox>
        </Card>
      )}

      {/* 已绑定用户列表 */}
      {status?.connected && (
        <Card>
          <Flexbox gap={12}>
            <Flexbox horizontal align="center" justify="space-between">
              <Text strong style={{ fontSize: 16 }}>
                {t('discord.boundUsers')}
              </Text>
              <Button
                type="text"
                icon={<ReloadOutlined />}
                onClick={fetchBindings}
                size="small"
              />
            </Flexbox>
            {bindings.length === 0 ? (
              <Text type="secondary">{t('discord.noBoundUsers')}</Text>
            ) : (
              <Table
                dataSource={bindings}
                columns={bindingColumns}
                rowKey="id"
                pagination={false}
                size="small"
                loading={loadingBindings}
              />
            )}
          </Flexbox>
        </Card>
      )}
    </Flexbox>
  );
}
