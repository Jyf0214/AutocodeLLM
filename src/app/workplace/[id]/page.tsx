'use client';

import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Tabs, Text } from '@lobehub/ui';
import { useTranslations } from 'next-intl';

export default function WorkplaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = useTranslations();
  const { id } = React.use(params);

  const tabItems = [
    {
      key: 'read',
      label: t('workplace.readFile'),
      children: <Text>文件读取功能开发中...</Text>,
    },
    {
      key: 'write',
      label: t('workplace.writeFile'),
      children: <Text>文件写入功能开发中...</Text>,
    },
    {
      key: 'edit',
      label: t('workplace.editFile'),
      children: <Text>文件编辑功能开发中...</Text>,
    },
  ];

  return (
    <AppLayout>
      <Text strong style={{ fontSize: 20, display: 'block', marginBottom: 24 }}>
        工作空间: {id}
      </Text>
      <Tabs items={tabItems} defaultActiveKey="read" />
    </AppLayout>
  );
}
