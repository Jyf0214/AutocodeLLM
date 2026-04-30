'use client';

import { Button, Flexbox, Text } from '@/lib/ui';
import {
  ArrowRightOutlined,
  CodeOutlined,
  ApiOutlined,
  TeamOutlined,
  LogoutOutlined,
  FolderOutlined,
  SettingOutlined,
  CloudServerOutlined,
} from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { message } from 'antd';

/**
 * 功能卡片数据类型
 */
interface FeatureCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
  color: string;
}

/**
 * 首页组件
 * 展示应用功能卡片和登录/登出逻辑
 */
export default function HomePage() {
  const t = useTranslations('common.landing');
  const [isLoading, setIsLoading] = useState(false);

  // 检查登录状态
  const isLoggedIn =
    typeof window !== 'undefined' &&
    !!sessionStorage.getItem('userId');

  /**
   * 登出处理
   */
  const handleLogout = useCallback(() => {
    setIsLoading(true);
    try {
      sessionStorage.clear();
      message.success(t('logoutSuccess'));
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch {
      message.error(t('logoutFailed'));
      setIsLoading(false);
    }
  }, [t]);

  /**
   * 功能卡片数据
   */
  const features: FeatureCard[] = [
    {
      icon: <FolderOutlined style={{ fontSize: 28 }} />,
      title: t('workspaceManagement'),
      description: t('workspaceManagementDesc'),
      link: '/workplace',
      color: 'var(--lobe-color-success)',
    },
    {
      icon: <ApiOutlined style={{ fontSize: 28 }} />,
      title: t('multiModelSupport'),
      description: t('multiModelSupportDesc'),
      link: '/provider',
      color: 'var(--lobe-color-warning)',
    },
    {
      icon: <TeamOutlined style={{ fontSize: 28 }} />,
      title: t('taskAgent'),
      description: t('taskAgentDesc'),
      link: '/agents',
      color: 'var(--lobe-color-purple)',
    },
    {
      icon: <SettingOutlined style={{ fontSize: 28 }} />,
      title: t('mcpConfig'),
      description: t('mcpConfigDesc'),
      link: '/setting/mcp',
      color: 'var(--lobe-color-cyan)',
    },
    {
      icon: <CloudServerOutlined style={{ fontSize: 28 }} />,
      title: t('cloudService'),
      description: t('cloudServiceDesc'),
      link: '/cloud',
      color: 'var(--lobe-color-violet)',
    },
  ];

  return (
    <div
      style={{
        minHeight: '100dvh',
        position: 'relative',
        overflow: 'hidden',
        background: '#ffffff',
      }}
    >
      {/* 主内容区 */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100dvh',
        }}
      >
        {/* Hero 区域 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            textAlign: 'center',
            padding: '48px 16px',
          }}
        >
          <Text
            strong
            style={{
              fontSize: 'clamp(32px, 5vw, 56px)',
              fontWeight: 700,
              marginBottom: 16,
              color: '#333333',
            }}
          >
            AutocodeLLM
          </Text>

          <Text
            type="secondary"
            style={{
              fontSize: 'clamp(16px, 2.5vw, 20px)',
              maxWidth: 600,
              marginBottom: 32,
              lineHeight: 1.6,
              color: '#666666',
            }}
          >
            {t('subtitle')}
          </Text>

          <Flexbox gap={16} horizontal wrap justify="center">
            {isLoggedIn ? (
              <>
                <Link href="/workplace">
                  <Button
                    type="primary"
                    size="large"
                    icon={<FolderOutlined />}
                    loading={isLoading}
                  >
                    {t('enterWorkspace')}
                  </Button>
                </Link>
                
                <Button
                  type="text"
                  size="large"
                  icon={<LogoutOutlined />}
                  onClick={handleLogout}
                  loading={isLoading}
                >
                  {t('logout')}
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    type="primary"
                    size="large"
                    icon={<ArrowRightOutlined />}
                  >
                    {t('startNow')}
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button
                    type="default"
                    size="large"
                    icon={<CodeOutlined />}
                  >
                    {t('onlineDemo')}
                  </Button>
                </Link>
              </>
            )}
          </Flexbox>
        </div>

        {/* 功能卡片区 */}
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '48px 16px',
          }}
        >
          <Text
            strong
            style={{
              fontSize: 'clamp(20px, 3vw, 28px)',
              textAlign: 'center',
              marginBottom: 40,
              display: 'block',
              color: '#333333',
            }}
          >
            {t('coreFeatures')}
          </Text>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 24,
            }}
          >
            {features.map((feature, index) => (
              <Link
                key={String(index)}
                href={feature.link}
                style={{
                  textDecoration: 'none',
                }}
              >
                <div
                  style={{
                    padding: 24,
                    borderRadius: 16,
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    height: '100%',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = feature.color;
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = `0 8px 24px ${feature.color}20`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div
                    style={{
                      color: feature.color,
                      marginBottom: 16,
                      transition: 'transform 0.3s ease',
                    }}
                  >
                    {feature.icon}
                  </div>
                  <Text
                    strong
                    style={{
                      fontSize: 18,
                      display: 'block',
                      marginBottom: 12,
                      color: '#333333',
                    }}
                  >
                    {feature.title}
                  </Text>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: 14,
                      lineHeight: 1.6,
                      display: 'block',
                      color: '#666666',
                    }}
                  >
                    {feature.description}
                  </Text>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA 区域 */}
        <div
          style={{
            maxWidth: 600,
            margin: '0 auto',
            padding: '64px 16px',
            textAlign: 'center',
          }}
        >
          <Text
            strong
            style={{
              fontSize: 'clamp(20px, 3vw, 28px)',
              marginBottom: 16,
              display: 'block',
              color: '#333333',
            }}
          >
            {t('cta.title')}
          </Text>
          <Text
            type="secondary"
            style={{
              fontSize: 16,
              display: 'block',
              marginBottom: 32,
              lineHeight: 1.6,
              color: '#666666',
            }}
          >
            {t('cta.desc')}
          </Text>
          <Link href="/login">
            <Button
              type="primary"
              size="large"
              icon={<ArrowRightOutlined />}
              style={{
                borderRadius: 12,
                padding: '0 32px',
                height: 44,
              }}
            >
              {t('cta.loginBtn')}
            </Button>
          </Link>
        </div>

        {/* 页脚 */}
        <div
          style={{
            textAlign: 'center',
            padding: '32px 16px',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <Text type="secondary" style={{ fontSize: 13 }}>
            © 2026 {t('footer')}
          </Text>
        </div>
      </div>
    </div>
  );
}
