'use client';

import AppLayout from '@/components/layout/AppLayout';
import { Button, Text, Icon, Empty } from '@lobehub/ui';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';

export default function WorkplacePage() {
  const t = useTranslations();

  return (
    <AppLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Text strong style={{ fontSize: 20, margin: 0 }}>
          {t('workplace.title')}
        </Text>
        <Button type="primary" icon={<Icon icon={PlusOutlined} />}>
          {t('workplace.create')}
        </Button>
      </div>

      <Empty description={t('workplace.empty')} />
    </AppLayout>
  );
}
