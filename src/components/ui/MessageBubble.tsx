'use client';

import { ChatItem, type MetaData } from '@lobehub/ui/chat';
import { Markdown, Collapse } from '@lobehub/ui';
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

const USER_META: MetaData = {
  title: '用户',
  avatar: 'user',
};

const ASSISTANT_META: MetaData = {
  title: 'AI',
  avatar: '🤖',
};

export default function MessageBubble({
  content,
  role,
  timestamp: _timestamp,
  avatar: _avatar,
  toolCalls,
  thinkingProcess,
  className,
}: MessageBubbleProps) {
  const isUser = role === 'user';
  const meta = isUser ? USER_META : ASSISTANT_META;

  const aboveMessage =
    toolCalls != null && toolCalls.length > 0 ? (
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
    ) : undefined;

  const belowMessage = thinkingProcess != null ? (
    <Collapse
      variant="borderless"
      items={[
        {
          key: 'thinking',
          label: (
            <span style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>
              已深度思考 (用时 {thinkingProcess.duration} 秒)
            </span>
          ),
          children: (
            <div
              style={{
                fontSize: 13,
                color: 'var(--color-text-secondary)',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6,
              }}
            >
              {thinkingProcess.content}
            </div>
          ),
        },
      ]}
      style={{ marginTop: 8 }}
    />
  ) : undefined;

  return (
    <ChatItem
      className={className ?? ''}
      avatar={meta}
      placement={isUser ? 'right' : 'left'}
      showAvatar
      variant="bubble"
      aboveMessage={aboveMessage}
      belowMessage={belowMessage}
      message={
        content != null ? (
          <Markdown variant="chat" enableMermaid enableGithubAlert enableLatex>
            {content}
          </Markdown>
        ) : undefined
      }
      markdownProps={{
        variant: 'chat',
        enableMermaid: true,
        enableGithubAlert: true,
        enableLatex: true,
      }}
    />
  );
}
