/**
 * 本文件是 AutocodeLLM 项目的原始实现
 *
 * AutocodeLLM 项目许可证：
 * Apache License, Version 2.0
 * Copyright (c) 2026 Jyf0214
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { message, Spin } from 'antd';
import { Empty } from '@lobehub/ui';
import { FolderOutlined } from '@ant-design/icons';

import { useChatStore } from './store';
import { ChatLayout } from './components/ChatLayout';
import type { ModelConfig, WorkspaceInfo } from './store';

/**
 * 工作区聊天页面
 * 模块化的多Agent聊天界面
 */
export default function ChatPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const router = useRouter();
  const { workspaceId } = React.use(params);

  // 本地状态
  const [workspace, setWorkspace] = useState<WorkspaceInfo | null>(null);
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');

  // Store
  const {
    initializeChat,
    messages,
    agents,
    models: storeModels,
    setInputValue: storeSetInputValue,
    runSingleAgent,
  } = useChatStore();

  // 选中的模型
  const selectedModel = useMemo(
    () => storeModels.available.find((m: ModelConfig) => m.id === selectedModelId) ?? null,
    [storeModels.available, selectedModelId]
  );

  // 初始化聊天
  useEffect(() => {
    const init = async () => {
      try {
        await initializeChat(workspaceId);
      } catch {
        message.error('初始化聊天失败');
        router.push('/workplace');
      }
    };

    init();
  }, [workspaceId, initializeChat, router]);

  // 加载工作区信息
  useEffect(() => {
    const loadWorkspace = async () => {
      try {
        const response = await fetch(`/api/workspaces/${workspaceId}`);
        const result: { success: boolean; data?: WorkspaceInfo } = await response.json();

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
    if (!trimmed || !selectedModel || agents.status === 'running') {
      return;
    }

    try {
      // 使用Agent执行
      await runSingleAgent({
        message: trimmed,
        model: selectedModel,
      });

      // 清空输入
      setInputValue('');
      storeSetInputValue('');
    } catch (error) {
      message.error('发送消息失败');
    }
  }, [inputValue, selectedModel, agents.status, runSingleAgent, storeSetInputValue]);

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
      isLoading={agents.status === 'running'}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      onSend={handleSend}
      sending={agents.status === 'running'}
      disabled={agents.status === 'running' || !selectedModel}
    />
  );
}
