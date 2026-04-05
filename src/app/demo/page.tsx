'use client';

import { useState, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button, Text, Icon } from '@lobehub/ui';
import { Flex } from 'antd';
import {
  CodeOutlined,
  BarChartOutlined,
  ApartmentOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { Card, message, Drawer, Typography } from 'antd';

const scenarios = [
  {
    icon: <Icon icon={ApartmentOutlined} size={32} />,
    key: 'office',
    titleKey: 'demo.scenarios.office',
    descriptionKey: 'demo.scenarios.officeDesc',
  },
  {
    icon: <Icon icon={CodeOutlined} size={32} />,
    key: 'coding',
    titleKey: 'demo.scenarios.coding',
    descriptionKey: 'demo.scenarios.codingDesc',
  },
  {
    icon: <Icon icon={BarChartOutlined} size={32} />,
    key: 'analysis',
    titleKey: 'demo.scenarios.analysis',
    descriptionKey: 'demo.scenarios.analysisDesc',
  },
];

export default function DemoPage() {
  const t = useTranslations();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleStartDemo = useCallback(() => {
    message.info('🚧 演示场景正在紧张施工中，敬请期待！');
  }, []);

  return (
    <AppLayout>
      <Flex vertical gap={24}>
        <div>
          <Typography.Title level={2} style={{ margin: 0 }}>
            {t('demo.title')}
          </Typography.Title>
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
                  onClick={handleStartDemo}
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

      <Drawer
        placement="right"
        onClose={() => { setDrawerOpen(false); }}
        open={drawerOpen}
        size="85%"
        styles={{
          body: { padding: '16px 0' },
          mask: { backgroundColor: 'rgba(0, 0, 0, 0.45)' },
        }}
        destroyOnHidden
        extra={
          <Button type="text" icon={<CloseOutlined />} onClick={() => { setDrawerOpen(false); }} />
        }
      >
        <Typography.Title level={4}>菜单</Typography.Title>
      </Drawer>
    </AppLayout>
  );
}
