/**
 * 本文件是 AutocodeLLM 项目的原始实现
 *
 * AutocodeLLM 项目许可证：
import type { ChatMessage } from "./store/types";
 * Apache License, Version 2.0
 * Copyright (c) 2026 Jyf0214
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { message, Spin } from 'antd';
import { Empty } from '@lobehub/ui';
import { FolderOutlined } from '@ant-design/icons';

import { ChatStoreProvider } from './store';
import { ChatLayout } from './components/ChatLayout';
import type { ModelConfig, WorkspaceInfo } from './store';

/**
 * 工作区聊天页面
 * 模块化的多Agent聊天界面
 */
function ChatPageInner({
  workspaceId,
}: {
  workspaceId: string;
}) {
  const router = useRouter();

  // 本地状态
  const [workspace, setWorkspace] = useState<WorkspaceInfo | null>(null);
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [agentStatus, setAgentStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');

  // 选中的模型
  const selectedModel = useMemo(
    () => models.find((m) => m.id === selectedModelId) ?? null,
    [models, selectedModelId]
  );

  // 加载工作区信息
  useEffect(() => {
    const loadWorkspace = async () => {
      try {
        const response = await fetch(`/api/workspaces/${workspaceId}`);
        const result = await response.json();
        if (result.success && result.data) {
          setWorkspace(result.data);
        } else {
          message.error('获取工作区信息失败');
          router.push('/workplace');
        }
      } catch {
        message.error('获取工作区信息失败');
        router.push('/workplace');
      }
    };

    loadWorkspace();
  }, [workspaceId, router]);

  // 加载模型列表
  useEffect(() => {
    const loadModels = async () => {
      setModelsLoading(true);
      try {
        const [modelsRes, providersRes] = await Promise.all([
          fetch('/api/models'),
          fetch('/api/providers'),
        ]);

        const modelsData: {
          success: boolean;
          data?: Array<{ id: string; name: string; provider: string; enabled: boolean }>;
        } = await modelsRes.json();
        const providersData: {
          success: boolean;
          data?: Array<{ id: string; name: string; sdkType: string; authType: string; enabled: boolean }>;
        } = await providersRes.json();

        const items: ModelConfig[] = [];

        // 合并模型配置
        if (modelsData.success && modelsData.data) {
          for (const m of modelsData.data) {
            if (m.enabled) {
              items.push({
                id: m.id,
                name: m.name,
                provider: m.provider,
                providerId: m.id,
                enabled: m.enabled,
                sdkType: 'openai',
                authType: 'apiKey',
              });
            }
          }
        }

        // 合并提供商
        if (providersData.success && providersData.data) {
          for (const p of providersData.data) {
            if (p.enabled && !items.find((i) => i.id === p.id)) {
              items.push({
                id: p.id,
                name: p.name,
                provider: p.name,
                providerId: p.id,
                enabled: p.enabled,
                sdkType: p.sdkType,
                authType: p.authType,
              });
            }
          }
        }

        setModels(items);
        if (items.length > 0) {
          setSelectedModelId(items[0]?.id ?? null);
        }
      } catch {
        message.error('获取模型列表失败');
      } finally {
        setModelsLoading(false);
      }
    };

    loadModels();
  }, []);

  // 输入变化
  const handleInputChange = useCallback(
    (value: string) => {
      setInputValue(value);
      storeSetInputValue(value);
    },
    [storeSetInputValue]
  );

  // 模型选择
  const handleModelSelect = useCallback((modelId: string) => {
    setSelectedModelId(modelId);
  }, []);

  // 发送消息
  const handleSend = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || !selectedModel || agentStatus === 'running') return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: trimmed,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      meta: { title: '用户', avatar: '👤' },
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setAgentStatus('running');

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const assistantMessage: ChatMessage = {
      id: `msg-${Date.now()}-assistant`,
      role: 'assistant',
      content: `这是对"${trimmed}"的回复`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      meta: { title: `AI · ${selectedModel.name}`, avatar: '🤖' },
      model: selectedModel.name,
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setAgentStatus('completed');
    setTimeout(() => setAgentStatus('idle'), 3000);
  }, [inputValue, selectedModel, agentStatus]);

  // 加载中
  if (!workspace) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh' }}>
        <Spin size="large" />
      </div>
    );
  }

  // 无模型配置
  if (models.length === 0 && !modelsLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh' }}>
        <Empty
          icon={<FolderOutlined />}
          title="配置 AI 模型后即可开始对话"
          description="您需要先配置至少一个 AI 模型，才能使用聊天功能。"
        />
      </div>
    );
  }

  return (
    <ChatLayout
      workspaceName={workspace.name}
      selectedModel={selectedModel}
      availableModels={models}
      onModelSelect={handleModelSelect}
      modelsLoading={modelsLoading}
      messages={messages}
      isLoading={agentStatus === 'running'}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      onSend={handleSend}
      sending={agentStatus === 'running'}
      disabled={agentStatus === 'running' || !selectedModel}
    />
  );
}

export default function ChatPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = React.use(params);
  return (
    <ChatStoreProvider>
      <ChatPageInner workspaceId={workspaceId} />
    </ChatStoreProvider>
  );
}
