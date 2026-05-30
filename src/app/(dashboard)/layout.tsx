'use client';

import { useCallback, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { ThemeSwitch } from '@/lib/ui';
import {
  HomeOutlined,
  FolderOutlined,
  SettingOutlined,
  EnvironmentOutlined,
  UserOutlined,
  CloudServerOutlined,
  MenuOutlined,
  FileOutlined,
} from '@ant-design/icons';
import { Drawer, Menu } from 'antd';

/**
 * 菜单项配置
 */
const MENU_ITEMS = [
  { key: '/', icon: <HomeOutlined />, labelKey: 'common.appName' },
  { key: '/project', icon: <FolderOutlined />, labelKey: 'common.project' },
  { key: '/env', icon: <EnvironmentOutlined />, labelKey: 'common.env' },
  { key: '/setting', icon: <SettingOutlined />, labelKey: 'common.setting' },
  { key: '/logs', icon: <FileOutlined />, labelKey: 'common.logs' },
  { key: '/cloud', icon: <CloudServerOutlined />, labelKey: 'common.cloud' },
  { key: '/account', icon: <UserOutlined />, labelKey: 'common.account' },
] as const;

const THEME_MODE_MAP: Record<string, 'auto' | 'light' | 'dark'> = {
  system: 'auto',
  light: 'light',
  dark: 'dark',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations();
  const { theme, setTheme } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const selectedKey = useMemo(() => {
    return MENU_ITEMS.find((item) => pathname.startsWith(item.key))?.key ?? '/';
  }, [pathname]);

  const translatedMenuItems = useMemo(
    () =>
      MENU_ITEMS.map((item) => ({
        key: item.key,
        icon: item.icon,
        label: t(item.labelKey),
      })),
    [t],
  );

  const handleNavigate = useCallback(
    (key: string) => {
      router.push(key);
      setDrawerOpen(false);
    },
    [router],
  );

  const handleThemeSwitch = useCallback(
    (mode: 'auto' | 'light' | 'dark') => {
      const themeMap: Record<string, string> = { auto: 'system', light: 'light', dark: 'dark' };
      setTheme(themeMap[mode] ?? 'system');
    },
    [setTheme],
  );

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* 左上角菜单按钮 */}
      <button
        onClick={() => setDrawerOpen(true)}
        aria-label="打开菜单"
        style={{
          position: 'fixed',
          top: 12,
          left: 12,
          zIndex: 1000,
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--border-primary)',
          borderRadius: 8,
          background: 'var(--bg-primary)',
          cursor: 'pointer',
          padding: 0,
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--bg-secondary)';
          e.currentTarget.style.borderColor = 'var(--text-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--bg-primary)';
          e.currentTarget.style.borderColor = 'var(--border-primary)';
        }}
      >
        <MenuOutlined style={{ fontSize: 18, color: 'var(--text-primary)' }} />
      </button>

      {/* 左侧抽屉导航 */}
      <Drawer
        placement="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        size={240}
        closable={false}
        styles={{
          body: { padding: 0 },
          header: { padding: '16px 16px 8px', borderBottom: 'none' },
        }}
        title={
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            AutocodeLLM
          </span>
        }
        extra={
          <ThemeSwitch
            themeMode={THEME_MODE_MAP[theme ?? 'light'] ?? 'light'}
            onThemeSwitch={handleThemeSwitch}
            labels={{ auto: '自动', dark: '深色', light: '浅色' }}
          />
        }
      >
        <Menu
          mode="inline"
          items={translatedMenuItems}
          selectedKeys={[selectedKey]}
          onClick={({ key }) => handleNavigate(key)}
          style={{ borderInlineEnd: 'none' }}
        />
      </Drawer>

      {/* 主内容区 */}
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '48px 16px 24px',
        }}
      >
        {children}
      </div>
    </div>
  );
}
