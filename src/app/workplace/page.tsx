'use client';

import AppLayout from '@/components/layout/AppLayout';
import { Typography, Button, Empty } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';

const { Title } = Typography;

export default function WorkplacePage() {
  const t = useTranslations();

  return (
    <AppLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <Title level={3} style={{ margin: 0 }}>
            {t('workplace.title')}
          </Title>
          <Button type="primary" icon={<PlusOutlined />}>
            {t('workplace.create')}
          </Button>
        </div>
        <Empty description={t('workplace.empty')} />
      </div>
    </AppLayout>
  );
}
