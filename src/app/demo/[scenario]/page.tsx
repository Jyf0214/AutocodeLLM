'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ActionIcon, Text, Button } from '@lobehub/ui';
import { message, Flex, Spin, Tag } from 'antd';
import {
  ArrowLeftOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import MessageBubble from '@/components/ui/MessageBubble';
import ChatInput from '@/components/ui/ChatInput';

// ==================== 场景配置 ====================

interface ToolCallDemo {
  name: string;
  description: string;
  status: 'success' | 'error' | 'running';
}

interface ScenarioConfig {
  title: string;
  prompt: string;
  welcomeMessage: string;
  simulatedMessages: {
    role: 'user' | 'assistant';
    content?: string;
    thinking?: string;
    toolCalls?: ToolCallDemo[];
  }[];
}

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
  } | undefined;
}

interface DemoMessage extends Message {
  delay?: number;
}

type DemoPhase = 'ready' | 'playing' | 'completed';

const SCENARIO_CONFIGS: Record<string, ScenarioConfig> = {
  office: {
    title: '办公场景演示',
    prompt: '帮我写一份会议纪要模板，包含会议主题、参会人员、讨论内容和待办事项',
    welcomeMessage: '您好！我是办公助手，可以帮您处理文档、安排日程、撰写邮件等。请告诉我您的需求。',
    simulatedMessages: [
      {
        role: 'user',
        content: '帮我写一份会议纪要模板，包含会议主题、参会人员、讨论内容和待办事项',
      },
      {
        role: 'assistant',
        thinking: '用户需要一个结构化的会议纪要模板，我需要创建一个包含基本元素的 Markdown 文件...',
        toolCalls: [
          { name: 'writeFile', description: '创建 会议纪要模板.md', status: 'success' },
        ],
        content: `已为您创建会议纪要模板，包含以下部分：

## 会议基本信息
- 会议主题
- 会议时间/地点
- 参会人员

## 讨论内容
- 议题一
- 议题二

## 待办事项
- [ ] 任务分配
- 负责人
- 截止日期

您可以在工作区中找到该模板并进行个性化修改。`,
      },
    ],
  },
  coding: {
    title: '编程场景演示',
    prompt: '编写一个 Python 代码，能够打印 Hello World，并帮助我执行',
    welcomeMessage: '你好！我是编程助手，支持多种编程语言。可以帮您写代码、调试、优化性能等。请描述您的问题。',
    simulatedMessages: [
      {
        role: 'user',
        content: '编写一个 Python 代码，能够打印 Hello World，并帮助我执行',
      },
      {
        role: 'assistant',
        thinking: '用户需要创建一个简单的 Python 脚本并执行它...',
        toolCalls: [
          { name: 'writeFile', description: '创建 hello.py', status: 'success' },
          { name: 'runCommand', description: '运行 python hello.py', status: 'success' },
        ],
        content: `代码已执行成功！

\`\`\`python
# hello.py
print("Hello, World!")
\`\`\`

**输出结果：**
\`\`\`
Hello, World!
\`\`\`

脚本已保存在工作区中，您可以随时修改和重新运行。需要我帮您添加更多功能吗？`,
      },
    ],
  },
  analysis: {
    title: '数据分析演示',
    prompt: '分析这份销售数据，生成可视化图表并告诉我哪些产品最畅销',
    welcomeMessage: '您好！我是数据分析助手，可以帮您分析数据、生成图表、提取洞察。请提供您的数据或问题。',
    simulatedMessages: [
      {
        role: 'user',
        content: '分析这份销售数据，生成可视化图表并告诉我哪些产品最畅销',
      },
      {
        role: 'assistant',
        thinking: '用户需要数据分析服务，我需要先读取数据文件，然后进行分析并生成图表...',
        toolCalls: [
          { name: 'readFile', description: '读取 sales.csv', status: 'success' },
          { name: 'runCommand', description: '运行分析脚本 analysis.py', status: 'success' },
        ],
        content: `销售数据分析完成！

## 📊 分析结果

### 畅销产品 TOP 3
1. **产品 A** - 销售额 ¥125,000 (占比 32%)
2. **产品 B** - 销售额 ¥98,000 (占比 25%)
3. **产品 C** - 销售额 ¥76,000 (占比 19%)

### 关键洞察
- 产品 A 是明星产品，贡献了三分之一的收入
- 本月总销售额同比增长 15%
- 建议加大对产品 A 的库存投入

可视化图表已生成并保存在工作区中。需要我深入分析某个特定产品吗？`,
      },
    ],
  },
};

// ==================== 主组件 ====================

