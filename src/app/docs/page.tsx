'use client';

import AppLayout from '@/components/layout/AppLayout';
import { Typography, Collapse } from 'antd';
import { useTranslations } from 'next-intl';

const { Title, Paragraph } = Typography;

const faqItems = [
  {
    key: '1',
    label: 'AutocodeLLM 是什么？',
    children: (
      <Paragraph>
        AutocodeLLM 是一个基于 LobeHub UI 的 AI 编码代理平台，支持函数调用、任务代理、文件操作、Web
        搜索等完整工具链。
      </Paragraph>
    ),
  },
  {
    key: '2',
    label: '如何配置模型？',
    children: (
      <Paragraph>
        在「模型管理」页面中添加 API 提供商配置，支持 OpenAI、Anthropic、Google、DeepSeek 等主流服务商。
      </Paragraph>
    ),
  },
  {
    key: '3',
    label: 'Demo 模式有什么限制？',
    children: (
      <Paragraph>
        Demo 模式最多可调用 5 个代理，仅支持「仅读取」和「Yolo 模式」两种执行模式，后端交互为模拟响应。
      </Paragraph>
    ),
  },
  {
    key: '4',
    label: '如何同步工作空间？',
    children: (
      <Paragraph>
        在「同步管理」页面中配置 WebDAV 服务，即可将工作空间文件同步到云端或其他设备。
      </Paragraph>
    ),
  },
];

export default function DocsPage() {
  const t = useTranslations();

  return (
    <AppLayout>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <Title level={3}>{t('common.docs')}</Title>
        <Paragraph type="secondary">AutocodeLLM 使用指南与常见问题</Paragraph>

        <Collapse items={faqItems} style={{ marginTop: 24 }} defaultActiveKey={['1']} />
      </div>
    </AppLayout>
  );
}
