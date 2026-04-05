'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { Button, Text, Icon } from '@lobehub/ui';
import { Flex } from 'antd';
import {
  CodeOutlined,
  BarChartOutlined,
  ApartmentOutlined,
  SendOutlined,
  RobotOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { Card, message, Modal, Input, Avatar, Spin } from 'antd';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const scenarios = [
  {
    icon: <Icon icon={ApartmentOutlined} size={32} />,
    key: 'office',
    titleKey: 'demo.scenarios.office',
    descriptionKey: 'demo.scenarios.officeDesc',
  },
  {
    icon: <Icon icon={CodeOutlined} size={32} />,
    key: 'coding',
    titleKey: 'demo.scenarios.coding',
    descriptionKey: 'demo.scenarios.codingDesc',
  },
  {
    icon: <Icon icon={BarChartOutlined} size={32} />,
    key: 'analysis',
    titleKey: 'demo.scenarios.analysis',
    descriptionKey: 'demo.scenarios.analysisDesc',
  },
];

const scenarioNames: Record<string, string> = {
  office: '办公助手',
  coding: '编程助手',
  analysis: '数据分析',
};

// 模拟 AI 回复
const mockAIResponses: Record<string, string> = {
  office: '您好！我是办公助手，可以帮您处理文档、安排日程、撰写邮件等。请告诉我您的需求。',
  coding: '你好！我是编程助手，支持多种编程语言。可以帮您写代码、调试、优化性能等。请描述您的问题。',
  analysis: '您好！我是数据分析助手，可以帮您分析数据、生成图表、提取洞察。请提供您的数据或问题。',
};

/**
 * 模拟 AI 回复延迟
 */
function simulateAIResponse(content: string): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (content.includes('代码') || content.includes('编程')) {
        resolve('这是一个很好的编程问题。我可以帮您：\n1. 分析代码逻辑\n2. 优化性能\n3. 修复 bug\n4. 编写单元测试\n\n请提供更多细节，我会尽力帮助您！');
      } else if (content.includes('数据') || content.includes('分析')) {
        resolve('数据分析是我的强项！我可以帮您：\n1. 数据清洗和预处理\n2. 统计分析和可视化\n3. 趋势预测和洞察提取\n4. 生成专业报告\n\n请分享您的数据集或具体问题。');
      } else {
        resolve(`感谢您的提问："${content}"\n\n这是一个很好的问题。基于我的知识和经验，我建议：\n1. 先明确目标和需求\n2. 制定详细的执行计划\n3. 分步骤实施并及时调整\n4. 持续监控和优化\n\n如果您需要更具体的帮助，请提供更多细节。`);
      }
    }, 1500);
  });
}

/**
 * 检查用户是否已登录
 */
function checkIsLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return !!sessionStorage.getItem('userId');
}

/**
 * 聊天演示组件（可复用）
 */
