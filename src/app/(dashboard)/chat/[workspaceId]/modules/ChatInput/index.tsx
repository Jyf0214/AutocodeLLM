/**
 * 本文件是 AutocodeLLM 项目的原始实现
 *
 * AutocodeLLM 项目许可证：
 * Apache License, Version 2.0
 * Copyright (c) 2026 Jyf0214
 */

'use client';

import React, { useCallback } from 'react';
import { Flexbox, ActionIcon } from '@lobehub/ui';
import { ChatInputArea, ChatInputActionBar } from '@lobehub/ui/chat';
import { SendOutlined, PaperClipOutlined } from '@ant-design/icons';
import { Dropdown } from 'antd';
import type { ModelConfig } from '../../store';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  loading: boolean;
  disabled: boolean;
  selectedModel: ModelConfig | null;
  availableModels: ModelConfig[];
  onModelSelect: (modelId: string) => void;
  modelsLoading: boolean;
}

/**
 * 聊天输入组件
 */
export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  loading,
  disabled,
  selectedModel,
  availableModels,
  onModelSelect,
  modelsLoading,
}) => {
  const handleTextAreaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (!disabled && value.trim()) {
          onSend();
        }
      }
    },
    [onSend, disabled, value]
  );

  return (
    <Flexbox
      style={{
        borderTop: '1px solid var(--color-border)',
        background: 'var(--color-bg-layout)',
        padding: '12px 16px 16px',
      }}
    >
      <Flexbox
        style={{
          maxWidth: 800,
          margin: '0 auto',
          width: '100%',
          background: 'var(--color-bg)',
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          padding: '12px',
        }}
      >
        <ChatInputArea.Inner
          value={value}
          onChange={handleTextAreaChange}
          onKeyDown={handleKeyDown}
          onSend={onSend}
          loading={loading}
          placeholder="输入消息... (Ctrl+Enter 发送)"
          autoSize={{ minRows: 1, maxRows: 8 }}
          disabled={disabled}
        />
        
        <Flexbox
          style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--color-border)' }}
        >
          <ChatInputActionBar
            leftAddons={
              <Flexbox gap={4} horizontal align="center">
                {/* 模型选择器 */}
                <Dropdown
                  menu={{
                    items: availableModels.map((model) => ({
                      key: model.id,
                      label: (
                        <Flexbox gap={8} horizontal align="center">
                          <span>{model.name}</span>
                          <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
                            {model.provider}
                          </span>
                        </Flexbox>
                      ),
                      onClick: () => onModelSelect(model.id),
                    })),
                    disabled: modelsLoading || availableModels.length === 0,
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
                      cursor: modelsLoading ? 'not-allowed' : 'pointer',
                      background: 'var(--color-fill-quaternary)',
                      opacity: modelsLoading ? 0.5 : 1,
                    }}
                  >
                    <span style={{ color: 'var(--lobe-color-primary)', fontSize: 16 }}>✻</span>
                    <span style={{ fontSize: 13 }}>
                      {selectedModel?.name ?? '选择模型'}
                    </span>
                  </Flexbox>
                </Dropdown>
                
                {/* 附件按钮 */}
                <ActionIcon
                  icon={PaperClipOutlined}
                  size={{ blockSize: 24 }}
                  disabled
                />
              </Flexbox>
            }
            rightAddons={
              <ActionIcon
                icon={SendOutlined}
                onClick={onSend}
                loading={loading}
                disabled={disabled || !value.trim() || loading || !selectedModel}
                size={{ blockSize: 28 }}
              />
            }
          />
        </Flexbox>
      </Flexbox>
    </Flexbox>
  );
};
