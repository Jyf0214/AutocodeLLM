'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ActionIcon } from '@lobehub/ui';
import { Flex, Typography } from 'antd';
import {
  ArrowLeftOutlined,
  ShareAltOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import MessageBubble from '@/components/ui/MessageBubble';
import ChatInput from '@/components/ui/ChatInput';
import ModelSwitcher from '@/components/ui/ModelSwitcher';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content?: string;
  timestamp?: string;
  toolCalls?: {
    id: string;
    name: string;
    description?: string;
    status: 'success' | 'error' | 'running';
    error?: string;
    duration?: string;
  }[];
  thinkingProcess?: {
    content: string;
    duration: number;
  };
}

const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'user',
    content: '调用函数写入 hello world',
    timestamp: '10:30',
  },
  {
    id: '2',
    role: 'assistant',
    thinkingProcess: {
      content: '用户要求创建一个文件并写入 "hello world"。我需要：\n1. 使用文件写入工具\n2. 指定文件路径为 hello.txt\n3. 写入内容为 "hello world"',
      duration: 3,
    },
    toolCalls: [
      {
        id: 'tool-1',
        name: 'writeFile',
        description: '写入文件 hello.txt',
        status: 'success',
        duration: '1.2s',
      },
    ],
    content: '已成功创建 hello.txt 并写入 "hello world"。',
    timestamp: '10:30',
  },
  {
    id: '3',
    role: 'assistant',
    toolCalls: [
      {
        id: 'tool-2',
        name: 'readFile',
        description: '读取文件验证内容',
        status: 'error',
        error: 'Error: File not found at specified path\n    at readFile (file:123:45)\n    at processTicksAndRejections (internal:90:12)',
        duration: '0.5s',
      },
    ],
    content: '读取文件时遇到错误，请检查路径是否正确。',
    timestamp: '10:31',
  },
];

const MOCK_MODELS = [
  { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', isDefault: true },
  { id: 'claude-3', name: 'Claude 3', provider: 'Anthropic' },
  { id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google' },
  { id: 'deepseek-coder', name: 'DeepSeek Coder', provider: 'DeepSeek' },
];

export default function WorkplaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = React.use(params);
  void id;
  const [messages] = useState(MOCK_MESSAGES);
  const [modelDrawerOpen, setModelDrawerOpen] = useState(false);
  const [currentModelId, setCurrentModelId] = useState('gpt-4');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null) as React.RefObject<HTMLDivElement | null>;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(
    (message: string) => {
      void message;
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
      }, 2000);
    },
    [],
  );

  const handleStop = useCallback(() => {
    setLoading(false);
  }, []);

  const handleModelSelect = useCallback((modelId: string) => {
    setCurrentModelId(modelId);
  }, []);

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <Flex
        align="center"
        justify="space-between"
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-bg-container)',
        }}
      >
        <Flex gap={8} align="center">
          <ActionIcon
            icon={ArrowLeftOutlined}
            onClick={() => { router.push('/workplace'); }}
            size="large"
          />
          <Typography.Title level={5} style={{ margin: 0 }}>
            调用函数写入 hello world
          </Typography.Title>
        </Flex>
        <Flex gap={8}>
          <ActionIcon
            icon={ApiOutlined}
            onClick={() => { setModelDrawerOpen(true); }}
            size="large"
          />
          <ActionIcon icon={ShareAltOutlined} size="large" />
        </Flex>
      </Flex>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
        }}
      >
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              role={msg.role}
              content={msg.content}
              timestamp={msg.timestamp}
              toolCalls={msg.toolCalls}
              thinkingProcess={msg.thinkingProcess}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div
        style={{
          padding: '16px',
          borderTop: '1px solid var(--color-border)',
          background: 'var(--color-bg-container)',
        }}
      >
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <ChatInput
            onSend={handleSend}
            onStop={handleStop}
            loading={loading}
          />
        </div>
      </div>

      <ModelSwitcher
        models={MOCK_MODELS}
        currentModelId={currentModelId}
        onSelect={handleModelSelect}
        open={modelDrawerOpen}
        onClose={() => { setModelDrawerOpen(false); }}
      />
    </div>
  );
}
