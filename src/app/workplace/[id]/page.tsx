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
  TokenTag,
  type MetaData,
} from '@lobehub/ui/chat';
import { Button, Tabs, message, Dropdown, Tag, Spin } from 'antd';
import {
  ArrowLeftOutlined,
  ShareAltOutlined,
  ApiOutlined,
  SettingOutlined,
  FileTextOutlined,
  DesktopOutlined,
  SendOutlined,
  PlusOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { ModelIcon } from '@lobehub/icons';
import WorkspacePasswordModal from '@/components/features/WorkspacePasswordModal';
import WorkspaceSettings from '@/components/features/WorkspaceSettings';
import WorkspaceLogs from '@/components/features/WorkspaceLogs';
import TerminalPanel from '@/components/features/TerminalPanel';
import type { WorkspaceListItem } from '@/lib/api/workspace-types';
import type { ModelConfig } from '@/lib/api/model-types';
import type { Provider } from '@/lib/api/provider-types';

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
}

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
        style={{ maxWidth: 480, textAlign: 'center' }}
      >
        <Avatar
          avatar="🧠"
          size={80}
          background="var(--lobe-color-primary)"
          style={{ boxShadow: '0 8px 24px var(--lobe-color-primary-bg)' }}
        />
        <Flexbox gap={8} align="center">
          <Text style={{ fontSize: 20, fontWeight: 600 }}>
            尚未配置 AI 模型
          </Text>
          <Text type="secondary" style={{ fontSize: 14 }}>
            请先添加一个 AI 提供商（如通义千问、NVIDIA 等），即可开始对话
          </Text>
        </Flexbox>

        <Flexbox gap={12} horizontal>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={onGoToConfig}
          >
            去配置模型
          </Button>
        </Flexbox>

        <Flexbox gap={16} style={{ marginTop: 16, width: '100%' }}>
          <Flexbox
            horizontal
            gap={12}
            justify="center"
            style={{ width: '100%' }}
          >
            <Tag icon={<ApiOutlined />} color="blue">
              支持 OpenAI 兼容 API
            </Tag>
            <Tag icon={<WarningOutlined />} color="orange">
              支持 OAuth 登录
            </Tag>
          </Flexbox>
          <Text type="secondary" style={{ fontSize: 12 }}>
            当前支持通义千问、NVIDIA 等主流提供商
          </Text>
        </Flexbox>
      </Flexbox>
    </Flexbox>
  );
}

/**
 * 模型选择器组件：从动态加载的模型列表中选择
 */
