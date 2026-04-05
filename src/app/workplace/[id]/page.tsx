'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ActionIcon, Text } from '@lobehub/ui';
import { Tabs, message, Flex } from 'antd';
import {
  ArrowLeftOutlined,
  ShareAltOutlined,
  ApiOutlined,
  SettingOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import MessageBubble from '@/components/ui/MessageBubble';
import ChatInput from '@/components/ui/ChatInput';
import ModelSwitcher from '@/components/ui/ModelSwitcher';
import WorkspacePasswordModal from '@/components/features/WorkspacePasswordModal';
import WorkspaceSettings from '@/components/features/WorkspaceSettings';
import WorkspaceLogs from '@/components/features/WorkspaceLogs';
import type { WorkspaceListItem } from '@/lib/api/workspace-types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content?: string;
  timestamp?: string;
  toolCalls?: {
    id: string;
    name: string;
    description?: string;
    status: 'success' | 'error' | 'running';
    error?: string;
    duration?: string;
  }[];
  thinkingProcess?: {
    content: string;
    duration: number;
  };
}

const MOCK_MESSAGES: Message[] = [];

const MOCK_MODELS = [
  { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', isDefault: true },
  { id: 'claude-3', name: 'Claude 3', provider: 'Anthropic' },
  { id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google' },
  { id: 'deepseek-coder', name: 'DeepSeek Coder', provider: 'DeepSeek' },
];

export default function WorkplaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = React.use(params);
  const [messages] = useState(MOCK_MESSAGES);
  const [modelDrawerOpen, setModelDrawerOpen] = useState(false);
  const [currentModelId, setCurrentModelId] = useState('gpt-4');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null) as React.RefObject<HTMLDivElement | null>;
  
  // 工作区密码验证状态
  const [workspace, setWorkspace] = useState<WorkspaceListItem | null>(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [verified, setVerified] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');

  // 获取工作区信息
  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        const response = await fetch('/api/workspaces');
        const result: { success: boolean; data?: WorkspaceListItem[] } = await response.json();
        if (result.success) {
          const ws = result.data?.find((w) => w.id === id);
          if (ws) {
            setWorkspace(ws);
            // 如果没有密码，直接验证通过
            if (!ws.accessPassword) {
              setVerified(true);
            } else {
              setPasswordModalOpen(true);
            }
          } else {
            message.error('工作区不存在');
            router.push('/workplace');
          }
        }
      } catch {
        message.error('获取工作区信息失败');
      }
    };

    fetchWorkspace();
  }, [id, router]);

  const handleVerified = useCallback(() => {
    setVerified(true);
    setPasswordModalOpen(false);
  }, []);

  const handlePasswordCancel = useCallback(() => {
    setPasswordModalOpen(false);
    router.push('/workplace');
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(
    (message: string) => {
      void message;
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
      }, 2000);
    },
    [],
  );

  const handleStop = useCallback(() => {
    setLoading(false);
  }, []);

  const handleModelSelect = useCallback((modelId: string) => {
    setCurrentModelId(modelId);
  }, []);

  // 如果未验证，显示加载状态
  if (!verified) {
    return (
      <Flex align="center" justify="center" style={{ height: '100dvh' }}>
        <Text type="secondary">验证中...</Text>
      </Flex>
    );
  }

  const tabItems = [
    {
      key: 'chat',
      label: (
        <Flex gap={4} align="center">
          <ApiOutlined />
          <span>聊天</span>
        </Flex>
      ),
      children: (
        <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
          <Flex
            align="center"
            justify="space-between"
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--color-border)',
              background: 'var(--color-bg-container)',
            }}
          >
            <Flex gap={8} align="center">
              <ActionIcon
                icon={ArrowLeftOutlined}
                onClick={() => { router.push('/workplace'); }}
                size="large"
              />
              <Text strong style={{ fontSize: 16 }}>
                {workspace?.name ?? '工作区'}
              </Text>
            </Flex>
            <Flex gap={8}>
              <ActionIcon
                icon={ApiOutlined}
                onClick={() => { setModelDrawerOpen(true); }}
                size="large"
              />
              <ActionIcon icon={ShareAltOutlined} size="large" />
            </Flex>
          </Flex>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
            }}
          >
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  timestamp={msg.timestamp}
                  toolCalls={msg.toolCalls}
                  thinkingProcess={msg.thinkingProcess}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div
            style={{
              padding: '16px',
              borderTop: '1px solid var(--color-border)',
              background: 'var(--color-bg-container)',
            }}
          >
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
              <ChatInput
                onSend={handleSend}
                onStop={handleStop}
                loading={loading}
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'settings',
      label: (
        <Flex gap={4} align="center">
          <SettingOutlined />
          <span>设置</span>
        </Flex>
      ),
      children: (
        <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
          <WorkspaceSettings
            workspaceId={id}
            hasPassword={workspace?.accessPassword ? true : false}
            onPasswordChanged={() => {
              message.success('密码已更新');
            }}
          />
        </div>
      ),
    },
    {
      key: 'logs',
      label: (
        <Flex gap={4} align="center">
          <FileTextOutlined />
          <span>日志</span>
        </Flex>
      ),
      children: (
        <div style={{ padding: 16 }}>
          <WorkspaceLogs workspaceId={id} />
        </div>
      ),
    },
  ];

  return (
    <div>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        style={{ margin: 0 }}
        tabBarStyle={{ margin: 0, padding: '0 16px' }}
      />

      {workspace && (
        <WorkspacePasswordModal
          open={passwordModalOpen}
          workspaceId={workspace.id}
          workspaceName={workspace.name}
          onVerified={handleVerified}
          onCancel={handlePasswordCancel}
        />
      )}

      <ModelSwitcher
        models={MOCK_MODELS}
        currentModelId={currentModelId}
        onSelect={handleModelSelect}
        open={modelDrawerOpen}
        onClose={() => { setModelDrawerOpen(false); }}
      />
    </div>
  );
}
