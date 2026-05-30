'use client';

import { Text } from '@/lib/ui';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Button, Skeleton } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconArrowRight,
  IconFolder,
  IconCloud,
  IconCode,
  IconBrandGithub,
} from '@tabler/icons-react';

interface AuthStatus {
  availableMethods: {
    local: boolean;
    github: boolean;
    githubApp: boolean;
  };
  user: {
    id: string;
    username: string;
    role: string;
  } | null;
}

export default function HomePage() {
  const t = useTranslations('common.landing');
  const [isLoading, setIsLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    availableMethods: { local: true, github: false, githubApp: false },
    user: null,
  });
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    fetch('/api/auth/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAuthStatus(data.data);
        }
      })
      .catch(() => { /* ignore */ })
      .finally(() => setLoadingAuth(false));
  }, []);

  const isLoggedIn = !!authStatus.user;

  const handleLogout = useCallback(() => {
    setIsLoading(true);
    try {
      document.cookie = 'userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      notifications.show({ title: t('logoutSuccess'), message: '', color: 'green' });
      setTimeout(() => window.location.reload(), 500);
    } catch {
      notifications.show({ title: t('logoutFailed'), message: '', color: 'red' });
      setIsLoading(false);
    }
  }, [t]);

  const features = [
    { icon: IconFolder, title: t('projectManagement'), desc: t('projectManagementDesc'), link: '/project' },
    { icon: IconCode, title: t('featureAI.title'), desc: t('featureAI.desc'), link: '/project' },
    { icon: IconCloud, title: t('cloudService'), desc: t('cloudServiceDesc'), link: '/cloud' },
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

        {loadingAuth ? (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Skeleton height={48} width={200} radius="md" />
          </div>
        ) : isLoggedIn ? (
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/project">
              <Button
                leftSection={<IconFolder size={18} />}
                size="lg"
                color="dark"
              >
                {t('enterProject')}
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              onClick={handleLogout}
              loading={isLoading}
              color="gray"
            >
              {t('logout')}
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            <Link href="/login">
              <Button
                rightSection={<IconArrowRight size={20} />}
                size="xl"
                color="dark"
              >
                {t('startNow')}
              </Button>
            </Link>

            {authStatus.availableMethods.github && (
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <a href="/api/auth/github" style={{ textDecoration: 'none' }}>
                  <Button
                    variant="outline"
                    leftSection={<IconBrandGithub size={16} />}
                    color="gray"
                  >
                    GitHub
                  </Button>
                </a>
              </div>
            )}
          </div>
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
          {features.map((f) => {
            const IconComponent = f.icon;
            return (
              <Link
                key={f.title}
                href={f.link}
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{
                    padding: '24px 20px',
                    borderRadius: 'var(--mantine-radius-md)',
                    border: '1px solid var(--border-primary)',
                    background: 'var(--bg-primary)',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                    height: '100%',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget).style.borderColor = 'var(--text-primary)';
                    (e.currentTarget).style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget).style.borderColor = 'var(--border-primary)';
                    (e.currentTarget).style.boxShadow = 'none';
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 'var(--mantine-radius-md)',
                      background: 'var(--bg-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                      color: 'var(--text-primary)',
                      fontSize: 20,
                    }}
                  >
                    <IconComponent size={20} />
                  </div>
                  <Text strong style={{ fontSize: 15, display: 'block', marginBottom: 6 }}>
                    {f.title}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.6 }}>
                    {f.desc}
                  </Text>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      {!isLoggedIn && (
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
            <Button
              rightSection={<IconArrowRight size={18} />}
              size="lg"
              variant="white"
              color="dark"
            >
              {t('cta.loginBtn')}
            </Button>
          </Link>
        </section>
      )}

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
