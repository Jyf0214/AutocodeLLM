'use client';

import AppLayout from '@/components/layout/AppLayout';
import { Typography, Empty } from 'antd';
import { useTranslations } from 'next-intl';

const { Title, Paragraph } = Typography;

/**
 * Worker 节点管理页
 */
export default function WorkersPage() {
  const t = useTranslations('common');

  return (
    <AppLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Title level={3}>{t('workers')}</Title>
        <Paragraph type="secondary">
          监控和管理 Worker 节点状态与资源分配。
        </Paragraph>
        <Empty description="功能开发中" />
      </div>
    </AppLayout>
  );
}
