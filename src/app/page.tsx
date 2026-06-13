'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import { FolderOutlined, GithubOutlined, ArrowRightOutlined } from '@ant-design/icons';

interface AuthStatus {
  availableMethods: { local: boolean; github: boolean; githubApp: boolean };
  user: { id: string; username: string; role: string } | null;
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
      .then((r) => r.json())
      .then((d) => { if (d.success) setAuthStatus(d.data); })
      .catch(() => {/* empty */})
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
    } catch {
      message.error(t('logoutFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  // --- Nav (uniform width: max-w-5xl) ---
  const nav = (
    <div className="border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-lg">AutocodeLLM</div>
        <div className="flex items-center gap-2">
          {loadingAuth ? (
            <div className="w-20 h-8 bg-gray-100 rounded animate-pulse" />
          ) : isLoggedIn ? (
            <>
              <Link href="/project" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                {t('enterProject')}
              </Link>
              <button
                onClick={handleLogout}
                disabled={isLoading}
                className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {t('logout')}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                {t('startNow')}
              </Link>
              {authStatus.availableMethods.github && (
                <a href="/api/auth/github" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                  <GithubOutlined /> GitHub
                </a>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  // --- Hero CTA button (only after auth resolved) ---
  const heroAction = loadingAuth ? (
    <div className="w-40 h-10 bg-gray-100 rounded-lg mx-auto animate-pulse" />
  ) : isLoggedIn ? (
    <Link href="/project">
      <span className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-xl hover:bg-gray-800 transition-colors text-sm font-medium">
        <FolderOutlined /> {t('enterProject')}
      </span>
    </Link>
  ) : (
    <Link href="/login">
      <span className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-xl hover:bg-gray-800 transition-colors text-sm font-medium">
        {t('startNow')} <ArrowRightOutlined />
      </span>
    </Link>
  );

  // --- Feature cards (uniform width) ---
  const features = (
    <div className="max-w-5xl mx-auto px-4 pt-10 pb-24">
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">{t('coreFeatures')}</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        {(['projectManagement', 'cloudService'] as const).map((key) => (
          <div key={key} className="border border-gray-200 rounded-xl p-6 hover:border-gray-300 hover:shadow-sm transition-all">
            <h3 className="font-semibold text-gray-900 mb-2">{t(key)}</h3>
            <p className="text-sm text-gray-500">{t(key === 'projectManagement' ? 'projectManagementDesc' : 'cloudServiceDesc')}</p>
          </div>
        ))}
      </div>
    </div>
  );

  // --- CTA (only after auth resolved AND user not logged in) ---
  const cta = !loadingAuth && !isLoggedIn ? (
    <div className="max-w-5xl mx-auto px-4 pt-10 pb-24">
      <div className="bg-gray-900 rounded-2xl p-12 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">{t('cta.title')}</h2>
        <p className="text-sm text-gray-400 mb-8">{t('cta.desc')}</p>
        <Link href="/login">
          <span className="inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-2.5 rounded-xl hover:bg-gray-100 transition-colors text-sm font-medium">
            {t('cta.loginBtn')} <ArrowRightOutlined />
          </span>
        </Link>
      </div>
    </div>
  ) : null;

  // --- Footer (uniform width) ---
  const footer = (
    <div className="border-t border-gray-200">
      <div className="max-w-5xl mx-auto px-4 py-6 text-center text-xs text-gray-400">
        © 2026 {t('footer')}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {nav}
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-4">AutocodeLLM</h1>
        <p className="text-lg text-gray-500 mb-8 max-w-lg mx-auto">{t('subtitle')}</p>
        {heroAction}
      </div>
      {features}
      {cta}
      {footer}
    </div>
  );
}
