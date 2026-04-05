'use client';

import { useCallback } from 'react';
import { Drawer, Flexbox, Text } from '@lobehub/ui';
import { Tag } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { ModelIcon } from '@lobehub/icons';

interface Model {
  id: string;
  name: string;
  provider: string;
  isDefault?: boolean;
}

interface ModelSwitcherProps {
  models: Model[];
  currentModelId: string;
  onSelect: (modelId: string) => void;
  open: boolean;
  onClose: () => void;
}

export default function ModelSwitcher({
  models,
  currentModelId,
  onSelect,
  open,
  onClose,
}: ModelSwitcherProps) {
  const handleSelect = useCallback(
    (modelId: string) => {
      onSelect(modelId);
      onClose();
    },
    [onSelect, onClose],
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="切换模型"
      placement="bottom"
      size="50%"
      destroyOnHidden
    >
      <Flexbox gap={4}>
        {models.map((model) => {
          const isSelected = model.id === currentModelId;

          return (
            <div
              key={model.id}
              onClick={() => {
                handleSelect(model.id);
              }}
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                cursor: 'pointer',
                background: isSelected ? 'var(--color-hover-bg)' : 'transparent',
                transition: 'background 200ms',
              }}
              onMouseEnter={(e: React.MouseEvent) => {
                if (!isSelected) {
                  (e.currentTarget as HTMLElement).style.background = 'var(--color-hover-bg)';
                }
              }}
              onMouseLeave={(e: React.MouseEvent) => {
                if (!isSelected) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }
              }}
            >
              <Flexbox gap={12} horizontal align="center">
                {isSelected && (
                  <CheckOutlined style={{ color: 'var(--lobe-color-primary)' }} />
                )}
                <ModelIcon model={model.id} size={24} />
                <Flexbox flex={1}>
                  <Flexbox gap={8} horizontal align="center">
                    <Text strong>{model.name}</Text>
                    {model.isDefault != null && model.isDefault && (
                      <Tag color="blue" style={{ margin: 0, fontSize: 10 }}>
                        默认
                      </Tag>
                    )}
                  </Flexbox>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {model.provider}
                  </Text>
                </Flexbox>
              </Flexbox>
            </div>
          );
        })}
      </Flexbox>
    </Drawer>
  );
}
