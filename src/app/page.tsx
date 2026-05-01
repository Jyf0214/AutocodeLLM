'use client';

import { Button, Text } from '@/lib/ui';
import {
  ArrowRightOutlined,
  ApiOutlined,
  FolderOutlined,
  CloudServerOutlined,
  CodeOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { message } from 'antd';

export default function HomePage() {
  const t = useTranslations('common.landing');
  const [isLoading, setIsLoading] = useState(false);

  const isLoggedIn =
    typeof window !== 'undefined' &&
    !!sessionStorage.getItem('userId');

  const handleLogout = useCallback(() => {
    setIsLoading(true);
    try {
      sessionStorage.clear();
      message.success(t('logoutSuccess'));
      setTimeout(() => window.location.reload(), 500);
    } catch {
      message.error(t('logoutFailed'));
      setIsLoading(false);
    }
  }, [t]);

  const features = [
    { icon: <FolderOutlined />, title: t('workspaceManagement'), desc: t('workspaceManagementDesc'), link: '/project' },
    { icon: <CodeOutlined />, title: t('featureAI.title'), desc: t('featureAI.desc'), link: '/project' },
    { icon: <ApiOutlined />, title: t('multiModelSupport'), desc: t('multiModelSupportDesc'), link: '/provider' },
    { icon: <ThunderboltOutlined />, title: t('taskAgent'), desc: t('taskAgentDesc'), link: '/project' },
    { icon: <CloudServerOutlined />, title: t('cloudService'), desc: t('cloudServiceDesc'), link: '/cloud' },
    { icon: <SafetyOutlined />, title: t('featureModels.title'), desc: t('featureModels.desc'), link: '/provider' },
  ];

  return (
    <div style={{ background: 'var(--bg-primary)' }}>
      {/* Hero */}
      <section
        style={{
          padding: '120px 16px 80px',
          textAlign: 'center',
          maxWidth: 720,
          margin: '0 auto',
        }}
      >
        <h1
          style={{
            fontSize: 'clamp(36px, 6vw, 56px)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            margin: '0 0 16px',
            letterSpacing: '-1px',
            lineHeight: 1.1,
          }}
        >
          AutocodeLLM
        </h1>

        <p
          style={{
            fontSize: 'clamp(16px, 2.5vw, 18px)',
            color: 'var(--text-tertiary)',
            margin: '0 auto 40px',
            maxWidth: 520,
            lineHeight: 1.7,
          }}
        >
          {t('subtitle')}
        </p>

        {isLoggedIn ? (
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/project">
              <button
                style={{
                  height: 48,
                  padding: '0 28px',
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#fff',
                  background: 'var(--text-primary)',
                  border: 'none',
                  borderRadius: 10,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <FolderOutlined />
                {t('enterWorkspace')}
              </button>
            </Link>
            <button
              onClick={handleLogout}
              disabled={isLoading}
              style={{
                height: 48,
                padding: '0 28px',
                fontSize: 15,
                fontWeight: 500,
                color: 'var(--text-secondary)',
                background: 'transparent',
                border: '1px solid var(--border-primary)',
                borderRadius: 10,
                cursor: 'pointer',
              }}
            >
              {t('logout')}
            </button>
          </div>
        ) : (
          <Link href="/login">
            <button
              style={{
                height: 52,
                padding: '0 36px',
                fontSize: 16,
                fontWeight: 600,
                color: '#fff',
                background: 'var(--text-primary)',
                border: 'none',
                borderRadius: 12,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                transition: 'opacity 0.2s',
              }}
            >
              {t('startNow')}
              <ArrowRightOutlined style={{ fontSize: 18 }} />
            </button>
          </Link>
        )}
      </section>

      {/* Features */}
      <section
        style={{
          maxWidth: 960,
          margin: '0 auto',
          padding: '0 16px 80px',
        }}
      >
        <h2
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: 'var(--text-primary)',
            textAlign: 'center',
            margin: '0 0 48px',
          }}
        >
          {t('coreFeatures')}
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {features.map((f, i) => (
            <Link
              key={i}
              href={f.link}
              style={{ textDecoration: 'none' }}
            >
              <div
                style={{
                  padding: '24px 20px',
                  borderRadius: 10,
                  border: '1px solid var(--border-primary)',
                  background: 'var(--bg-primary)',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                  height: '100%',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--text-primary)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-primary)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: 'var(--bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                    color: 'var(--text-primary)',
                    fontSize: 20,
                  }}
                >
                  {f.icon}
                </div>
                <Text strong style={{ fontSize: 15, display: 'block', marginBottom: 6 }}>
                  {f.title}
                </Text>
                <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.6 }}>
                  {f.desc}
                </Text>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          background: 'var(--text-primary)',
          padding: '80px 16px',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: 'var(--bg-primary)',
            margin: '0 0 12px',
          }}
        >
          {t('cta.title')}
        </h2>
        <p
          style={{
            fontSize: 15,
            color: 'var(--bg-secondary)',
            margin: '0 auto 32px',
            maxWidth: 400,
            lineHeight: 1.6,
            opacity: 0.7,
          }}
        >
          {t('cta.desc')}
        </p>
        <Link href="/login">
          <button
            style={{
              height: 48,
              padding: '0 32px',
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--text-primary)',
              background: 'var(--bg-primary)',
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {t('cta.loginBtn')}
            <ArrowRightOutlined />
          </button>
        </Link>
      </section>

      {/* Footer */}
      <footer
        style={{
          textAlign: 'center',
          padding: '32px 16px',
          borderTop: '1px solid var(--border-primary)',
        }}
      >
        <Text type="secondary" style={{ fontSize: 12 }}>
          © 2026 {t('footer')}
        </Text>
      </footer>
    </div>
  );
}