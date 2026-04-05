'use client';

import { useState } from 'react';
import { Tag, Icon, Collapse, Text, CodeEditor } from '@lobehub/ui';
import { RightOutlined } from '@ant-design/icons';

interface FunctionCallProps {
  functionName: string;
  parameters: Record<string, unknown>;
  status?: 'pending' | 'running' | 'success' | 'error';
  result?: string;
  className?: string;
}

const statusMap = {
  pending: { color: 'default' as const, text: '等待中' },
  running: { color: 'processing' as const, text: '运行中' },
  success: { color: 'success' as const, text: '成功' },
  error: { color: 'error' as const, text: '失败' },
};

export default function FunctionCall({
  functionName,
  parameters,
  status = 'pending',
  result,
  className,
}: FunctionCallProps) {
  const [expanded, setExpanded] = useState(false);

  const statusInfo = statusMap[status];

  const paramsJson = JSON.stringify(parameters, null, 2);
  const resultLines = result?.split('\n').length ?? 0;
  const paramsLines = Object.keys(parameters).length;

  const collapseItems = [
    {
      key: 'params',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon
            icon={RightOutlined}
            style={{
              transform: expanded ? 'rotate(90deg)' : 'none',
              transition: 'transform 200ms',
            }}
          />
          <code style={{ fontSize: 13 }}>{functionName}</code>
          <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
        </div>
      ),
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
              参数
            </Text>
            <CodeEditor
              value={paramsJson}
              onValueChange={() => {}}
              language="json"
              height={Math.min(paramsLines * 24 + 40, 200)}
              variant="borderless"
            />
          </div>
          {result != null && (
            <div>
              <Text
                type="secondary"
                style={{
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                执行结果
              </Text>
              <CodeEditor
                value={result}
                onValueChange={() => {}}
                language="text"
                height={Math.min(resultLines * 24 + 40, 300)}
                variant="borderless"
              />
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className={className}>
      <Collapse
        items={collapseItems}
        activeKey={expanded ? ['params'] : []}
        onChange={(keys) => {
          setExpanded((keys as string[]).length > 0);
        }}
        bordered={false}
      />
    </div>
  );
}
