'use client';

import { Text, Collapse, Icon } from '@lobehub/ui';
import { Card } from 'antd';
import { UserOutlined, RobotOutlined, DownOutlined } from '@ant-design/icons';
import ToolCallCard from './ToolCallCard';

interface ToolCall {
  id: string;
  name: string;
  description?: string;
  status: 'success' | 'error' | 'running';
  error?: string;
  duration?: string;
}

interface ThinkingProcess {
  content: string;
  duration: number;
}

interface MessageBubbleProps {
  content?: string | undefined;
  role: 'user' | 'assistant';
  timestamp?: string | undefined;
  avatar?: React.ReactNode;
  toolCalls?: ToolCall[] | undefined;
  thinkingProcess?: ThinkingProcess | undefined;
  className?: string;
}

export default function MessageBubble({
  content,
  role,
  timestamp,
  avatar: _avatar,
  toolCalls,
  thinkingProcess,
  className,
}: MessageBubbleProps) {
  const isUser = role === 'user';

  const AvatarIcon = isUser ? UserOutlined : RobotOutlined;

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        gap: 12,
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: isUser ? 'var(--lobe-color-primary, #1677ff)' : 'var(--lobe-color-neutral, #8c8c8c)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <AvatarIcon style={{ fontSize: 16 }} />
      </div>

      <div
        style={{
          maxWidth: '75%',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          alignItems: isUser ? 'flex-end' : 'flex-start',
        }}
      >
        {thinkingProcess != null && (
          <Card
            variant="borderless"
            style={{
              width: '100%',
              background: 'var(--color-fill-alternate)',
              border: '1px solid var(--color-border)',
            }}
          >
            <Collapse
              items={[
                {
                  key: 'thinking',
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icon icon={DownOutlined} style={{ fontSize: 12 }} />
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        已深度思考 (用时 {thinkingProcess.duration} 秒)
                      </Text>
                    </div>
                  ),
                  children: (
                    <Text type="secondary" style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>
                      {thinkingProcess.content}
                    </Text>
                  ),
                },
              ]}
              bordered={false}
              style={{ margin: 0 }}
            />
          </Card>
        )}

        {toolCalls != null && toolCalls.length > 0 && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {toolCalls.map((tool) => (
              <ToolCallCard
                key={tool.id}
                toolName={tool.name}
                description={tool.description}
                status={tool.status}
                error={tool.error}
                duration={tool.duration}
              />
            ))}
          </div>
        )}

        {content != null && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              background: isUser
                ? 'var(--lobe-color-primary, #1677ff)'
                : 'var(--color-bg-container)',
              color: isUser ? '#fff' : 'var(--color-text)',
              lineHeight: 1.6,
              fontSize: 14,
              border: isUser ? 'none' : '1px solid var(--color-border)',
              whiteSpace: 'pre-wrap',
            }}
          >
            {content}
          </div>
        )}

        {timestamp != null && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {timestamp}
          </Text>
        )}
      </div>
    </div>
  );
}
