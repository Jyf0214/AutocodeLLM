'use client';

import { useCallback } from 'react';
import { Drawer, List, Typography, Tag } from 'antd';
import { CheckOutlined } from '@ant-design/icons';

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
      title="切换模型"
      placement="bottom"
      onClose={onClose}
      open={open}
      size="50%"
      styles={{
        body: { padding: 0 },
        mask: { backgroundColor: 'rgba(0, 0, 0, 0.45)' },
      }}
      destroyOnHidden
    >
      <List
        dataSource={models}
        renderItem={(model) => (
          <List.Item
            onClick={() => { handleSelect(model.id); }}
            style={{
              padding: '12px 16px',
              cursor: 'pointer',
              background: model.id === currentModelId ? 'var(--color-fill-alternate)' : 'transparent',
              transition: 'background 200ms',
            }}
            onMouseEnter={(e) => {
              if (model.id !== currentModelId) {
                (e.currentTarget as HTMLElement).style.background = 'var(--color-hover-bg)';
              }
            }}
            onMouseLeave={(e) => {
              if (model.id !== currentModelId) {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
              {model.id === currentModelId && (
                <CheckOutlined style={{ color: 'var(--lobe-color-primary, #1677ff)' }} />
              )}
              <div style={{ flex: 1 }}>
                <Typography.Text strong>{model.name}</Typography.Text>
                {model.isDefault != null && model.isDefault && (
                  <Tag color="blue" style={{ marginLeft: 8 }}>
                    默认
                  </Tag>
                )}
              </div>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {model.provider}
              </Typography.Text>
            </div>
          </List.Item>
        )}
      />
    </Drawer>
  );
}
