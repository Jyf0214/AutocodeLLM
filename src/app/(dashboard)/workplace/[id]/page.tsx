/**
 * 工作区聊天页面 - 极简设计，对齐 LobeChat 风格
 *
 * 本组件灵感来源于 LobeChat 项目（https://github.com/lobehub/lobe-chat）
 * 该项目采用 MIT 许可证。
 *
 * 本实现为独立编写，不包含任何来自 LobeChat 的源代码。
 * 仅使用 @lobehub/ui npm 包提供的公共 API。
 *
 * 原始作品版权所有 (c) 2023 LobeHub（MIT 许可证）
 * 本作品版权所有 (c) 2026 Jyf0214（Apache 2.0 许可证）
 */

'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ActionIcon,
  ActionIconGroup,
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
import { message, Dropdown, Tag, Spin } from 'antd';
import {
  ArrowLeftOutlined,
  ShareAltOutlined,
  SendOutlined,
  PaperClipOutlined,
  DownOutlined,
  CloudServerOutlined,
} from '@ant-design/icons';
import { ModelIcon } from '@lobehub/icons';
import WorkspacePasswordModal from '@/components/features/WorkspacePasswordModal';
import type { WorkspaceListItem } from '@/lib/api/workspace-types';

/**
 * 用户消息元数据
 */
const USER_META: MetaData = {
  title: '用户',
  avatar: '👤',
};

/**
 * 创建 AI 助手元数据
 */
function createAssistantMeta(modelName?: string): MetaData {
  return {
    title: modelName ? `AI 助手 · ${modelName}` : 'AI 助手',
    avatar: '🤖',
  };
}

/**
 * 模型选择器项
 */
interface ModelSelectorItem {
  id: string;
  name: string;
  providerName: string;
  providerId: string;
  enabled: boolean;
  sdkType: string;
  authType: string;
}

/**
 * 工作区聊天消息
 */
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
      style={{ height: '100%', padding: 24 }}
    >
      <Flexbox align="center" gap={24} style={{ maxWidth: 480 }}>
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
          <ActionIcon
            icon={CloudServerOutlined}
            onClick={onGoToConfig}
            size={{ blockSize: 40 }}
          />
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

/**
 * AI 消息操作按钮行
 */
function AIMessageActions({
  onCopy,
  onRegenerate,
}: {
  onCopy: () => void;
  onRegenerate: () => void;
}) {
  return (
    <ActionIconGroup
      items={[
        { key: 'emoji', icon: '😊', label: '表情' },
        { key: 'edit', icon: '✏️', label: '编辑' },
        { key: 'copy', icon: '📋', label: '复制', onClick: onCopy },
        { key: 'regenerate', icon: '🔄', label: '重新生成', onClick: onRegenerate },
        { key: 'more', icon: '⋯', label: '更多' },
      ]}
      onActionClick={(action) => {
        if (action.key === 'copy') {
          onCopy();
        } else if (action.key === 'regenerate') {
          onRegenerate();
        }
      }}
      size={{ blockSize: 28 }}
      variant="borderless"
      style={{ marginTop: 8 }}
    />
  );
}

