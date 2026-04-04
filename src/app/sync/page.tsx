'use client';

import AppLayout from '@/components/layout/AppLayout';
import { Typography, Empty } from 'antd';
import { useTranslations } from 'next-intl';

const { Title, Paragraph } = Typography;

/**
 * 同步管理页
 */
export default function SyncPage() {
  const t = useTranslations();

  return (
    <AppLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Title level={3}>{t('common.sync')}</Title>
        <Paragraph type="secondary">
          管理数据同步、代码仓库同步和配置分发。
        </Paragraph>
        <Empty description="功能开发中" />
      </div>
    </AppLayout>
  );
}
