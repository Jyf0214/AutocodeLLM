'use client';

import AppLayout from '@/components/layout/AppLayout';
import { Text, Collapse } from '@lobehub/ui';
import { useTranslations } from 'next-intl';

const faqItems = [
  {
    key: '1',
    label: 'AutocodeLLM 是什么？',
    children: (
      <Text>
        AutocodeLLM 是一个基于 LobeHub UI 的 AI 编码代理平台，支持函数调用、任务代理、文件操作、Web
        搜索等完整工具链。
      </Text>
    ),
  },
  {
    key: '2',
    label: '如何配置模型？',
    children: (
      <Text>
        在「模型管理」页面中添加 API 提供商配置，支持 OpenAI、Anthropic、Google、DeepSeek 等主流服务商。
      </Text>
    ),
  },
  {
    key: '3',
    label: 'Demo 模式有什么限制？',
    children: (
      <Text>
        Demo 模式最多可调用 5 个代理，仅支持「仅读取」和「Yolo 模式」两种执行模式，后端交互为模拟响应。
      </Text>
    ),
  },
  {
    key: '4',
    label: '如何同步工作空间？',
    children: (
      <Text>
        在「同步管理」页面中配置 WebDAV 服务，即可将工作空间文件同步到云端或其他设备。
      </Text>
    ),
  },
];

export default function DocsPage() {
  const t = useTranslations();

  return (
    <AppLayout>
      <Text strong style={{ fontSize: 20, display: 'block', marginBottom: 8 }}>
        {t('common.docs')}
      </Text>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        AutocodeLLM 使用指南与常见问题
      </Text>

      <Collapse items={faqItems} defaultActiveKey={['1']} />
    </AppLayout>
  );
}
