'use client';

import AppLayout from '@/components/layout/AppLayout';
import { Typography, Card, Row, Col, Button } from 'antd';
import { CodeOutlined, BarChartOutlined, ApartmentOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';

const { Title, Paragraph } = Typography;

const scenarios = [
  {
    icon: <ApartmentOutlined style={{ fontSize: 48, color: '#4f46e5' }} />,
    key: 'office',
    titleKey: 'demo:scenarios.office',
    description: '文档生成、数据处理、邮件撰写等办公自动化场景',
  },
  {
    icon: <CodeOutlined style={{ fontSize: 48, color: '#4f46e5' }} />,
    key: 'coding',
    titleKey: 'demo:scenarios.coding',
    description: '代码生成、Bug 修复、重构建议等编码辅助场景',
  },
  {
    icon: <BarChartOutlined style={{ fontSize: 48, color: '#4f46e5' }} />,
    key: 'analysis',
    titleKey: 'demo:scenarios.analysis',
    description: '数据可视化、统计分析、报告生成等数据分析场景',
  },
];

export default function DemoPage() {
  const t = useTranslations('demo');

  return (
    <AppLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Title level={3}>{t('title')}</Title>
        <Paragraph type="secondary">{t('description')}</Paragraph>

        <Row gutter={[24, 24]} style={{ marginTop: 32 }}>
          {scenarios.map((scenario) => (
            <Col xs={24} sm={12} md={8} key={scenario.key}>
              <Card
                hoverable
                style={{ textAlign: 'center', height: '100%' }}
                actions={[
                  <Button type="primary" ghost key="start">
                    开始演示
                  </Button>,
                ]}
              >
                <div style={{ display: 'flex', flexDirection: 'column', rowGap: 16, width: '100%' }}>
                  {scenario.icon}
                  <Title level={5}>{scenario.titleKey}</Title>
                  <Paragraph type="secondary">{scenario.description}</Paragraph>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        <Card style={{ marginTop: 32 }}>
          <Title level={5}>演示限制</Title>
          <Paragraph>
            Demo 模式下最多可调用 <strong>5 个</strong>代理，仅支持 <strong>仅读取</strong> 和{' '}
            <strong>Yolo 模式</strong>两种执行模式。
          </Paragraph>
        </Card>
      </div>
    </AppLayout>
  );
}
