/**
 * 本文件是 AutocodeLLM 项目的原始实现
 *
 * AutocodeLLM 项目许可证：
 * Apache License, Version 2.0
 * Copyright (c) 2026 Jyf0214
 */

'use client';

import React from 'react';
import { Flexbox } from '@lobehub/ui';
import type { ModelConfig, ChatMessage } from '../store';
import { ChatHeader } from './ChatHeader';
import { MessageList } from '../modules/MessageList';
import { ChatInput } from '../modules/ChatInput';

interface ChatLayoutProps {
  // 工作区信息
  workspaceName?: string;
  
  // 模型相关
  selectedModel: ModelConfig | null;
  availableModels: ModelConfig[];
  onModelSelect: (modelId: string) => void;
  modelsLoading: boolean;
  
  // 消息相关
  messages: ChatMessage[];
  isLoading: boolean;
  
  // 输入相关
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  sending: boolean;
  disabled: boolean;
}

/**
 * 聊天布局组件
 * 三栏布局：Header + MessageList + ChatInput
 */
export const ChatLayout: React.FC<ChatLayoutProps> = ({
  workspaceName,
  selectedModel,
  availableModels,
  onModelSelect,
  modelsLoading,
  messages,
  isLoading,
  inputValue,
  onInputChange,
  onSend,
  sending,
  disabled,
}) => {
  return (
    <Flexbox style={{ height: '100%', overflow: 'hidden' }}>
      {/* 顶部导航栏 */}
      <ChatHeader
        workspaceName={workspaceName}
        selectedModel={selectedModel}
        availableModels={availableModels}
        onModelSelect={onModelSelect}
        modelsLoading={modelsLoading}
      />

      {/* 消息列表区 - 自动填充剩余空间 */}
      <MessageList
        messages={messages}
        isLoading={isLoading}
      />

      {/* 底部输入区 - 固定在底部 */}
      <ChatInput
        value={inputValue}
        onChange={onInputChange}
        onSend={onSend}
        loading={sending}
        disabled={disabled}
        selectedModel={selectedModel}
        availableModels={availableModels}
        onModelSelect={onModelSelect}
        modelsLoading={modelsLoading}
      />
    </Flexbox>
  );
};
