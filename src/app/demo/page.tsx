'use client';

import AppLayout from '@/components/layout/AppLayout';
import { Grid, Button, Text, Icon } from '@lobehub/ui';
import { CodeOutlined, BarChartOutlined, ApartmentOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { Card, message } from 'antd';

const scenarios = [
  {
    icon: <Icon icon={ApartmentOutlined} />,
    key: 'office',
    titleKey: 'demo.scenarios.office',
    descriptionKey: 'demo.scenarios.officeDesc',
  },
  {
    icon: <Icon icon={CodeOutlined} />,
    key: 'coding',
    titleKey: 'demo.scenarios.coding',
    descriptionKey: 'demo.scenarios.codingDesc',
  },
  {
    icon: <Icon icon={BarChartOutlined} />,
    key: 'analysis',
    titleKey: 'demo.scenarios.analysis',
    descriptionKey: 'demo.scenarios.analysisDesc',
  },
];

export default function DemoPage() {
  const t = useTranslations();

  const handleStartDemo = () => {
    message.info('🚧 演示场景正在紧张施工中，敬请期待！');
  };

  return (
    <AppLayout>
      <Text strong style={{ fontSize: 20, display: 'block', marginBottom: 8 }}>
        {t('demo.title')}
      </Text>
      <Text type="secondary">{t('demo.description')}</Text>

      <Grid rows={1} maxItemWidth={360} gap={24} style={{ marginTop: 32 }}>
        {scenarios.map((scenario) => (
          <Card
            key={scenario.key}
            hoverable
            style={{ textAlign: 'center' }}
            actions={[
              <Button key="start" type="primary" onClick={handleStartDemo}>
                {t('demo.start')}
              </Button>,
            ]}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
              {scenario.icon}
              <Text strong style={{ fontSize: 16, margin: 0 }}>
                {t(scenario.titleKey)}
              </Text>
              <Text type="secondary">{t(scenario.descriptionKey)}</Text>
            </div>
          </Card>
        ))}
      </Grid>

      <Card style={{ marginTop: 32 }}>
        <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 12 }}>
          {t('demo.limitations.title')}
        </Text>
        <Text>
          {t('demo.limitations.description', { maxAgents: 5 })}
        </Text>
      </Card>
    </AppLayout>
  );
}
