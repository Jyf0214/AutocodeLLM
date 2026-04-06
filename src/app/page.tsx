'use client';

import { Button, Grid, Text, Icon } from '@lobehub/ui';
import { ArrowRightOutlined, CodeOutlined, ApiOutlined, TeamOutlined, PlayCircleOutlined, LogoutOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Card } from 'antd';
import OrbitalBackground from '@/components/ui/OrbitalBackground';

export default function LandingPage() {
  const t = useTranslations('common.landing');
  const isLoggedIn = typeof window !== 'undefined' && !!sessionStorage.getItem('userId');

  const handleLogout = () => {
    sessionStorage.clear();
    window.location.reload();
  };

  const features = [
    {
      icon: <Icon icon={CodeOutlined} />,
      title: t('featureAI.title'),
      description: t('featureAI.desc'),
    },
    {
      icon: <Icon icon={ApiOutlined} />,
      title: t('featureModels.title'),
      description: t('featureModels.desc'),
    },
    {
      icon: <Icon icon={TeamOutlined} />,
      title: t('featureTasks.title'),
      description: t('featureTasks.desc'),
    },
  ];

  return (
    <div style={{ minHeight: '100dvh', position: 'relative' }}>
      <OrbitalBackground />

      <div style={{ position: 'relative', zIndex: 1 }}>
      {/* Hero section */}
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
            fontSize: 48,
            fontWeight: 700,
            marginBottom: 16,
          }}
        >
          AutocodeLLM
        </Text>
        <Text
          type="secondary"
          style={{ fontSize: 18, maxWidth: 600, marginBottom: 32 }}
        >
          {t('subtitle')}
        </Text>
        <div style={{ display: 'flex', gap: 16 }}>
          {isLoggedIn ? (
            <Button type="primary" size="large" onClick={handleLogout}>
              {t('logout')}
              <Icon icon={LogoutOutlined} />
            </Button>
          ) : (
            <>
              <Link href="/login">
                <Button type="primary" size="large">
                  {t('startUsing')}
                  <Icon icon={ArrowRightOutlined} />
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="large">
                  <Icon icon={PlayCircleOutlined} />
                  {t('onlineDemo')}
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Features section */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px 16px' }}>
        <Text
          strong
          style={{ fontSize: 24, textAlign: 'center', marginBottom: 32, display: 'block' }}
        >
          {t('coreFeatures')}
        </Text>
        <Grid rows={1} maxItemWidth={320} gap={24}>
          {features.map((feature, index) => (
            <Card key={String(index)} style={{ textAlign: 'center' }}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  alignItems: 'center',
                }}
              >
                {feature.icon}
                <Text strong style={{ fontSize: 16, margin: 0 }}>
                  {feature.title}
                </Text>
                <Text type="secondary">{feature.description}</Text>
              </div>
            </Card>
          ))}
        </Grid>
      </div>

      {/* CTA section */}
      <div
        style={{
          maxWidth: 600,
          margin: '0 auto',
          padding: '48px 16px',
          textAlign: 'center',
        }}
      >
        <Text strong style={{ fontSize: 20, marginBottom: 12, display: 'block' }}>
          {t('cta.title')}
        </Text>
        <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
          {t('cta.desc')}
        </Text>
        <Link href="/login">
          <Button type="primary" size="large">
            {t('cta.loginBtn')}
            <Icon icon={ArrowRightOutlined} />
          </Button>
        </Link>
      </div>

      {/* Footer */}
      <div
        style={{
          textAlign: 'center',
          padding: '24px 16px',
          borderTop: '1px solid var(--border-primary)',
        }}
      >
        <Text type="secondary">{t('footer')}</Text>
      </div>
      </div>
    </div>
  );
}
