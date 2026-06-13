'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import {
  FolderOutlined,
  CloudOutlined,
  GithubOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';

import { HeroBanner, ProCard, StatusCard, Button, Tag, PageContainer } from '@/ui';

interface AuthStatus {
  availableMethods: { local: boolean; github: boolean; githubApp: boolean };
  user: { id: string; username: string; role: string } | null;
}

const features = [
  {
    icon: <FolderOutlined style={{ fontSize: 22 }} />,
    titleKey: 'projectManagement' as const,
    descKey: 'projectManagementDesc' as const,
    link: '/project',
    tag: 'core' as const,
  },
  {
    icon: <CloudOutlined style={{ fontSize: 22 }} />,
    titleKey: 'cloudService' as const,
    descKey: 'cloudServiceDesc' as const,
    link: '/cloud',
    tag: 'core' as const,
  },
  {
    icon: <GithubOutlined style={{ fontSize: 22 }} />,
    titleKey: 'projectManagement' as const,
    descKey: 'projectManagementDesc' as const,
    link: '/project',
    tag: 'new' as const,
  },
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
      .then((data) => {
        if (data.success) setAuthStatus(data.data);
      })
      .catch(() => {
        /* ignore */
      })
      .finally(() => {
        setLoadingAuth(false);
      });
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

  // 获取用户名的首字母（用于头像占位）
  const userInitial = authStatus.user?.username ? authStatus.user.username.charAt(0).toUpperCase() : '?';

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* ================================================================= */}
      {/* 顶部导航                                                          */}
      {/* ================================================================= */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 no-underline">
            <div className="w-9 h-9 bg-gradient-to-br from-zinc-900 to-zinc-700 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-lg leading-none">A</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-zinc-900">
              AutocodeLLM
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {loadingAuth ? (
              <div className="h-8 w-20 rounded-lg bg-zinc-100 animate-pulse" />
            ) : isLoggedIn ? (
              <>
                <Link href="/project">
                  <Button variant="ghost" size="sm">
                    <FolderOutlined />
                    {t('enterProject')}
                  </Button>
                </Link>
                <Button variant="default" size="sm" onClick={handleLogout} loading={isLoading}>
                  {t('logout')}
                </Button>
                <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center text-sm font-bold ml-1">
                  {userInitial}
                </div>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    {t('startNow')}
                  </Button>
                </Link>
                {authStatus.availableMethods.github && (
                  <a href="/api/auth/github">
                    <Button variant="default" size="sm" icon={<GithubOutlined />}>
                      GitHub
                    </Button>
                  </a>
                )}
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ================================================================= */}
      {/* Hero 区 — 使用 HeroBanner 组件                                    */}
      {/* ================================================================= */}
      <PageContainer maxWidth="6xl" padding="wide">
        <HeroBanner
          title="AutocodeLLM"
          description={t('subtitle')}
          tips={t('coreFeatures')}
          size="large"
          buttons={[
            ...(isLoggedIn
              ? [
                  {
                    label: t('enterProject'),
                    href: '/project',
                    variant: 'primary' as const,
                    icon: <FolderOutlined />,
                  },
                ]
              : [
                  {
                    label: t('startNow'),
                    href: '/login',
                    variant: 'primary' as const,
                    icon: <ArrowRightOutlined />,
                  },
                ]),
            ...(authStatus.availableMethods.github
              ? [
                  {
                    label: 'GitHub',
                    href: '/api/auth/github',
                    variant: 'ghost' as const,
                    icon: <GithubOutlined />,
                  },
                ]
              : []),
          ]}
          animate
        />

        {/* ================================================================= */}
        {/* 特性卡片 — 使用 ProCard + Tag                                    */}
        {/* ================================================================= */}
        <section className="mt-16">
          <div className="flex items-center gap-3 mb-8">
            <h2 className="text-2xl font-bold text-zinc-900 m-0">{t('coreFeatures')}</h2>
            <Tag variant="emerald" size="sm">
              {features.length} 项
            </Tag>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, idx) => {
              const title = t(f.titleKey);
              const desc = t(f.descKey);
              return (
                <Link key={idx} href={f.link} className="no-underline group">
                  <ProCard
                    hoverable
                    bordered
                    padding="p-6"
                    className="h-full transition-all duration-300 group-hover:shadow-lg"
                    title={
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700">
                          {f.icon}
                        </div>
                        <span className="text-[15px] font-semibold text-zinc-900">{title}</span>
                      </div>
                    }
                    extra={
                      f.tag === 'new' ? (
                        <Tag variant="emerald" size="xs">
                          NEW
                        </Tag>
                      ) : (
                        <Tag variant="light" size="xs">
                          CORE
                        </Tag>
                      )
                    }
                  >
                    <p className="text-sm text-zinc-500 leading-relaxed mb-0">{desc}</p>
                    <div className="mt-4 flex items-center gap-1 text-sm font-medium text-zinc-400 group-hover:text-zinc-900 transition-colors">
                      {t('cloudService')}
                      <ArrowRightOutlined style={{ fontSize: 12 }} />
                    </div>
                  </ProCard>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ================================================================= */}
        {/* 状态卡片 — 使用 StatusCard                                       */}
        {/* ================================================================= */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-zinc-900 mb-6">系统状态</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatusCard
              icon={<CheckCircleOutlined />}
              title="服务状态"
              status={isLoggedIn ? '已登录 · 正常运行' : '未登录 · 游客模式'}
              statusType={isLoggedIn ? 'success' : 'info'}
            />
            <StatusCard
              icon={<FolderOutlined />}
              title="项目访问"
              status={isLoggedIn ? '可管理项目' : '请先登录'}
              statusType={isLoggedIn ? 'success' : 'warning'}
            />
            <StatusCard
              icon={<CloudOutlined />}
              title="云服务"
              status="在线可用"
              statusType="info"
            />
          </div>
        </section>

        {/* ================================================================= */}
        {/* CTA 区 — 非登录状态显示                                          */}
        {/* ================================================================= */}
        {!isLoggedIn && (
          <section className="mt-20 text-center">
            <ProCard
              bordered
              padding="p-12"
              className="bg-gradient-to-br from-zinc-900 to-zinc-800 !border-zinc-700"
            >
              <h2 className="text-2xl font-bold text-white mb-3">{t('cta.title')}</h2>
              <p className="text-sm text-zinc-400 max-w-sm mx-auto mb-8">{t('cta.desc')}</p>
              <Link href="/login">
                <Button variant="primary" size="lg">
                  {t('cta.loginBtn')}
                  <ArrowRightOutlined />
                </Button>
              </Link>
            </ProCard>
          </section>
        )}
      </PageContainer>

      {/* ================================================================= */}
      {/* Footer                                                            */}
      {/* ================================================================= */}
      <footer className="border-t border-zinc-200 bg-white mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-zinc-900 to-zinc-700 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">A</span>
            </div>
            <span className="text-sm text-zinc-500">AutocodeLLM</span>
          </div>
          <div className="flex items-center gap-4">
            <Tag variant="light" size="xs">
              v{process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0'}
            </Tag>
            <span className="text-xs text-zinc-400">
              © 2026 {t('footer')}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
