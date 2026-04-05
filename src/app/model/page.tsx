'use client';

import AppLayout from '@/components/layout/AppLayout';
import { Text, Empty } from '@lobehub/ui';
import { useTranslations } from 'next-intl';

/**
 * 模型管理页
 */
export default function ModelPage() {
  const t = useTranslations();

  return (
    <AppLayout>
      <Text strong style={{ fontSize: 20, display: 'block', marginBottom: 8 }}>
        {t('common.models')}
      </Text>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        配置和管理可用的 AI 模型及其参数。
      </Text>
      <Empty description="功能开发中" />
    </AppLayout>
  );
}
