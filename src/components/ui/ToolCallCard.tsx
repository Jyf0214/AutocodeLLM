'use client';

import { useState } from 'react';
import { Icon, Text, Collapse } from '@lobehub/ui';
import { Card } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ToolOutlined, DownOutlined } from '@ant-design/icons';

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

  const statusIcon = status === 'success'
    ? <Icon icon={CheckCircleOutlined} style={{ color: '#52c41a' }} />
    : status === 'error'
      ? <Icon icon={CloseCircleOutlined} style={{ color: '#ff4d4f' }} />
      : <Icon icon={ToolOutlined} spin />;

  const collapseItems = [
    {
      key: 'detail',
      label: null,
      children: (
        <Text type="secondary" style={{ fontSize: 12, whiteSpace: 'pre-wrap' }}>
          {error ?? '无详细信息'}
        </Text>
      ),
    },
  ];

  return (
    <Card
      variant="borderless"
      style={{
        margin: '8px 0',
        border: '1px solid var(--color-border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {statusIcon}
        <Text strong style={{ flex: 1 }}>{toolName}</Text>
        {duration != null && (
          <Text type="secondary" style={{ fontSize: 12 }}>{duration}</Text>
        )}
        {error != null && (
          <Icon
            icon={DownOutlined}
            onClick={() => { setExpanded(!expanded); }}
            style={{
              transform: expanded ? 'rotate(180deg)' : 'none',
              transition: 'transform 200ms',
              cursor: 'pointer',
            }}
          />
        )}
      </div>
      {description != null && (
        <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
          {description}
        </Text>
      )}
      {error != null && (
        <Collapse
          items={collapseItems}
          activeKey={expanded ? ['detail'] : []}
          onChange={(keys) => { setExpanded(keys.length > 0); }}
          bordered={false}
          style={{ marginTop: 8 }}
        />
      )}
    </Card>
  );
}