export default function DemoScenarioPage({
  params,
}: {
  params: Promise<{ scenario: string }>;
}) {
  const router = useRouter();
  const { scenario } = React.use(params);
  const config = SCENARIO_CONFIGS[scenario];

  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [phase, setPhase] = useState<DemoPhase>('ready');
  const [isThinking, setIsThinking] = useState(false);
  const [isProcessingTool, setIsProcessingTool] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // 清理定时器
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking, isProcessingTool]);

  // 开始演示
  const startDemo = useCallback(() => {
    if (!config) return;

    // 清理之前的定时器
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    setMessages([]);
    setPhase('playing');

    let stepIndex = 0;

    // 添加欢迎消息
    const welcomeMsg: DemoMessage = {
      id: 'welcome',
      role: 'assistant',
      content: config.welcomeMessage,
    };
    setMessages([welcomeMsg]);

    // 模拟用户发送消息
    const userDelay = 1000;
    timeoutsRef.current.push(setTimeout(() => {
      const userMsg: DemoMessage = {
        id: `user-${stepIndex}`,
        role: 'user',
        content: config.simulatedMessages[0]?.content ?? '',
      };
      setMessages((prev) => [...prev, userMsg]);
      stepIndex++;
    }, userDelay));

    // AI 思考
    const thinkingDelay = userDelay + 800;
    timeoutsRef.current.push(setTimeout(() => {
      setIsThinking(true);
    }, thinkingDelay));

    // 工具调用
    const toolCallDelay = thinkingDelay + 1500;
    const assistantMsg = config.simulatedMessages[1];
    if (assistantMsg?.toolCalls && assistantMsg.toolCalls.length > 0) {
      setIsThinking(false);
      setIsProcessingTool(true);

      assistantMsg.toolCalls.forEach((tool, toolIndex) => {
        const toolDelay = toolCallDelay + toolIndex * 1200;
        timeoutsRef.current.push(setTimeout(() => {
          const toolMsg: DemoMessage = {
            id: `tool-${toolIndex}`,
            role: 'assistant',
            toolCalls: [{
              id: `tool-${toolIndex}`,
              name: tool.name,
              description: tool.description,
              status: tool.status,
            }],
          };
          setMessages((prev) => [...prev, toolMsg]);
        }, toolDelay));
      });

      // 最终回复
      const finalDelay = toolCallDelay + assistantMsg.toolCalls.length * 1200 + 800;
      timeoutsRef.current.push(setTimeout(() => {
        setIsProcessingTool(false);
        const finalMsg: DemoMessage = {
          id: 'final',
          role: 'assistant',
          content: assistantMsg.content ?? '',
          thinkingProcess: assistantMsg.thinking ? {
            content: assistantMsg.thinking,
            duration: 2,
          } : undefined,
        };
        setMessages((prev) => [...prev, finalMsg]);
        setPhase('completed');
        message.success('演示完成！');
      }, finalDelay));
    } else {
      // 没有工具调用，直接回复
      const finalDelay = thinkingDelay + 1500;
      timeoutsRef.current.push(setTimeout(() => {
        setIsThinking(false);
        const finalMsg: DemoMessage = {
          id: 'final',
          role: 'assistant',
          content: assistantMsg?.content ?? '',
          thinkingProcess: assistantMsg?.thinking ? {
            content: assistantMsg.thinking,
            duration: 2,
          } : undefined,
        };
        setMessages((prev) => [...prev, finalMsg]);
        setPhase('completed');
        message.success('演示完成！');
      }, finalDelay));
    }
  }, [config]);

  // 重新演示
  const restartDemo = useCallback(() => {
    startDemo();
  }, [startDemo]);

  // 返回列表
  const goBack = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    router.push('/demo');
  }, [router]);

  // 如果场景配置不存在
  if (!config) {
    return (
      <Flex align="center" justify="center" style={{ height: '100dvh' }}>
        <Text type="secondary">场景不存在</Text>
      </Flex>
    );
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部导航栏 */}
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
            onClick={goBack}
            size="large"
          />
          <Text strong style={{ fontSize: 16 }}>
            {config.title}
          </Text>
          {phase === 'playing' && (
            <Tag icon={<LoadingOutlined spin />} color="processing">
              演示中
            </Tag>
          )}
          {phase === 'completed' && (
            <Tag icon={<CheckCircleOutlined />} color="success">
              已完成
            </Tag>
          )}
        </Flex>
        <Flex gap={8}>
          {phase === 'ready' && (
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={startDemo}
            >
              开始演示
            </Button>
          )}
          {(phase === 'playing' || phase === 'completed') && (
            <Button
              icon={<ReloadOutlined />}
              onClick={restartDemo}
            >
              重新演示
            </Button>
          )}
        </Flex>
      </Flex>

      {/* 消息区域 */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          background: 'var(--color-bg-layout)',
        }}
      >
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              role={msg.role}
              content={msg.content}
              toolCalls={msg.toolCalls}
              thinkingProcess={msg.thinkingProcess}
            />
          ))}

          {/* 思考中状态 */}
          {isThinking && (
            <Flex gap={12} align="flex-start" style={{ marginBottom: 16 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'var(--lobe-color-neutral, #8c8c8c)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Spin size="small" />
              </div>
              <Text type="secondary">AI 正在思考...</Text>
            </Flex>
          )}

          {/* 工具处理中状态 */}
          {isProcessingTool && (
            <Flex gap={12} align="flex-start" style={{ marginBottom: 16 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'var(--lobe-color-neutral, #8c8c8c)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Spin size="small" />
              </div>
              <Text type="secondary">正在执行工具调用...</Text>
            </Flex>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 底部输入区 */}
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid var(--color-border)',
          background: 'var(--color-bg-container)',
        }}
      >
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          {phase === 'ready' ? (
            <div>
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary">示例提示词（不可编辑）：</Text>
              </div>
              <div
                style={{
                  padding: 12,
                  background: 'var(--color-fill-alternate)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  marginBottom: 12,
                }}
              >
                <Text>{config.prompt}</Text>
              </div>
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={startDemo}
                block
                size="large"
              >
                开始演示
              </Button>
            </div>
          ) : (
            <ChatInput
              onSend={() => {
                message.info('演示模式下不支持手动发送消息');
              }}
              disabled
              placeholder={phase === 'completed' ? '演示已完成，点击"重新演示"可重新开始' : '演示进行中...'}
            />
          )}
        </div>
      </div>
    </div>
  );
}
