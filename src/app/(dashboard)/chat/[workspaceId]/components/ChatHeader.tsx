/**
 * 本文件是 AutocodeLLM 项目的原始实现
 *
 * AutocodeLLM 项目许可证：
 * Apache License, Version 2.0
 * Copyright (c) 2026 Jyf0214
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Flexbox, Text, ActionIcon } from '@lobehub/ui';
import { ArrowLeftOutlined, ShareAltOutlined } from '@ant-design/icons';
import { Dropdown } from 'antd';
import type { ModelConfig } from '../store';

interface ChatHeaderProps {
  workspaceName: string | undefined;
  selectedModel: ModelConfig | null;
  availableModels: ModelConfig[];
  onModelSelect: (modelId: string) => void;
  modelsLoading: boolean;
}

/**
 * 聊天头部组件
 */
export const ChatHeader: React.FC<ChatHeaderProps> = ({
  workspaceName = '工作区',
  selectedModel,
  availableModels,
  onModelSelect,
  modelsLoading,
}) => {
  const router = useRouter();

  return (
    <Flexbox
      horizontal
      justify="space-between"
      align="center"
      style={{
        borderBottom: '1px solid var(--color-border)',
        padding: '12px 16px',
        background: 'var(--color-bg)',
      }}
    >
      <Flexbox gap={12} horizontal align="center">
        <ActionIcon
          icon={ArrowLeftOutlined}
          onClick={() => router.push('/workplace')}
          size={{ blockSize: 32 }}
        />
        
        <Dropdown
          menu={{
            items: availableModels.map((model) => ({
              key: model.id,
              label: (
                <Flexbox gap={8} horizontal align="center">
                  <Text>{model.name}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {model.provider}
                  </Text>
                </Flexbox>
              ),
              onClick: () => onModelSelect(model.id),
            })),
            disabled: modelsLoading || availableModels.length === 0,
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
              cursor: modelsLoading ? 'not-allowed' : 'pointer',
              opacity: modelsLoading ? 0.5 : 1,
            }}
          >
            <Text strong style={{ fontSize: 15 }}>
              {workspaceName}
            </Text>
            {selectedModel && (
              <>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  ·
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {selectedModel.name}
                </Text>
              </>
            )}
          </Flexbox>
        </Dropdown>
      </Flexbox>

      <ActionIcon icon={ShareAltOutlined} size={{ blockSize: 32 }} />
    </Flexbox>
  );
};
