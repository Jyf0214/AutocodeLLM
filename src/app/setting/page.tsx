'use client';

import { PageContainer } from '@/lib/ui';
import { Typography } from 'antd';

const { Title, Paragraph } = Typography;

export default function SettingPage() {
  return (
    <PageContainer>
      <Title level={3}>全局设置</Title>
      <Paragraph type="secondary">
        系统配置功能即将上线，敬请期待。
      </Paragraph>
    </PageContainer>
  );
}
