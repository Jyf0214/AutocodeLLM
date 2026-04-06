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
import { Tabs, message, Dropdown, Button, Tag, Spin } from 'antd';
import {
  ArrowLeftOutlined,
  ShareAltOutlined,
  ApiOutlined,
  SettingOutlined,
  FileTextOutlined,
  DesktopOutlined,
  SendOutlined,
  CloudServerOutlined,
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

function createAssistantMeta(modelName?: string): MetaData {
  return {
    title: modelName ? `AI · ${modelName}` : 'AI 助手',
    avatar: '🤖',
  };
}

interface ModelSelectorItem {
  id: string;
  name: string;
  providerName: string;
  providerId: string;
  enabled: boolean;
  sdkType: string;
  authType: string;
}

interface WorkspaceChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createAt: number;
  updateAt: number;
  meta?: MetaData;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  providerId?: string;
  model?: string;
}

/**
 * 空状态引导页面：提示用户配置模型
 */
function EmptyModelGuide({ onGoToConfig }: { onGoToConfig: () => void }) {
  return (
    <Flexbox
      align="center"
      justify="center"
      style={{ height: 'calc(100dvh - 46px)', padding: 24 }}
    >
      <Flexbox
        align="center"
        gap={24}
        style={{ maxWidth: 480 }}
      >
        <Avatar avatar="🤖" size={80} />
        <Flexbox align="center" gap={12}>
          <Text strong style={{ fontSize: 20 }}>
            配置 AI 模型后即可开始对话
          </Text>
          <Text type="secondary" style={{ textAlign: 'center', lineHeight: 1.6 }}>
            您需要先配置至少一个 AI 模型（OpenAI 兼容 API 或 OAuth 登录），才能使用聊天功能。
          </Text>
        </Flexbox>
        <Flexbox gap={12} horizontal>
          <Button
            type="primary"
            size="large"
            icon={<CloudServerOutlined />}
            onClick={onGoToConfig}
          >
            去配置模型
          </Button>
        </Flexbox>
        <Flexbox gap={8} horizontal wrap="wrap" justify="center">
          <Tag color="blue">OpenAI 兼容 API</Tag>
          <Tag color="purple">OAuth 登录</Tag>
          <Tag color="green">Anthropic</Tag>
          <Tag color="orange">Google</Tag>
        </Flexbox>
      </Flexbox>
    </Flexbox>
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
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [workspace, setWorkspace] = useState<WorkspaceListItem | null>(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [verified, setVerified] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');

  // 模型和提供商状态
  const [modelList, setModelList] = useState<ModelSelectorItem[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  const selectedModel = modelList.find((m) => m.id === selectedModelId) ?? null;

  // 加载模型和提供商列表
  const loadModelsAndProviders = useCallback(async () => {
    setModelsLoading(true);
    try {
      const [modelsRes, providersRes] = await Promise.all([
        fetch('/api/models'),
        fetch('/api/providers'),
      ]);

      const modelsData: { success: boolean; data?: { id: string; name: string; provider: string; enabled: boolean }[] } = await modelsRes.json();
      const providersData: { success: boolean; data?: { id: string; name: string; sdkType: string; authType: string; enabled: boolean }[] } = await providersRes.json();

      const items: ModelSelectorItem[] = [];

      // 合并模型配置
      if (modelsData.success && modelsData.data) {
        for (const m of modelsData.data) {
          if (m.enabled) {
            items.push({
              id: m.id,
              name: m.name,
              providerName: m.provider,
              providerId: m.id,
              enabled: m.enabled,
              sdkType: 'openai',
              authType: 'apiKey',
            });
          }
        }
      }

      // 合并提供商（包括 OAuth）
      if (providersData.success && providersData.data) {
        for (const p of providersData.data) {
          if (p.enabled && !items.find((i) => i.providerId === p.id)) {
            items.push({
              id: p.id,
              name: p.name,
              providerName: p.name,
              providerId: p.id,
              enabled: p.enabled,
              sdkType: p.sdkType,
              authType: p.authType,
            });
          }
        }
      }

      setModelList(items);
      if (items.length > 0) {
        setSelectedModelId(items[0]?.id ?? null);
      }
    } catch {
      message.error('获取模型列表失败');
    } finally {
      setModelsLoading(false);
    }
  }, []);

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

  useEffect(() => {
    if (verified) {
      void loadModelsAndProviders();
    }
  }, [verified, loadModelsAndProviders]);

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

      // 没有配置模型时不允许发送
      if (!selectedModel) {
        message.warning('请先配置 AI 模型');
        return;
      }

      const userMessage: WorkspaceChatMessage = {
        id: `user-${Date.now().toString()}`,
        role: 'user',
        content: trimmed,
        createAt: Date.now(),
        updateAt: Date.now(),
        meta: USER_META,
        providerId: selectedModel.providerId,
        model: selectedModel.name,
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
            model: selectedModel.name,
            providerId: selectedModel.providerId,
          }),
        });

        const result: { success: boolean; data?: { content: string; usage?: { inputTokens: number; outputTokens: number; totalTokens: number } }; error?: { message: string } } = await response.json();

        if (result.success && result.data) {
          const assistantMessage: WorkspaceChatMessage = {
            id: `assistant-${Date.now().toString()}`,
            role: 'assistant',
            content: result.data.content,
            createAt: Date.now(),
            updateAt: Date.now(),
            meta: createAssistantMeta(selectedModel.name),
            providerId: selectedModel.providerId,
            model: selectedModel.name,
          };
          if (result.data.usage) {
            assistantMessage.usage = {
              inputTokens: result.data.usage.inputTokens,
              outputTokens: result.data.usage.outputTokens,
              totalTokens: result.data.usage.totalTokens,
            };
          }
          setMessages((prev) => [...prev, assistantMessage]);
        } else {
          message.error(result.error?.message ?? '发送消息失败');
        }
      } catch {
        message.error('发送消息失败');
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, selectedModel, id],
  );

  const handleModelSelect = useCallback((modelId: string) => {
    setSelectedModelId(modelId);
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

  // 累计 Token 统计
  const totalUsage = React.useMemo(() => {
    let inputTokens = 0;
    let outputTokens = 0;
    let totalTokens = 0;
    for (const msg of messages) {
      if (msg.usage) {
        inputTokens += msg.usage.inputTokens;
        outputTokens += msg.usage.outputTokens;
        totalTokens += msg.usage.totalTokens;
      }
    }
    return { inputTokens, outputTokens, totalTokens };
  }, [messages]);

  if (!verified) {
    return (
      <Flexbox align="center" justify="center" style={{ height: '100dvh' }}>
        <Text type="secondary">验证中...</Text>
      </Flexbox>
    );
  }

  // 模型加载中
  if (modelsLoading) {
    return (
      <Flexbox align="center" justify="center" style={{ height: 'calc(100dvh - 46px)' }}>
        <Spin size="large" />
      </Flexbox>
    );
  }

  // 无模型配置：显示引导
  if (modelList.length === 0) {
    return (
      <EmptyModelGuide
        onGoToConfig={() => {
          router.push('/provider');
        }}
      />
    );
  }

  const renderChatTab = () => (
    <Flexbox style={{ height: 'calc(100dvh - 46px)' }}>
      {/* 顶部栏 */}
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
            items={modelList}
            currentModelId={selectedModelId}
            onSelect={handleModelSelect}
          />
          {totalUsage.totalTokens > 0 && (
            <Tag color="blue">
              累计: {String(totalUsage.inputTokens)} 输入 / {String(totalUsage.outputTokens)} 输出 / {String(totalUsage.totalTokens)} 总计
            </Tag>
          )}
        </Flexbox>
        <ActionIcon icon={ShareAltOutlined} size="large" />
      </Flexbox>

      {/* 消息列表 */}
      <Flexbox style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        <Flexbox style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
          {messages.length === 0 ? (
            <Flexbox gap={16} align="center" justify="center" style={{ height: '60vh' }}>
              <Avatar avatar="🤖" size={64} />
              <Text type="secondary" style={{ fontSize: 16 }}>
                从任何想法开始，让 AI 帮助你完成工作
              </Text>
            </Flexbox>
          ) : (
            <>
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <React.Fragment key={msg.id}>
                    <ChatItem
                      avatar={isUser ? USER_META : createAssistantMeta(msg.model)}
                      placement={isUser ? 'right' : 'left'}
                      message={msg.content}
                      showAvatar
                      variant="bubble"
                      markdownProps={{
                        variant: 'chat',
                        enableMermaid: true,
                        enableGithubAlert: true,
                        enableLatex: true,
                      }}
                    />
                    {/* AI 回复的 Token 统计 */}
                    {!isUser && msg.usage && (
                      <Flexbox
                        justify="flex-end"
                        style={{ padding: '4px 12px 8px 48px', marginBottom: 8 }}
                      >
                        <Tag>
                          {String(msg.usage.inputTokens)} 输入 / {String(msg.usage.outputTokens)} 输出 / {String(msg.usage.totalTokens)} 总计
                        </Tag>
                      </Flexbox>
                    )}
                  </React.Fragment>
                );
              })}
              {loading && (
                <ChatItem
                  avatar={createAssistantMeta(selectedModel?.name)}
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

      {/* 输入区域 */}
      <Flexbox style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-container)', padding: '12px 16px 16px' }}>
        <Flexbox style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
          <ChatInputActionBar
            rightAddons={
              <ActionIcon
                icon={SendOutlined}
                onClick={handleInputSend}
                loading={loading}
                disabled={!inputValue.trim() || loading || !selectedModel}
                size={{ blockSize: 24 }}
              />
            }
          />
          <ChatInputArea.Inner
            value={inputValue}
            onChange={handleTextAreaChange}
            onSend={handleInputSend}
            loading={loading}
            placeholder={selectedModel ? '从任何想法开始...' : '请先配置模型'}
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

/**
 * 模型选择器组件
 */
function ModelSelector({
  items,
  currentModelId,
  onSelect,
}: {
  items: ModelSelectorItem[];
  currentModelId: string | null;
  onSelect: (id: string) => void;
}) {
  const current = items.find((m) => m.id === currentModelId);

  const menuItems = items.map((model) => ({
    key: model.id,
    label: (
      <Flexbox gap={8} horizontal align="center">
        <ModelIcon model={model.sdkType} size={20} />
        <Text>{model.name}</Text>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {model.providerName}
        </Text>
        {model.authType === 'oauth' && (
          <Tag color="purple" style={{ margin: 0 }}>OAuth</Tag>
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
        <ModelIcon model={current?.sdkType ?? 'openai'} size={18} />
        <Text style={{ fontSize: 14 }}>{current?.name ?? '选择模型'}</Text>
      </Flexbox>
    </Dropdown>
  );
}