function ModelSelector({
  models,
  currentModel,
  onSelect,
}: {
  models: ModelSelectorItem[];
  currentModel: ModelSelectorItem | null;
  onSelect: (model: ModelSelectorItem) => void;
}) {
  if (!currentModel || models.length === 0) return null;

  const menuItems = models.map((model) => ({
    key: model.id,
    label: (
      <Flexbox gap={8} horizontal align="center">
        <ModelIcon model={model.id} size={20} />
        <Text>{model.name}</Text>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {model.providerName}
        </Text>
        {model.authType === 'oauth' && (
          <Tag color="green" style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>
            OAuth
          </Tag>
        )}
      </Flexbox>
    ),
    onClick: () => {
      onSelect(model);
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
          transition: 'background 0.2s',
        }}
      >
        <ModelIcon model={currentModel.id} size={18} />
        <Text style={{ fontSize: 14 }}>{currentModel.name}</Text>
      </Flexbox>
    </Dropdown>
  );
}

/**
 * Token 统计显示组件
 */
function TokenStats({
  inputTokens,
  outputTokens,
  totalTokens,
}: {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}) {
  return (
    <Flexbox
      horizontal
      gap={12}
      style={{ fontSize: 11, color: 'var(--color-text-secondary)', padding: '4px 0' }}
    >
      <Text type="secondary" style={{ fontSize: 11 }}>
        输入: {inputTokens.toLocaleString()} tokens
      </Text>
      <Text type="secondary" style={{ fontSize: 11 }}>
        输出: {outputTokens.toLocaleString()} tokens
      </Text>
      <Text type="secondary" style={{ fontSize: 11 }}>
        总计: {totalTokens.toLocaleString()} tokens
      </Text>
    </Flexbox>
  );
}

/**
 * 累计 Token 统计栏
 */
function CumulativeTokenStats({ total }: { total: number }) {
  return (
    <Flexbox
      horizontal
      justify="center"
      style={{
        padding: '6px 0',
        borderBottom: '1px solid var(--color-border-secondary)',
        background: 'var(--color-fill-tertiary)',
      }}
    >
      <TokenTag value={total} maxValue={128000} showInfo mode="used" />
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

  // 模型配置状态
  const [models, setModels] = useState<ModelSelectorItem[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [currentModel, setCurrentModel] = useState<ModelSelectorItem | null>(null);

  // 工作区状态
  const [workspace, setWorkspace] = useState<WorkspaceListItem | null>(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [verified, setVerified] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');

  // 累计 token 统计
  const [cumulativeTokens, setCumulativeTokens] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  /**
   * 加载工作区信息
   */
  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        const response = await fetch('/api/workspaces');
        const result: { success: boolean; data?: WorkspaceListItem[] } =
          await response.json();
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

  /**
   * 加载已启用的模型列表（合并 models 和 providers API）
   */
  useEffect(() => {
    const fetchModels = async () => {
      setModelsLoading(true);
      try {
        // 并行获取模型和提供商列表
        const [modelsRes, providersRes] = await Promise.all([
          fetch('/api/models'),
          fetch('/api/providers'),
        ]);

        const modelsData: { success: boolean; data?: ModelConfig[] } =
          await modelsRes.json();
        const providersData: {
          success: boolean;
          data?: Provider[];
          presets?: { id: string; name: string; isAdded: boolean; dbId?: string }[];
        } = await providersRes.json();

        const selectorModels: ModelSelectorItem[] = [];

        // 从 models API 获取已启用的配置
        if (modelsData.success && modelsData.data) {
          for (const model of modelsData.data) {
            if (model.enabled) {
              selectorModels.push({
                id: model.name,
                name: model.name,
                providerName: model.provider,
                providerId: model.id,
                enabled: model.enabled,
                sdkType: 'openai',
                authType: 'apiKey',
              });
            }
          }
        }

        // 从 providers API 获取已启用的提供商（包括 OAuth）
        if (providersData.success && providersData.data) {
          for (const provider of providersData.data) {
            if (provider.enabled) {
              // 避免与 models API 重复
              const exists = selectorModels.some((m) => m.providerId === provider.id);
              if (!exists) {
                selectorModels.push({
                  id: provider.name,
                  name: provider.name,
                  providerName: provider.name,
                  providerId: provider.id,
                  enabled: provider.enabled,
                  sdkType: provider.sdkType,
                  authType: provider.authType,
                });
              }
            }
          }
        }

        setModels(selectorModels);

        // 默认选择第一个已启用的模型
        if (selectorModels.length > 0 && !currentModel) {
          const firstModel = selectorModels[0];
          if (firstModel) {
            setCurrentModel(firstModel);
          }
        }
      } catch {
        message.error('获取模型列表失败');
      } finally {
        setModelsLoading(false);
      }
    };

    fetchModels();
  }, [currentModel]);

  /**
   * 密码验证回调
   */
  const handleVerified = useCallback(() => {
    setVerified(true);
    setPasswordModalOpen(false);
  }, []);

  /**
   * 密码取消回调
   */
  const handlePasswordCancel = useCallback(() => {
    setPasswordModalOpen(false);
    router.push('/workplace');
  }, [router]);

  /**
   * 自动滚动到底部
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * 发送消息
   */
  const handleSend = useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      if (!trimmed || loading) return;

      // 必须有已配置的模型
      if (!currentModel) {
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
            model: currentModel.id,
            providerId: currentModel.providerId,
          }),
        });

        const result: {
          success: boolean;
          data?: {
            content: string;
            usage?: { inputTokens: number; outputTokens: number; totalTokens: number };
            usedProvider?: boolean;
          };
          error?: { message: string; code: string };
        } = await response.json();

        if (response.ok && result.success && result.data) {
          const usage = result.data.usage ?? {
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
          };

          const assistantMessage: WorkspaceChatMessage = {
            id: `assistant-${Date.now().toString()}`,
            role: 'assistant',
            content: result.data.content,
            createAt: Date.now(),
            updateAt: Date.now(),
            meta: createAssistantMeta(currentModel.name),
            usage,
          };

          setMessages((prev) => [...prev, assistantMessage]);
          setCumulativeTokens((prev) => prev + usage.totalTokens);
        } else {
          const errorMsg = result.error?.message ?? '发送消息失败';
          message.error(errorMsg);

          // 添加错误提示消息
          const errorMessage: WorkspaceChatMessage = {
            id: `error-${Date.now().toString()}`,
            role: 'assistant',
            content: `⚠️ ${errorMsg}`,
            createAt: Date.now(),
            updateAt: Date.now(),
            meta: createAssistantMeta(),
          };
          setMessages((prev) => [...prev, errorMessage]);
        }
      } catch {
        message.error('网络错误，发送消息失败');
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, currentModel, id],
  );

  /**
   * 模型选择回调
   */
  const handleModelSelect = useCallback((model: ModelSelectorItem) => {
    setCurrentModel(model);
  }, []);

  /**
   * 前往配置页面
   */
  const handleGoToConfig = useCallback(() => {
    router.push('/provider');
  }, [router]);

  /**
   * 输入框文本变化
   */
  const handleTextAreaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputValue(e.target.value);
    },
    [],
  );

  /**
   * 输入框发送
   */
  const handleInputSend = useCallback(() => {
    handleSend(inputValue);
  }, [handleSend, inputValue]);

  /**
   * 密码验证中的 Loading 页面
   */
  if (!verified) {
    return (
      <Flexbox align="center" justify="center" style={{ height: '100dvh' }}>
        <Spin size="large" />
        <Text type="secondary" style={{ marginTop: 16 }}>
          验证中...
        </Text>
      </Flexbox>
    );
  }

  /**
   * 聊天 Tab 内容
   */
  const renderChatTab = () => {
    // 模型加载中
    if (modelsLoading) {
      return (
        <Flexbox align="center" justify="center" style={{ height: 'calc(100dvh - 46px)' }}>
          <Spin size="large" />
          <Text type="secondary" style={{ marginTop: 16 }}>
            加载模型配置...
          </Text>
        </Flexbox>
      );
    }

    // 无已启用模型：显示引导页面
    if (models.length === 0) {
      return <EmptyModelGuide onGoToConfig={handleGoToConfig} />;
    }

    return (
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
              models={models}
              currentModel={currentModel}
              onSelect={handleModelSelect}
            />
          </Flexbox>
          <ActionIcon icon={ShareAltOutlined} size="large" />
        </Flexbox>

        {/* 累计 Token 统计 */}
        {cumulativeTokens > 0 && <CumulativeTokenStats total={cumulativeTokens} />}

        {/* 消息列表 */}
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
                <Avatar
                  avatar="🤖"
                  size={64}
                  background="var(--lobe-color-primary)"
                />
                <Text type="secondary" style={{ fontSize: 16 }}>
                  开始对话，让 AI 帮助你完成工作
                </Text>
                {currentModel && (
                  <Flexbox horizontal gap={8}>
                    <Tag color="blue">
                      {currentModel.name}
                    </Tag>
                    <Tag>
                      {currentModel.providerName}
                    </Tag>
                  </Flexbox>
                )}
              </Flexbox>
            ) : (
              <>
                {messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  const isLast = msg.id === messages[messages.length - 1]?.id;

                  return (
                    <React.Fragment key={msg.id}>
                      <ChatItem
                        avatar={isUser ? USER_META : (msg.meta ?? createAssistantMeta())}
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
                      {/* AI 回复下方显示 Token 统计 */}
                      {!isUser && msg.usage && (
                        <Flexbox style={{ paddingLeft: 48, marginBottom: 8 }}>
                          <TokenStats
                            inputTokens={msg.usage.inputTokens}
                            outputTokens={msg.usage.outputTokens}
                            totalTokens={msg.usage.totalTokens}
                          />
                        </Flexbox>
                      )}
                    </React.Fragment>
                  );
                })}
                {loading && (
                  <ChatItem
                    avatar={createAssistantMeta(currentModel?.name)}
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
                  <ActionIcon icon={ApiOutlined} size={{ blockSize: 20 }} />
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
                按 Ctrl+Enter 发送
              </Text>
            </Flexbox>
          </Flexbox>
        </Flexbox>
      </Flexbox>
    );
  };

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
