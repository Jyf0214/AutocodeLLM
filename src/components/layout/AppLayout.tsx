'use client';

import { useCallback, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { ActionIcon, ThemeSwitch } from '@/lib/ui';
import {
  HomeOutlined,
  FolderOutlined,
  SettingOutlined,
  EnvironmentOutlined,
  UserOutlined,
  CloudServerOutlined,
  TeamOutlined,
  SyncOutlined,
  ApiOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { Drawer, Menu } from 'antd';

/**
 * 菜单项配置
 */
const MENU_ITEMS = [
  { key: '/', icon: <HomeOutlined />, labelKey: 'common.appName' },
  { key: '/workplace', icon: <FolderOutlined />, labelKey: 'common.workplace' },
  { key: '/mcp', icon: <SettingOutlined />, labelKey: 'common.mcp' },
  { key: '/provider', icon: <ApiOutlined />, labelKey: 'common.providers' },
  { key: '/setting', icon: <EnvironmentOutlined />, labelKey: 'common.setting' },
  { key: '/agents', icon: <TeamOutlined />, labelKey: 'common.agents' },
  { key: '/skills', icon: <SyncOutlined />, labelKey: 'common.skills' },
  { key: '/state', icon: <CloudServerOutlined />, labelKey: 'common.state' },
  { key: '/cloud', icon: <CloudServerOutlined />, labelKey: 'common.cloud' },
  { key: '/account', icon: <UserOutlined />, labelKey: 'common.account' },
] as const;

const THEME_MODE_MAP: Record<string, 'auto' | 'light' | 'dark'> = {
  system: 'auto',
  light: 'light',
  dark: 'dark',
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations();
  const { theme, setTheme } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 首页不显示导航
  const isHomePage = pathname === '/';

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

  const isChatPage = pathname.startsWith('/chat/');

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* 左上角菜单按钮 — 首页不显示 */}
      {!isHomePage && (
        <div
          style={{
            position: 'fixed',
            top: 12,
            left: 12,
            zIndex: 1000,
          }}
        >
          <ActionIcon
            icon={<MenuOutlined />}
            size={36}
            onClick={() => setDrawerOpen(true)}
          />
        </div>
      )}

      {/* 左侧抽屉导航 */}
      <Drawer
        placement="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={260}
        styles={{ body: { padding: 0 } }}
        title={
          <span style={{ fontSize: 16, fontWeight: 600 }}>AutocodeLLM</span>
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
        style={
          isChatPage
            ? { height: '100vh', overflow: 'hidden' }
            : {
                maxWidth: 1200,
                margin: '0 auto',
                padding: isHomePage ? 0 : '48px 16px 24px',
              }
        }
      >
        {children}
      </div>
    </div>
  );
}