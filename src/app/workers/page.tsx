'use client';

import AppLayout from '@/components/layout/AppLayout';
import { Text, Empty } from '@lobehub/ui';
import { useTranslations } from 'next-intl';

function PageWithEmpty({ title, description }: { title: string; description: string }) {
  return (
    <AppLayout>
      <Text strong style={{ fontSize: 20, display: 'block', marginBottom: 8 }}>
        {title}
      </Text>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        {description}
      </Text>
      <Empty description="功能开发中" />
    </AppLayout>
  );
}

export default function WorkersPage() {
  const t = useTranslations();
  return <PageWithEmpty title={t('common.workers')} description="监控和管理 Worker 节点状态与资源分配。" />;
}

export function SyncPage() {
  const t = useTranslations();
  return <PageWithEmpty title={t('common.sync')} description="管理数据同步、代码仓库同步和配置分发。" />;
}

export function ModelPage() {
  const t = useTranslations();
  return <PageWithEmpty title={t('common.models')} description="配置和管理可用的 AI 模型及其参数。" />;
}

export function EnvPage() {
  const t = useTranslations();
  return <PageWithEmpty title={t('common.env')} description="管理和配置系统环境变量与运行时参数。" />;
}

export function AgentsPage() {
  const t = useTranslations();
  return <PageWithEmpty title={t('common.agents')} description="编排和管理自动化任务代理工作流。" />;
}
