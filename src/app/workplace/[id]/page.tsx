'use client';

import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Typography, Tabs } from 'antd';
import { useTranslations } from 'next-intl';

const { Title } = Typography;

export default function WorkplaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = useTranslations('workplace');
  const { id } = React.use(params);

  const tabItems = [
    { key: 'read', label: t('readFile'), children: <p>文件读取功能开发中...</p> },
    { key: 'write', label: t('writeFile'), children: <p>文件写入功能开发中...</p> },
    { key: 'edit', label: t('editFile'), children: <p>文件编辑功能开发中...</p> },
  ];

  return (
    <AppLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Title level={3}>工作空间: {id}</Title>
        <Tabs items={tabItems} defaultActiveKey="read" />
      </div>
    </AppLayout>
  );
}
