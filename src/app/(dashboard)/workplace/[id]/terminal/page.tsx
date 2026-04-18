'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import TerminalPanel from '@/components/features/TerminalPanel';
import { useParams } from 'next/navigation';
import { Flexbox, Text, Alert } from '@lobehub/ui';
import { CodeOutlined } from '@ant-design/icons';

interface WsConfig {
  success: boolean;
  data?: { wsUrl: string };
  error?: { message: string };
}

export default function WorkplaceTerminalPage() {
  const params = useParams();
  const workspaceId = params?.id as string;
  const t = useTranslations('common');
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWsUrl() {
      try {
        const res = await fetch('/api/terminal/ws');
        const data: WsConfig = await res.json();
        if (data.success && data.data?.wsUrl) {
          setWsUrl(data.data.wsUrl);
        } else {
          setError(data.error?.message ?? '终端服务器未配置');
        }
      } catch {
        setError('无法连接到终端服务器');
      }
    }
    if (workspaceId) {
      fetchWsUrl();
    }
  }, [workspaceId]);

  if (!workspaceId) {
    return (
      <Flexbox align="center" justify="center" style={{ minHeight: '50vh' }}>
        <Text>{'工作区 ID 不存在'}</Text>
      </Flexbox>
    );
  }

  if (error || !wsUrl) {
    return (
      <Flexbox align="center" justify="center" style={{ minHeight: '50vh', padding: 16 }}>
        <Alert
          type="warning"
          icon={<CodeOutlined />}
          message="终端服务未配置"
          description={
            <div>
              <p>请配置 TERMINAL_WS_URL 环境变量来启用 Web 终端功能。</p>
              <p style={{ marginTop: 8, fontSize: 12 }}>
                例如：ws://localhost:7861/api/terminal/ws
              </p>
            </div>
          }
        />
      </Flexbox>
    );
  }

  return (
    <div style={{ height: 'calc(100vh - 120px)', padding: '0 16px' }}>
      <TerminalPanel workspaceId={workspaceId} />
    </div>
  );
}