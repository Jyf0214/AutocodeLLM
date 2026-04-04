'use client';

import AppLayout from '@/components/layout/AppLayout';
import { Typography, Empty } from 'antd';
import { useTranslations } from 'next-intl';

const { Title, Paragraph } = Typography;

/**
 * API 提供商配置页
 */
export default function ProviderPage() {
  const t = useTranslations();

  return (
    <AppLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Title level={3}>{t('common.providers')}</Title>
        <Paragraph type="secondary">
          配置和管理 OpenAI 兼容的 API 提供商连接。
        </Paragraph>
        <Empty description="功能开发中" />
      </div>
    </AppLayout>
  );
}
