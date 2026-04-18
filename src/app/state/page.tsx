'use client';

import { useState, useEffect } from 'react';
import { Card, Row, Col, Tag, Progress, Statistic, message, Spin, Empty, Button, Table } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  LoadingOutlined,
  DatabaseOutlined,
  ApiOutlined,
  CloudServerOutlined,
  SecurityScanOutlined,
  DesktopOutlined,
} from '@ant-design/icons';
import { Text, Flexbox, Icon } from '@lobehub/ui';
import { useTranslations } from 'next-intl';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  timestamp: string;
}

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
  workers: SystemComponent;
  mcp: SystemComponent;
  providers: SystemComponent;
}

export default function StatePage() {
  const t = useTranslations();
  const [loading, setLoading] = useState(true);
  const [stateData, setStateData] = useState<StateInfo | null>(null);

  const fetchState = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/state');
      const result: { success: boolean; data?: StateInfo; error?: { message: string } } = await response.json();
      if (result.success && result.data) {
        setStateData(result.data);
      } else {
        message.error(result.error?.message ?? '获取系统状态失败');
      }
    } catch {
      message.error('获取系统状态失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

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
      stateData.workers,
      stateData.mcp,
      stateData.providers,
    ];
    
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
      stateData.workers,
      stateData.mcp,
      stateData.providers,
    ];
    
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
          {component.status === 'healthy' ? '正常' : component.status === 'degraded' ? '降级' : '异常'}
        </Tag>
        <Text type="secondary">{component.message}</Text>
        {component.latency !== undefined && (
          <Text type="secondary">响应时间: {component.latency}ms</Text>
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
        <Empty description="无法获取系统状态" />
        <Button type="primary" onClick={fetchState} style={{ marginTop: 16 }}>
          重试
        </Button>
      </div>
    );
  }

  const overallStatus = getOverallStatus();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Text strong style={{ fontSize: 20, display: 'block' }}>
          系统健康检查
        </Text>
        <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
          监控各组件运行状态，确保系统正常运行
        </Text>
      </div>

      <Card style={{ borderRadius: 12 }}>
        <Flexbox gap={24} horizontal align="center">
          <Statistic
            title="整体状态"
            value={overallStatus === 'healthy' ? '正常' : overallStatus === 'degraded' ? '降级' : '异常'}
            valueStyle={{ 
              color: overallStatus === 'healthy' ? '#52c41a' : overallStatus === 'degraded' ? '#faad14' : '#ff4d4f'
            }}
            prefix={getStatusIcon(overallStatus)}
          />
          <div style={{ flex: 1 }}>
            <Flexbox gap={8} horizontal align="center" style={{ marginBottom: 8 }}>
              <Text strong>健康度</Text>
              <Text type="secondary">{getOverallPercentage()}%</Text>
            </Flexbox>
            <Progress 
              percent={getOverallPercentage()} 
              status={overallStatus === 'healthy' ? 'success' : overallStatus === 'degraded' ? 'normal' : 'exception'}
              showInfo={false}
            />
          </div>
          <Button onClick={fetchState}>刷新</Button>
        </Flexbox>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          {renderComponentCard(stateData.database, <Icon icon={DatabaseOutlined} />, '数据库')}
        </Col>
        <Col xs={24} sm={12} lg={8}>
          {renderComponentCard(stateData.api, <Icon icon={ApiOutlined} />, 'API 服务')}
        </Col>
        <Col xs={24} sm={12} lg={8}>
          {renderComponentCard(stateData.workers, <Icon icon={CloudServerOutlined} />, 'Worker 服务')}
        </Col>
        <Col xs={24} sm={12} lg={8}>
          {renderComponentCard(stateData.mcp, <Icon icon={SecurityScanOutlined} />, 'MCP 服务')}
        </Col>
        <Col xs={24} sm={12} lg={8}>
          {renderComponentCard(stateData.providers, <Icon icon={MemoryOutlined} />, 'AI 提供商')}
        </Col>
      </Row>
    </div>
  );
}