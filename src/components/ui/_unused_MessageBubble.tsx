/**
 * This component is inspired by the LobeChat project (https://github.com/lobehub/lobe-chat)
 * which is licensed under the MIT License.
 *
 * This implementation is independently written and does not contain any
 * copied source code from LobeChat. It only uses the public APIs provided
 * by the @lobehub/ui npm package.
 *
 * Original work Copyright (c) 2023 LobeHub (MIT License)
 * This work Copyright (c) 2026 Jyf0214 (Apache License 2.0)
 */

'use client';

import { ChatItem, type MetaData } from '@/ui/chat';
import { Markdown, Collapse } from '@/lib/ui';
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
  content: string | undefined;
  role: 'user' | 'assistant';
  toolCalls: ToolCall[] | undefined;
  thinkingProcess: ThinkingProcess | undefined;
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
  toolCalls,
  thinkingProcess,
  className,
}: MessageBubbleProps) {
  const isUser = role === 'user';
  const meta = isUser ? USER_META : ASSISTANT_META;

  const aboveMessage =
    toolCalls != null && toolCalls.length > 0 ? (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
