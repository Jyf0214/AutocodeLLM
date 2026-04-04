'use client';

import AppLayout from '@/components/layout/AppLayout';
import { Typography, Empty } from 'antd';
import { useTranslations } from 'next-intl';

const { Title, Paragraph } = Typography;

/**
 * 模型管理页
 */
export default function ModelPage() {
  const t = useTranslations();

  return (
    <AppLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Title level={3}>{t('common.models')}</Title>
        <Paragraph type="secondary">
          配置和管理可用的 AI 模型及其参数。
        </Paragraph>
        <Empty description="功能开发中" />
      </div>
    </AppLayout>
  );
}
