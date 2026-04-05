'use client';

import AppLayout from '@/components/layout/AppLayout';
import { Text, Empty } from '@lobehub/ui';
import { useTranslations } from 'next-intl';

/**
 * 任务代理编排页
 */
export default function AgentsPage() {
  const t = useTranslations();

  return (
    <AppLayout>
      <Text strong style={{ fontSize: 20, display: 'block', marginBottom: 8 }}>
        {t('common.agents')}
      </Text>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        编排和管理自动化任务代理工作流。
      </Text>
      <Empty description="功能开发中" />
    </AppLayout>
  );
}
