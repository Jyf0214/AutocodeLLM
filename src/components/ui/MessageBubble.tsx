'use client';

import { Avatar, Text } from '@lobehub/ui';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';

interface MessageBubbleProps {
  content: string;
  role: 'user' | 'assistant';
  timestamp?: string;
  avatar?: React.ReactNode;
  className?: string;
}

export default function MessageBubble({
  content,
  role,
  timestamp,
  avatar,
  className,
}: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        gap: 12,
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
      }}
    >
      <Avatar
        title={isUser ? '用户' : '助手'}
        avatar={
          avatar ?? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
              {isUser ? <UserOutlined /> : <RobotOutlined />}
            </div>
          )
        }
        size={32}
      />
      <div
        style={{
          maxWidth: '70%',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          alignItems: isUser ? 'flex-end' : 'flex-start',
        }}
      >
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 12,
            background: isUser ? 'var(--lobe-color-primary)' : 'var(--bg-secondary)',
            color: isUser ? '#fff' : 'var(--text-primary)',
            lineHeight: 1.6,
            fontSize: 14,
          }}
        >
          {content}
        </div>
        {timestamp != null && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {timestamp}
          </Text>
        )}
      </div>
    </div>
  );
}
