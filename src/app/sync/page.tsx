'use client';

import AppLayout from '@/components/layout/AppLayout';
import { Text, Empty } from '@lobehub/ui';
import { useTranslations } from 'next-intl';

/**
 * 同步管理页
 */
export default function SyncPage() {
  const t = useTranslations();

  return (
    <AppLayout>
      <Text strong style={{ fontSize: 20, display: 'block', marginBottom: 8 }}>
        {t('common.sync')}
      </Text>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        管理数据同步、代码仓库同步和配置分发。
      </Text>
      <Empty description="功能开发中" />
    </AppLayout>
  );
}