function ChatDemo({ scenarioKey }: { scenarioKey: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const welcomeContent = mockAIResponses[scenarioKey] ?? '您好！我是 AI 助手，很高兴为您服务。';
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: welcomeContent,
        timestamp: new Date(),
      },
    ]);
  }, [scenarioKey]);

  const handleSend = useCallback(async () => {
    if (!inputValue.trim()) {
      message.warning('请输入消息内容');
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${String(Date.now())}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await simulateAIResponse(userMessage.content);
      const assistantMessage: ChatMessage = {
        id: `assistant-${String(Date.now())}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      message.success('AI 回复已生成');
    } catch {
      message.error('AI 回复生成失败');
    } finally {
      setLoading(false);
    }
  }, [inputValue]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void handleSend();
      }
    },
    [handleSend]
  );

  return (
    <Flex vertical gap={16} style={{ height: '100%' }}>
      <Flex vertical gap={12} style={{ flex: 1, overflow: 'auto' }}>
        {messages.map((msg) => (
          <Flex
            key={msg.id}
            gap={8}
            align="flex-start"
            justify={msg.role === 'user' ? 'flex-end' : 'flex-start'}
          >
            {msg.role === 'assistant' && (
              <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#1677ff' }} />
            )}
            <Card
              size="small"
              style={{
                maxWidth: '70%',
                backgroundColor: msg.role === 'user' ? '#e6f4ff' : '#f5f5f5',
              }}
            >
              <Text style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</Text>
            </Card>
            {msg.role === 'user' && (
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#52c41a' }} />
            )}
          </Flex>
        ))}
        {loading && (
          <Flex gap={8} align="center">
            <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#1677ff' }} />
            <Spin size="small" description="AI 正在思考..." />
          </Flex>
        )}
        <div ref={messagesEndRef} />
      </Flex>

      <Flex gap={8} align="flex-end">
        <Input.TextArea
          value={inputValue}
          onChange={(e) => { setInputValue(e.target.value); }}
          onKeyDown={handleKeyPress}
          placeholder="输入消息... (Enter 发送，Shift+Enter 换行)"
          autoSize={{ minRows: 2, maxRows: 4 }}
          disabled={loading}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={() => { void handleSend(); }}
          loading={loading}
        >
          发送
        </Button>
      </Flex>
    </Flex>
  );
}

export default function DemoPage() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const loggedIn = checkIsLoggedIn();
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [currentScenario, setCurrentScenario] = useState('');

  // 开始演示
  const handleStartDemo = useCallback(
    (scenarioKey: string) => {
      setCurrentScenario(scenarioKey);
      if (checkIsLoggedIn()) {
        // 已登录：直接更新 URL 参数（带菜单栏的完整页面）
        window.history.pushState({}, '', `/demo?scenario=${scenarioKey}`);
      } else {
        // 未登录：弹出全屏 Modal 显示演示内容（无菜单栏）
        setDemoModalOpen(true);
      }
    },
    []
  );

  return (
    <AppLayout>
      <Flex vertical gap={24}>
        <div>
          <Text strong style={{ fontSize: 24, display: 'block', marginBottom: 8 }}>
            {t('demo.title')}
          </Text>
          <Text type="secondary">{t('demo.description')}</Text>
        </div>

        <Flex vertical gap={16}>
          {scenarios.map((scenario) => (
            <Card
              key={scenario.key}
              hoverable
              styles={{ body: { padding: 24 } }}
            >
              <Flex vertical gap={16} align="center">
                {scenario.icon}
                <Text strong style={{ fontSize: 18 }}>
                  {t(scenario.titleKey)}
                </Text>
                <Text type="secondary" style={{ textAlign: 'center' }}>
                  {t(scenario.descriptionKey)}
                </Text>
                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={() => handleStartDemo(scenario.key)}
                  style={{ marginTop: 8 }}
                >
                  {t('demo.start')}
                </Button>
              </Flex>
            </Card>
          ))}
        </Flex>

        <Card
          style={{
            background: 'var(--color-bg-layout)',
            border: 'none',
          }}
        >
          <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 12 }}>
            {t('demo.limitations.title')}
          </Text>
          <Text type="secondary">
            {t('demo.limitations.description', { maxAgents: 5 })}
          </Text>
        </Card>
      </Flex>

      <Modal
        title={
          scenarioNames[currentScenario]
            ? `演示场景 - ${scenarioNames[currentScenario]}`
            : '演示场景'
        }
        open={demoModalOpen}
        onCancel={() => {
          setDemoModalOpen(false);
          setCurrentScenario('');
        }}
        footer={null}
        width="100%"
        styles={{
          body: { height: 'calc(100vh - 120px)', padding: 24 },
        }}
        destroyOnHidden
        centered
      >
        {currentScenario && <ChatDemo scenarioKey={currentScenario} />}
      </Modal>

      {loggedIn && searchParams.get('scenario') && (
        <div style={{ marginTop: 24, padding: 16, background: 'var(--color-bg-container)', borderRadius: 8 }}>
          <ChatDemo scenarioKey={searchParams.get('scenario') ?? ''} />
        </div>
      )}
    </AppLayout>
  );
}
