'use client';

import AppLayout from '@/components/layout/AppLayout';
import { Text, Empty } from '@lobehub/ui';
import { useTranslations } from 'next-intl';

/**
 * 环境变量管理页
 */
export default function EnvPage() {
  const t = useTranslations();

  return (
    <AppLayout>
      <Text strong style={{ fontSize: 20, display: 'block', marginBottom: 8 }}>
        {t('common.env')}
      </Text>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        管理和配置系统环境变量与运行时参数。
      </Text>
      <Empty description="功能开发中" />
    </AppLayout>
  );
}
