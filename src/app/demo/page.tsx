'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { Button, Text, Icon } from '@lobehub/ui';
import { Flex } from 'antd';
import {
  CodeOutlined,
  BarChartOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { Card } from 'antd';

const scenarios = [
  {
    icon: <Icon icon={ApartmentOutlined} size={32} />,
    key: 'office',
    titleKey: 'demo.scenarios.office',
    descriptionKey: 'demo.scenarios.officeDesc',
    route: '/demo/office',
  },
  {
    icon: <Icon icon={CodeOutlined} size={32} />,
    key: 'coding',
    titleKey: 'demo.scenarios.coding',
    descriptionKey: 'demo.scenarios.codingDesc',
    route: '/demo/coding',
  },
  {
    icon: <Icon icon={BarChartOutlined} size={32} />,
    key: 'analysis',
    titleKey: 'demo.scenarios.analysis',
    descriptionKey: 'demo.scenarios.analysisDesc',
    route: '/demo/analysis',
  },
];

export default function DemoPage() {
  const t = useTranslations();
  const router = useRouter();

  // 开始演示 - 直接跳转到对应场景页面
  const handleStartDemo = useCallback(
    (route: string) => {
      router.push(route);
    },
    [router]
  );

  return (
    <AppLayout>
      <Flex vertical gap={24}>
        <div>
          <Text strong style={{ fontSize: 24, display: 'block', marginBottom: 8 }}>
            {t('demo.title')}
          </Text>
          <Text type="secondary">{t('demo.description')}</Text>
        </div>

        <Flex vertical gap={16}>
          {scenarios.map((scenario) => (
            <Card
              key={scenario.key}
              hoverable
              styles={{ body: { padding: 24 } }}
            >
              <Flex vertical gap={16} align="center">
                {scenario.icon}
                <Text strong style={{ fontSize: 18 }}>
                  {t(scenario.titleKey)}
                </Text>
                <Text type="secondary" style={{ textAlign: 'center' }}>
                  {t(scenario.descriptionKey)}
                </Text>
                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={() => handleStartDemo(scenario.route)}
                  style={{ marginTop: 8 }}
                >
                  {t('demo.start')}
                </Button>
              </Flex>
            </Card>
          ))}
        </Flex>

        <Card
          style={{
            background: 'var(--color-bg-layout)',
            border: 'none',
          }}
        >
          <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 12 }}>
            {t('demo.limitations.title')}
          </Text>
          <Text type="secondary">
            {t('demo.limitations.description', { maxAgents: 5 })}
          </Text>
        </Card>
      </Flex>
    </AppLayout>
  );
}
