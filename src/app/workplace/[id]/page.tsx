/**
 * This component is inspired by the LobeChat project (https://github.com/lobehub/lobe-chat)
 * which is licensed under the MIT License.
 *
 * This implementation is independently written and does not contain any
 * copied source code from LobeChat. It only uses the public APIs provided
 * by the @lobehub/ui npm package.
 *
 * Original work Copyright (c) 2023 LobeHub (MIT License)
 * This work Copyright (c) 2026 Jyf0214 (Apache License 2.0)
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ActionIcon,
  Text,
  Flexbox,
  Avatar,
} from '@lobehub/ui';
import {
  ChatItem,
  ChatInputArea,
  ChatInputActionBar,
  LoadingDots,
  type MetaData,
} from '@lobehub/ui/chat';
import { Tabs, message, Dropdown } from 'antd';
import {
  ArrowLeftOutlined,
  ShareAltOutlined,
  ApiOutlined,
  SettingOutlined,
  FileTextOutlined,
  GlobalOutlined,
  PaperClipOutlined,
  PictureOutlined,
  SettingOutlined as SettingOutlinedIcon,
  DesktopOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { ModelIcon } from '@lobehub/icons';
import WorkspacePasswordModal from '@/components/features/WorkspacePasswordModal';
import WorkspaceSettings from '@/components/features/WorkspaceSettings';
import WorkspaceLogs from '@/components/features/WorkspaceLogs';
import TerminalPanel from '@/components/features/TerminalPanel';
import type { WorkspaceListItem } from '@/lib/api/workspace-types';

const USER_META: MetaData = {
  title: '用户',
  avatar: 'user',
};

const ASSISTANT_META: MetaData = {
  title: 'AI 助手',
  avatar: '🤖',
};

interface WorkspaceChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createAt: number;
  updateAt: number;
  meta?: MetaData;
  extra?: {
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
  };
}

interface ModelOption {
  id: string;
  name: string;
  provider: string;
  isDefault?: boolean;
}

const MOCK_MODELS: ModelOption[] = [
  { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', isDefault: true },
  { id: 'claude-3', name: 'Claude 3', provider: 'Anthropic' },
  { id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google' },
  { id: 'deepseek-coder', name: 'DeepSeek Coder', provider: 'DeepSeek' },
];

function ModelSelector({
  currentModel,
  onSelect,
}: {
  currentModel: ModelOption;
  onSelect: (modelId: string) => void;
}) {
  const menuItems = MOCK_MODELS.map((model) => ({
    key: model.id,
    label: (
      <Flexbox gap={8} horizontal align="center">
        <ModelIcon model={model.id} size={20} />
        <Text>{model.name}</Text>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {model.provider}
        </Text>
        {model.isDefault && (
          <Text
            style={{
              fontSize: 10,
              padding: '0 4px',
              borderRadius: 4,
              background: 'var(--lobe-color-primary)',
              color: '#fff',
            }}
          >
            默认
          </Text>
        )}
      </Flexbox>
    ),
    onClick: () => {
      onSelect(model.id);
    },
  }));

  return (
    <Dropdown menu={{ items: menuItems }} placement="bottomLeft" arrow>
      <Flexbox
        gap={6}
        horizontal
        align="center"
        style={{
          padding: '4px 8px',
          borderRadius: 8,
          cursor: 'pointer',
        }}
      >
        <ModelIcon model={currentModel.id} size={18} />
        <Text style={{ fontSize: 14 }}>{currentModel.name}</Text>
      </Flexbox>
    </Dropdown>
  );
}

export default function WorkplaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = React.use(params);

  const [messages, setMessages] = useState<WorkspaceChatMessage[]>([]);
  const [currentModelId, setCurrentModelId] = useState('gpt-4');
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [workspace, setWorkspace] = useState<WorkspaceListItem | null>(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [verified, setVerified] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');

  const currentModel: ModelOption = MOCK_MODELS.find((m) => m.id === currentModelId)!;

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        const response = await fetch('/api/workspaces');
        const result: { success: boolean; data?: WorkspaceListItem[] } = await response.json();
        if (result.success) {
          const ws = result.data?.find((w) => w.id === id);
          if (ws) {
            setWorkspace(ws);
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
    async (value: string) => {
      const trimmed = value.trim();
      if (!trimmed || loading) return;

      const userMessage: WorkspaceChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmed,
        createAt: Date.now(),
        updateAt: Date.now(),
        meta: USER_META,
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputValue('');
      setLoading(true);

      try {
        const response = await fetch(`/api/workspaces/${id}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            model: currentModelId,
          }),
        });

        if (response.ok) {
          const result: { success: boolean; data?: { content: string } } = await response.json();
          if (result.success && result.data) {
            const assistantMessage: WorkspaceChatMessage = {
              id: `assistant-${Date.now()}`,
              role: 'assistant',
              content: result.data.content,
              createAt: Date.now(),
              updateAt: Date.now(),
              meta: ASSISTANT_META,
            };
            setMessages((prev) => [...prev, assistantMessage]);
          }
        }
      } catch {
        message.error('发送消息失败');
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, currentModelId, id],
  );

  const handleModelSelect = useCallback((modelId: string) => {
    setCurrentModelId(modelId);
  }, []);

  const handleTextAreaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputValue(e.target.value);
    },
    [],
  );

  const handleInputSend = useCallback(() => {
    handleSend(inputValue);
  }, [handleSend, inputValue]);

  if (!verified) {
    return (
      <Flexbox align="center" justify="center" style={{ height: '100dvh' }}>
        <Text type="secondary">验证中...</Text>
      </Flexbox>
    );
  }

  const renderChatTab = () => (
    <Flexbox
      style={{
        height: 'calc(100dvh - 46px)',
      }}
    >
      <Flexbox
        horizontal
        justify="space-between"
        align="center"
        style={{
          borderBottom: '1px solid var(--color-border)',
          padding: '8px 16px',
          background: 'var(--color-bg-container)',
        }}
      >
        <Flexbox gap={8} horizontal align="center">
          <ActionIcon
            icon={ArrowLeftOutlined}
            onClick={() => {
              router.push('/workplace');
            }}
            size="large"
          />
          <ModelSelector
            currentModel={currentModel}
            onSelect={handleModelSelect}
          />
        </Flexbox>
        <ActionIcon icon={ShareAltOutlined} size="large" />
      </Flexbox>

      <Flexbox
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
        }}
      >
        <Flexbox style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
          {messages.length === 0 && !loading ? (
            <Flexbox
              gap={16}
              align="center"
              justify="center"
              style={{ height: '60vh' }}
            >
              <Avatar avatar="🤖" size={64} background="var(--lobe-color-primary)" />
              <Text type="secondary" style={{ fontSize: 16 }}>
                开始对话，让 AI 帮助你完成工作
              </Text>
            </Flexbox>
          ) : (
            <>
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                const isLast = msg.id === messages[messages.length - 1]?.id;

                return (
                  <ChatItem
                    key={msg.id}
                    avatar={isUser ? USER_META : ASSISTANT_META}
                    placement={isUser ? 'right' : 'left'}
                    message={msg.content}
                    loading={loading && isLast}
                    showAvatar
                    variant="bubble"
                    markdownProps={{
                      variant: 'chat',
                      enableMermaid: true,
                      enableGithubAlert: true,
                      enableLatex: true,
                    }}
                  />
                );
              })}
              {loading && (
                <ChatItem
                  avatar={ASSISTANT_META}
                  placement="left"
                  message={<LoadingDots />}
                  showAvatar
                  variant="bubble"
                />
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </Flexbox>
      </Flexbox>

      <Flexbox
        style={{
          borderTop: '1px solid var(--color-border)',
          background: 'var(--color-bg-container)',
          padding: '12px 16px 16px',
        }}
      >
        <Flexbox style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
          <ChatInputActionBar
            leftAddons={
              <Flexbox gap={4} horizontal>
                <ActionIcon icon={GlobalOutlined} size={{ blockSize: 20 }} />
                <ActionIcon icon={PaperClipOutlined} size={{ blockSize: 20 }} />
                <ActionIcon icon={PictureOutlined} size={{ blockSize: 20 }} />
                <ActionIcon icon={SettingOutlinedIcon} size={{ blockSize: 20 }} />
              </Flexbox>
            }
            rightAddons={
              <ActionIcon
                icon={SendOutlined}
                onClick={handleInputSend}
                loading={loading}
                disabled={!inputValue.trim() || loading}
                size={{ blockSize: 24 }}
              />
            }
          />
          <ChatInputArea.Inner
            value={inputValue}
            onChange={handleTextAreaChange}
            onSend={handleInputSend}
            loading={loading}
            placeholder="从任何想法开始..."
            autoSize={{ minRows: 2, maxRows: 8 }}
          />
          <Flexbox justify="center" style={{ marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              按 Ctrl+Enter 换行
            </Text>
          </Flexbox>
        </Flexbox>
      </Flexbox>
    </Flexbox>
  );

  const tabItems = [
    {
      key: 'chat',
      label: (
        <Flexbox gap={4} horizontal align="center">
          <ApiOutlined />
          <span>聊天</span>
        </Flexbox>
      ),
      children: renderChatTab(),
    },
    {
      key: 'terminal',
      label: (
        <Flexbox gap={4} horizontal align="center">
          <DesktopOutlined />
          <span>终端</span>
        </Flexbox>
      ),
      children: (
        <div style={{ height: 'calc(100dvh - 46px)', padding: 16 }}>
          <TerminalPanel workspaceId={id} />
        </div>
      ),
    },
    {
      key: 'settings',
      label: (
        <Flexbox gap={4} horizontal align="center">
          <SettingOutlined />
          <span>设置</span>
        </Flexbox>
      ),
      children: (
        <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
          <WorkspaceSettings
            workspaceId={id}
            hasPassword={workspace?.accessPassword != null}
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
        <Flexbox gap={4} horizontal align="center">
          <FileTextOutlined />
          <span>日志</span>
        </Flexbox>
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
    </div>
  );
}
