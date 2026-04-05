'use client';

import { Button } from 'antd';
import { ArrowRightOutlined, CodeOutlined, ApiOutlined, TeamOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import '@/styles/Landing.css';

export default function LandingPage() {
  const t = useTranslations('common.landing');

  const features = [
    {
      icon: <CodeOutlined />,
      title: t('featureAI.title'),
      description: t('featureAI.desc'),
    },
    {
      icon: <ApiOutlined />,
      title: t('featureModels.title'),
      description: t('featureModels.desc'),
    },
    {
      icon: <TeamOutlined />,
      title: t('featureTasks.title'),
      description: t('featureTasks.desc'),
    },
  ];

  return (
    <div className="landing">
      <section className="landing-hero">
        <div className="landing-hero-content">
          <h1 className="landing-title">AutocodeLLM</h1>
          <p className="landing-subtitle">
            {t('subtitle')}
          </p>
          <div className="landing-actions">
            <Link href="/login">
              <Button type="primary" size="large" className="landing-btn-primary">
                {t('startUsing')}
                <ArrowRightOutlined />
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="large" className="landing-btn-secondary">
                <PlayCircleOutlined />
                {t('onlineDemo')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="landing-features">
        <h2 className="landing-section-title">{t('coreFeatures')}</h2>
        <div className="landing-features-grid">
          {features.map((feature, index) => (
            <div key={String(index)} className="landing-feature-card">
              <div className="landing-feature-icon">
                {feature.icon}
              </div>
              <h3 className="landing-feature-title">{feature.title}</h3>
              <p className="landing-feature-desc">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-cta">
        <h2 className="landing-cta-title">{t('cta.title')}</h2>
        <p className="landing-cta-desc">
          {t('cta.desc')}
        </p>
        <Link href="/login">
          <Button type="primary" size="large" className="landing-cta-btn">
            {t('cta.loginBtn')}
            <ArrowRightOutlined />
          </Button>
        </Link>
      </section>

      <footer className="landing-footer">
        <p>{t('footer')}</p>
      </footer>
    </div>
  );
}