/**
 * 主页面组件
 */
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

  // 模型和提供商状态
  const [modelList, setModelList] = useState<ModelSelectorItem[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  const selectedModel = useMemo(
    () => modelList.find((m) => m.id === selectedModelId) ?? null,
    [modelList, selectedModelId],
  );

  // 加载模型和提供商列表
  const loadModelsAndProviders = useCallback(async () => {
    setModelsLoading(true);
    try {
      const [modelsRes, providersRes] = await Promise.all([
        fetch('/api/models'),
        fetch('/api/providers'),
      ]);

      const modelsData: {
        success: boolean;
        data?: { id: string; name: string; provider: string; enabled: boolean }[];
      } = await modelsRes.json();
      const providersData: {
        success: boolean;
        data?: { id: string; name: string; sdkType: string; authType: string; enabled: boolean }[];
      } = await providersRes.json();

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

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 发送消息
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

        const result: {
          success: boolean;
          data?: {
            content: string;
            usage?: {
              inputTokens: number;
              outputTokens: number;
              totalTokens: number;
            };
          };
          error?: { message: string };
        } = await response.json();

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
          // 添加错误消息到聊天记录
          const errorMessage: WorkspaceChatMessage = {
            id: `error-${Date.now().toString()}`,
            role: 'assistant',
            content: `模型服务商返回错误。请根据以下信息排查，或稍后重试\n\n\`\`\`json\n${JSON.stringify(result.error ?? { message: '未知错误' }, null, 2)}\n\`\`\``,
            createAt: Date.now(),
            updateAt: Date.now(),
            meta: createAssistantMeta(selectedModel.name),
            providerId: selectedModel.providerId,
            model: selectedModel.name,
            error: { message: result.error?.message ?? '发送消息失败' },
          };
          setMessages((prev) => [...prev, errorMessage]);
        }
      } catch (error) {
        // 添加错误消息到聊天记录
        const errorMessage: WorkspaceChatMessage = {
          id: `error-${Date.now().toString()}`,
          role: 'assistant',
          content: `模型服务商返回错误。请根据以下信息排查，或稍后重试\n\n\`\`\`json\n${JSON.stringify({ error: error instanceof Error ? error.message : '未知错误' }, null, 2)}\n\`\`\``,
          createAt: Date.now(),
          updateAt: Date.now(),
          meta: createAssistantMeta(selectedModel.name),
          providerId: selectedModel.providerId,
          model: selectedModel.name,
          error: { message: '发送消息失败' },
        };
        setMessages((prev) => [...prev, errorMessage]);
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

  // 复制消息内容
  const handleCopyMessage = useCallback((content: string) => {
    void navigator.clipboard.writeText(content);
    message.success('已复制到剪贴板');
  }, []);

  // 重新生成消息
  const handleRegenerateMessage = useCallback(
    async (msg: WorkspaceChatMessage) => {
      if (!selectedModel || loading) return;

      const lastUserMessage = [...messages]
        .reverse()
        .find((m) => m.role === 'user');
      if (!lastUserMessage) return;

      setLoading(true);
      try {
        const response = await fetch(`/api/workspaces/${id}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: messages
              .filter((m) => m.id !== msg.id)
              .map((m) => ({
                role: m.role,
                content: m.content,
              })),
            model: selectedModel.name,
            providerId: selectedModel.providerId,
          }),
        });

        const result: {
          success: boolean;
          data?: {
            content: string;
            usage?: {
              inputTokens: number;
              outputTokens: number;
              totalTokens: number;
            };
          };
          error?: { message: string };
        } = await response.json();

        if (result.success && result.data) {
          const { content, usage } = result.data;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === msg.id
                ? {
                    ...m,
                    content,
                    updateAt: Date.now(),
                    ...(usage ? { usage } : {}),
                  }
                : m,
            ),
          );
        } else {
          message.error(result.error?.message ?? '重新生成失败');
        }
      } catch {
        message.error('重新生成失败');
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, selectedModel, id],
  );

  // 验证状态加载中
  if (!verified) {
    return (
      <Flexbox align="center" justify="center" style={{ height: '100%' }}>
        <Text type="secondary">验证中...</Text>
      </Flexbox>
    );
  }

  // 模型加载中
  if (modelsLoading) {
    return (
      <Flexbox
        align="center"
        justify="center"
        style={{ height: '100%' }}
      >
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

  return (
    <Flexbox style={{ height: '100%', maxHeight: '100dvh', overflow: 'hidden', background: '#f5f5f5' }}>
      {/* 顶部导航栏 - 固定不收缩 */}
      <div style={{ flexShrink: 0 }}>
        <Flexbox
          horizontal
          justify="space-between"
          align="center"
          style={{
            borderBottom: '1px solid #e8e8e8',
            padding: '12px 16px',
            background: '#ffffff',
          }}
        >
          <Flexbox gap={12} horizontal align="center">
            <ActionIcon
              icon={ArrowLeftOutlined}
              onClick={() => {
                router.push('/workplace');
              }}
              size={{ blockSize: 32 }}
            />
            <Dropdown
              menu={{
                items: modelList.map((model) => ({
                  key: model.id,
                  label: (
                    <Flexbox gap={8} horizontal align="center">
                      <ModelIcon model={model.sdkType} size={18} />
                      <Text>{model.name}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {model.providerName}
                      </Text>
                    </Flexbox>
                  ),
                  onClick: () => {
                    handleModelSelect(model.id);
                  },
                })),
              }}
              placement="bottomLeft"
              arrow
            >
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
                <Text strong style={{ fontSize: 15 }}>
                  {workspace?.name ?? '工作区'}
                </Text>
                <DownOutlined style={{ fontSize: 12, color: '#999' }} />
              </Flexbox>
            </Dropdown>
          </Flexbox>
          <ActionIcon icon={ShareAltOutlined} size={{ blockSize: 32 }} />
        </Flexbox>
      </div>

      {/* 聊天消息区 - 自动填充剩余空间 */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Flexbox
          style={{
            height: '100%',
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '16px',
            background: '#f5f5f5',
          }}
        >
          <Flexbox style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
            {messages.length === 0 ? (
              <Flexbox
                gap={20}
                align="center"
                justify="center"
                style={{ flex: 1, padding: '40px 0' }}
              >
                <Flexbox gap={24} align="center">
                  <Avatar avatar="🤖" size={72} />
                  <Flexbox gap={8} align="center">
                    <Text style={{ fontSize: 18, fontWeight: 600, textAlign: 'center' }}>
                      从任何想法开始...
                    </Text>
                    <Text type="secondary" style={{ fontSize: 14, textAlign: 'center', maxWidth: 320 }}>
                      输入你的问题或想法，AI 助手将帮助你实现
                    </Text>
                  </Flexbox>
                </Flexbox>
                {/* 快捷提示按钮 */}
                <Flexbox gap={8} horizontal wrap="wrap" justify="center" style={{ marginTop: 8 }}>
                  <Tag style={{ padding: '6px 12px', cursor: 'pointer', borderRadius: 16 }} onClick={() => setInputValue('帮我写一段 Python 代码')}>
                    💻 写代码
                  </Tag>
                  <Tag style={{ padding: '6px 12px', cursor: 'pointer', borderRadius: 16 }} onClick={() => setInputValue('帮我写一篇文章')}>
                    ✍️ 写文章
                  </Tag>
                  <Tag style={{ padding: '6px 12px', cursor: 'pointer', borderRadius: 16 }} onClick={() => setInputValue('帮我分析这段代码')}>
                    🔍 分析代码
                  </Tag>
                </Flexbox>
              </Flexbox>
            ) : (
            <>
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                const hasError = msg.error != null;
                return (
                  <React.Fragment key={msg.id}>
                    <ChatItem
                      avatar={
                        isUser ? USER_META : createAssistantMeta(msg.model)
                      }
                      placement={isUser ? 'right' : 'left'}
                      message={msg.content}
                      showAvatar
                      variant="bubble"
                      error={hasError ? {
                        type: 'error',
                        message: '模型服务商返回错误',
                        description: msg.error?.message,
                      } : undefined}
                      markdownProps={{
                        variant: 'chat',
                        enableMermaid: true,
                        enableGithubAlert: true,
                        enableLatex: true,
                      }}
                      belowMessage={
                        !isUser && msg.usage ? (
                          <Flexbox
                            horizontal
                            justify="space-between"
                            align="center"
                            style={{
                              marginTop: 8,
                              padding: '4px 8px',
                              fontSize: 12,
                              color: '#999',
                            }}
                          >
                            <Flexbox gap={4} horizontal align="center">
                              <span style={{ color: '#fa8c16' }}>✻</span>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {msg.model}
                              </Text>
                            </Flexbox>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {String(msg.usage.totalTokens)} tokens
                            </Text>
                          </Flexbox>
                        ) : undefined
                      }
                      actions={
                        !isUser ? (
                          <AIMessageActions
                            onCopy={() => {
                              handleCopyMessage(msg.content);
                            }}
                            onRegenerate={() => {
                              handleRegenerateMessage(msg);
                            }}
                          />
                        ) : undefined
                      }
                    />
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
      </div>

      {/* 底部输入区 - 固定不收缩 */}
      <div style={{ flexShrink: 0 }}>
        <Flexbox
        style={{
          borderTop: '1px solid #e8e8e8',
          background: '#f5f5f5',
          padding: '12px 16px 16px',
        }}
      >
        <Flexbox
          style={{
            maxWidth: 800,
            margin: '0 auto',
            width: '100%',
            background: '#ffffff',
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            padding: '12px',
          }}
        >
          <ChatInputArea.Inner
            value={inputValue}
            onChange={handleTextAreaChange}
            onSend={handleInputSend}
            loading={loading}
            placeholder="输入消息... (Ctrl+Enter 发送)"
            autoSize={{ minRows: 1, maxRows: 8 }}
          />
          <Flexbox
            style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}
          >
            <ChatInputActionBar
              leftAddons={
                <Flexbox gap={4} horizontal align="center">
                  {/* 模型选择器（橙色图标） */}
                  <Dropdown
                    menu={{
                      items: modelList.map((model) => ({
                        key: model.id,
                        label: (
                          <Flexbox gap={8} horizontal align="center">
                            <ModelIcon model={model.sdkType} size={18} />
                            <Text>{model.name}</Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {model.providerName}
                            </Text>
                          </Flexbox>
                        ),
                        onClick: () => {
                          handleModelSelect(model.id);
                        },
                      })),
                    }}
                    placement="topLeft"
                    arrow
                  >
                    <Flexbox
                      gap={4}
                      horizontal
                      align="center"
                      style={{
                        padding: '4px 8px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        background: '#fff7e6',
                      }}
                    >
                      <span style={{ color: '#fa8c16', fontSize: 16 }}>✻</span>
                      <Text style={{ fontSize: 13 }}>
                        {selectedModel?.name ?? '选择模型'}
                      </Text>
                    </Flexbox>
                  </Dropdown>
                  {/* 上传和附件 */}
                  <ActionIcon
                    icon={PaperClipOutlined}
                    size={{ blockSize: 24 }}
                  />
                </Flexbox>
              }
              rightAddons={
                <ActionIcon
                  icon={SendOutlined}
                  onClick={handleInputSend}
                  loading={loading}
                  disabled={
                    !inputValue.trim() || loading || !selectedModel
                  }
                  size={{ blockSize: 28 }}
                />
              }
            />
          </Flexbox>
        </Flexbox>
        </Flexbox>
      </div>

      {/* 密码验证弹窗 */}
      {workspace && (
        <WorkspacePasswordModal
          open={passwordModalOpen}
          workspaceId={workspace.id}
          workspaceName={workspace.name}
          onVerified={handleVerified}
          onCancel={handlePasswordCancel}
        />
      )}
    </Flexbox>
  );
}
