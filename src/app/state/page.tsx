'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Tag, Progress, Statistic, message, Spin, Empty, Button } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  DatabaseOutlined,
  ApiOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { Text, Flexbox, Icon } from '@/lib/ui';
import { useTranslations } from 'next-intl';

interface SystemComponent {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  latency?: number;
  details?: Record<string, unknown>;
}

interface StateInfo {
  database: SystemComponent;
  api: SystemComponent;
  providers: SystemComponent;
}

export default function StatePage() {
  const t = useTranslations('state');
  const [loading, setLoading] = useState(true);
  const [stateData, setStateData] = useState<StateInfo | null>(null);

  const fetchState = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/state');
      const result = (await response.json()) as { success: boolean; data?: StateInfo; error?: { message: string } };
      if (result.success && result.data) {
        setStateData(result.data);
      } else {
        message.error(result.error?.message ?? t('fetchFailed'));
      }
    } catch {
      message.error(t('fetchFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/state');
        const result = (await response.json()) as { success: boolean; data?: StateInfo; error?: { message: string } };
        if (result.success && result.data) {
          setStateData(result.data);
        } else {
          message.error(result.error?.message ?? t('fetchFailed'));
        }
      } catch {
        message.error(t('fetchFailed'));
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'green';
      case 'degraded':
        return 'orange';
      case 'unhealthy':
        return 'red';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'degraded':
        return <LoadingOutlined style={{ color: '#faad14' }} />;
      case 'unhealthy':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <LoadingOutlined />;
    }
  };

  const getOverallStatus = (): 'healthy' | 'degraded' | 'unhealthy' => {
    if (!stateData) return 'unhealthy';

    const components = [
      stateData.database,
      stateData.api,
      stateData.providers,
    ].filter(Boolean) as SystemComponent[];

    if (components.length === 0) return 'unhealthy';

    const hasUnhealthy = components.some(c => c.status === 'unhealthy');
    const hasDegraded = components.some(c => c.status === 'degraded');

    if (hasUnhealthy) return 'unhealthy';
    if (hasDegraded) return 'degraded';
    return 'healthy';
  };

  const getOverallPercentage = (): number => {
    if (!stateData) return 0;

    const components = [
      stateData.database,
      stateData.api,
      stateData.providers,
    ].filter(Boolean) as SystemComponent[];

    if (components.length === 0) return 0;

    const healthyCount = components.filter(c => c.status === 'healthy').length;
    const degradedCount = components.filter(c => c.status === 'degraded').length;

    return Math.round((healthyCount + degradedCount * 0.5) / components.length * 100);
  };

  const renderComponentCard = (component: SystemComponent, icon: React.ReactNode, title: string) => (
    <Card
      title={
        <Flexbox gap={8} horizontal align="center">
          {icon}
          <span>{title}</span>
        </Flexbox>
      }
      extra={getStatusIcon(component.status)}
      style={{ borderRadius: 12 }}
    >
      <Flexbox gap={16} direction="vertical">
        <Tag color={getStatusColor(component.status)} style={{ alignSelf: 'flex-start' }}>
          {component.status === 'healthy' ? t('status.healthy') : component.status === 'degraded' ? t('status.degraded') : t('status.unhealthy')}
        </Tag>
        <Text type="secondary">{component.message}</Text>
        {component.latency !== undefined && (
          <Text type="secondary">{t('latency', { latency: component.latency })}</Text>
        )}
      </Flexbox>
    </Card>
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!stateData) {
    return (
      <div>
        <Empty description={t('fetchError')} />
        <Button type="primary" onClick={fetchState} style={{ marginTop: 16 }}>
          {t('retry')}
        </Button>
      </div>
    );
  }

  const overallStatus = getOverallStatus();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
<div>
        <Text strong style={{ fontSize: 20, display: 'block' }}>
          {t('title')}
        </Text>
        <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
          {t('description')}
        </Text>
      </div>

      <Card style={{ borderRadius: 12 }}>
        <Flexbox gap={24} horizontal align="center">
          <Statistic
            title={t('overallStatus')}
            value={overallStatus === 'healthy' ? t('status.healthy') : overallStatus === 'degraded' ? t('status.degraded') : t('status.unhealthy')}
            styles={{
              content: {
                color: overallStatus === 'healthy' ? '#52c41a' : overallStatus === 'degraded' ? '#faad14' : '#ff4d4f'
              }
            }}
            prefix={getStatusIcon(overallStatus)}
          />
          <div style={{ flex: 1 }}>
            <Flexbox gap={8} horizontal align="center" style={{ marginBottom: 8 }}>
              <Text strong>{t('health')}</Text>
              <Text type="secondary">{getOverallPercentage()}%</Text>
            </Flexbox>
            <Progress
              percent={getOverallPercentage()}
              status={overallStatus === 'healthy' ? 'success' : overallStatus === 'degraded' ? 'normal' : 'exception'}
              showInfo={false}
            />
          </div>
          <Button onClick={fetchState}>{t('refresh')}</Button>
        </Flexbox>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          {renderComponentCard(stateData.database, <Icon icon={DatabaseOutlined} />, t('components.database'))}
        </Col>
        <Col xs={24} sm={12} lg={8}>
          {renderComponentCard(stateData.api, <Icon icon={ApiOutlined} />, t('components.api'))}
        </Col>
        <Col xs={24} sm={12} lg={8}>
          {renderComponentCard(stateData.providers, <Icon icon={AppstoreOutlined} />, t('components.providers'))}
        </Col>
      </Row>
    </div>
  );
}