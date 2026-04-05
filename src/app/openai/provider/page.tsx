'use client';

import AppLayout from '@/components/layout/AppLayout';
import { Text, Empty } from '@lobehub/ui';
import { useTranslations } from 'next-intl';

/**
 * API 提供商配置页
 */
export default function ProviderPage() {
  const t = useTranslations();

  return (
    <AppLayout>
      <Text strong style={{ fontSize: 20, display: 'block', marginBottom: 8 }}>
        {t('common.providers')}
      </Text>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        配置和管理 OpenAI 兼容的 API 提供商连接。
      </Text>
      <Empty description="功能开发中" />
    </AppLayout>
  );
}
