'use client';

import AppLayout from '@/components/layout/AppLayout';
import { Grid, Button, Text, Icon } from '@lobehub/ui';
import { CodeOutlined, BarChartOutlined, ApartmentOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { Card } from 'antd';

const scenarios = [
  {
    icon: <Icon icon={ApartmentOutlined} />,
    key: 'office',
    titleKey: 'demo:scenarios.office',
    description: '文档生成、数据处理、邮件撰写等办公自动化场景',
  },
  {
    icon: <Icon icon={CodeOutlined} />,
    key: 'coding',
    titleKey: 'demo:scenarios.coding',
    description: '代码生成、Bug 修复、重构建议等编码辅助场景',
  },
  {
    icon: <Icon icon={BarChartOutlined} />,
    key: 'analysis',
    titleKey: 'demo:scenarios.analysis',
    description: '数据可视化、统计分析、报告生成等数据分析场景',
  },
];

export default function DemoPage() {
  const t = useTranslations();

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
              <Button key="start" type="primary">
                开始演示
              </Button>,
            ]}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
              {scenario.icon}
              <Text strong style={{ fontSize: 16, margin: 0 }}>
                {scenario.titleKey}
              </Text>
              <Text type="secondary">{scenario.description}</Text>
            </div>
          </Card>
        ))}
      </Grid>

      <Card style={{ marginTop: 32 }}>
        <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 12 }}>
          演示限制
        </Text>
        <Text>
          Demo 模式下最多可调用 <strong>5 个</strong>代理，仅支持 <strong>仅读取</strong> 和{' '}
          <strong>Yolo 模式</strong>两种执行模式。
        </Text>
      </Card>
    </AppLayout>
  );
}
