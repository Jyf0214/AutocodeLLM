'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import { CustomButton } from '@/lib/ui';
import {
  ArrowRightOutlined,
  FolderOutlined,
  CloudOutlined,
  GithubOutlined,
} from '@ant-design/icons';

interface AuthStatus {
  availableMethods: { local: boolean; github: boolean; githubApp: boolean; };
  user: { id: string; username: string; role: string; } | null;
}

const features = [
  { icon: FolderOutlined, titleKey: 'projectManagement', descKey: 'projectManagementDesc', link: '/project' },
  { icon: CloudOutlined, titleKey: 'cloudService', descKey: 'cloudServiceDesc', link: '/cloud' },
];

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
      .then((data) => { if (data.success) setAuthStatus(data.data); })
      .catch(() => {/* ignore */})
      .finally(() => { setLoadingAuth(false); });
  }, []);

  const isLoggedIn = !!authStatus.user;

  const handleLogout = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        message.success(t('logoutSuccess'));
        setTimeout(() => { window.location.reload(); }, 500);
      } else {
        message.error(t('logoutFailed'));
      }
    } catch { message.error(t('logoutFailed')); }
    finally { setIsLoading(false); }
  }, [t]);

  return (
    <div className="animate-fade-in" style={{ background: 'var(--bg-primary)' }}>

      {/* Hero */}
      <section className="px-4 py-32 text-center max-w-xl mx-auto">
        <h1 className="text-[clamp(36px,6vw,56px)] font-extrabold mb-4 tracking-tight leading-[1.1]"
            style={{ color: 'var(--text-primary)' }}>
          AutocodeLLM
        </h1>
        <p className="text-[clamp(16px,2.5vw,18px)] mx-auto mb-10 max-w-lg leading-relaxed"
           style={{ color: 'var(--text-tertiary)' }}>
          {t('subtitle')}
        </p>

        {loadingAuth ? (
          <div className="flex justify-center">
            <div className="h-5 w-40 rounded animate-pulse" style={{ background: 'var(--bg-tertiary)' }} />
          </div>
        ) : isLoggedIn ? (
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/project">
              <CustomButton variant="primary" size="lg" icon={<FolderOutlined />}>
                {t('enterProject')}
              </CustomButton>
            </Link>
            <CustomButton variant="default" size="lg" onClick={handleLogout} loading={isLoading}>
              {t('logout')}
            </CustomButton>
          </div>
        ) : (
          <div className="flex flex-col gap-3 items-center">
            <Link href="/login">
              <CustomButton variant="primary" size="lg">
                {t('startNow')}
                <ArrowRightOutlined />
              </CustomButton>
            </Link>
            {authStatus.availableMethods.github && (
              <div className="mt-2 flex gap-2">
                <a href="/api/auth/github">
                  <CustomButton variant="default" icon={<GithubOutlined />}>
                    GitHub
                  </CustomButton>
                </a>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-bold text-center mb-12"
            style={{ color: 'var(--text-primary)' }}>
          {t('coreFeatures')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Link key={f.titleKey} href={f.link} className="no-underline">
                <div
                  className="group p-6 rounded-xl border transition-all duration-200 h-full cursor-pointer
                             hover:shadow-md hover:border-zinc-800"
                  style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-primary)' }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 text-lg transition-all duration-200
                               group-hover:bg-zinc-900 group-hover:text-white"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  >
                    <Icon />
                  </div>
                  <h3 className="text-[15px] font-semibold mb-1.5"
                      style={{ color: 'var(--text-primary)' }}>
                    {t(f.titleKey)}
                  </h3>
                  <p className="text-sm leading-relaxed"
                     style={{ color: 'var(--text-tertiary)' }}>
                    {t(f.descKey)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      {!isLoggedIn && (
        <section className="py-20 px-4 text-center"
                 style={{ background: 'var(--text-primary)' }}>
          <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--bg-primary)' }}>
            {t('cta.title')}
          </h2>
          <p className="text-sm mx-auto mb-8 max-w-sm leading-relaxed opacity-70"
             style={{ color: 'var(--bg-secondary)' }}>
            {t('cta.desc')}
          </p>
          <Link href="/login">
            <CustomButton variant="filled"
              className="!bg-white !text-black !border-white !hover:bg-zinc-100">
              {t('cta.loginBtn')}
              <ArrowRightOutlined />
            </CustomButton>
          </Link>
        </section>
      )}

      {/* Footer */}
      <footer className="text-center py-8 px-4 border-t"
               style={{ borderColor: 'var(--border-primary)' }}>
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          © 2026 {t('footer')}
        </p>
      </footer>
    </div>
  );
}
