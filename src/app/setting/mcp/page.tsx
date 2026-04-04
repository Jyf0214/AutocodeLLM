'use client';

import AppLayout from '@/components/layout/AppLayout';
import { Typography, Empty } from 'antd';
import { useTranslations } from 'next-intl';

const { Title, Paragraph } = Typography;

/**
 * MCP 服务配置页
 */
export default function McpPage() {
  const t = useTranslations('common');

  return (
    <AppLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Title level={3}>{t('mcp')}</Title>
        <Paragraph type="secondary">
          配置和管理 MCP（Model Context Protocol）服务连接。
        </Paragraph>
        <Empty description="功能开发中" />
      </div>
    </AppLayout>
  );
}
