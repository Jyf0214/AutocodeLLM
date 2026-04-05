'use client';

import { useState } from 'react';
import { Text, Collapse } from '@lobehub/ui';
import { CheckCircleOutlined, CloseCircleOutlined, ToolOutlined } from '@ant-design/icons';

interface ToolCallCardProps {
  toolName: string;
  description?: string | undefined;
  status: 'success' | 'error' | 'running';
  error?: string | undefined;
  duration?: string | undefined;
}

export default function ToolCallCard({
  toolName,
  description,
  status,
  error,
  duration,
}: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(status === 'error');

  const statusIcon =
    status === 'success'
      ? <CheckCircleOutlined style={{ color: 'var(--lobe-color-success)' }} />
      : status === 'error'
        ? <CloseCircleOutlined style={{ color: 'var(--lobe-color-error)' }} />
        : <ToolOutlined spin style={{ color: 'var(--color-text-tertiary)' }} />;

  return (
    <div
      style={{
        padding: '8px 12px',
        borderRadius: 8,
        border: '1px solid var(--color-border)',
        background: 'var(--color-fill-quaternary)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {statusIcon}
        <Text strong style={{ flex: 1 }}>
          {toolName}
        </Text>
        {duration != null && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {duration}
          </Text>
        )}
      </div>
      {description != null && (
        <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
          {description}
        </Text>
      )}
      {error != null && (
        <Collapse
          variant="borderless"
          items={[
            {
              key: 'detail',
              label: '查看详情',
              children: (
                <Text type="secondary" style={{ fontSize: 12, whiteSpace: 'pre-wrap' }}>
                  {error}
                </Text>
              ),
            },
          ]}
          activeKey={expanded ? ['detail'] : []}
          onChange={(keys) => {
            setExpanded(keys.length > 0);
          }}
          style={{ marginTop: 8 }}
        />
      )}
    </div>
  );
}
