/**
 * 本文件是 AutocodeLLM 项目的原始实现
 *
 * AutocodeLLM 项目许可证：
 * Apache License, Version 2.0
 * Copyright (c) 2026 Jyf0214
 */

'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { Flexbox, Text, Avatar } from '@lobehub/ui';
import { ChatItem, LoadingDots } from '@lobehub/ui/chat';
import type { ChatMessage } from '../../store';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  autoScroll?: boolean;
}

/**
 * 消息列表组件
 */
export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  autoScroll = true,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  const scrollToBottom = useCallback(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [autoScroll]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  return (
    <Flexbox
      ref={containerRef}
      style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '16px',
        background: 'var(--color-bg-layout)',
      }}
    >
      <Flexbox style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
        {messages.length === 0 ? (
          <Flexbox
            gap={20}
            align="center"
            justify="center"
            style={{ flex: 1, padding: '40px 0' }}
          >
            <Flexbox gap={24} align="center">
              <Avatar avatar="🤖" size={72} />
              <Flexbox gap={8} align="center">
                <Text style={{ fontSize: 18, fontWeight: 600, textAlign: 'center' }}>
                  从任何想法开始...
                </Text>
                <Text type="secondary" style={{ fontSize: 14, textAlign: 'center', maxWidth: 320 }}>
                  输入你的问题或想法，AI 助手将帮助你实现
                </Text>
              </Flexbox>
            </Flexbox>
          </Flexbox>
        ) : (
          <>
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <React.Fragment key={msg.id}>
                  <ChatItem
                    avatar={{
                      title: msg.meta?.title ?? (isUser ? '用户' : 'AI'),
                      avatar: msg.meta?.avatar ?? (isUser ? '👤' : '🤖'),
                    }}
                    placement={isUser ? 'right' : 'left'}
                    message={msg.content}
                    showAvatar
                    variant="bubble"
                    markdownProps={{
                      variant: 'chat',
                      enableMermaid: true,
                      enableGithubAlert: true,
                      enableLatex: true,
                    }}
                    belowMessage={
                      !isUser && msg.model ? (
                        <Flexbox
                          horizontal
                          justify="space-between"
                          align="center"
                          style={{
                            marginTop: 8,
                            padding: '4px 8px',
                            fontSize: 12,
                            color: 'var(--color-text-tertiary)',
                          }}
                        >
                          <Flexbox gap={4} horizontal align="center">
                            <span style={{ color: 'var(--lobe-color-primary)' }}>✻</span>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {msg.model}
                            </Text>
                          </Flexbox>
                          {msg.usage && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {msg.usage.totalTokens ?? 0} tokens
                            </Text>
                          )}
                        </Flexbox>
                      ) : undefined
                    }
                    actions={
                      !isUser ? (
                        <Flexbox horizontal gap={8}>
                          <span style={{ cursor: 'pointer' }} title="复制">📋</span>
                          <span style={{ cursor: 'pointer' }} title="重新生成">🔄</span>
                        </Flexbox>
                      ) : undefined
                    }
                  />
                </React.Fragment>
              );
            })}
            
            {isLoading && (
              <ChatItem
                avatar={{
                  title: 'AI 助手',
                  avatar: '🤖',
                }}
                placement="left"
                message={<LoadingDots />}
                showAvatar
                variant="bubble"
              />
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </Flexbox>
    </Flexbox>
  );
};
