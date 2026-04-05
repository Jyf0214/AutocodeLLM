'use client';

import { useCallback, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import {
  SideNav,
  Header,
  Menu,
  ActionIcon,
  ThemeSwitch,
  Layout,
  LayoutMain,
} from '@lobehub/ui';
import {
  HomeOutlined,
  FolderOutlined,
  SettingOutlined,
  EnvironmentOutlined,
  UserOutlined,
  CloudServerOutlined,
  TeamOutlined,
  SyncOutlined,
  AppstoreOutlined,
  ApiOutlined,
  BookOutlined,
  PlayCircleOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { Drawer, Typography } from 'antd';

const menuItems = [
  { key: '/', icon: HomeOutlined, labelKey: 'common.appName' },
  { key: '/workplace', icon: FolderOutlined, labelKey: 'common.workplace' },
  { key: '/account', icon: UserOutlined, labelKey: 'common.account' },
  { key: '/setting/mcp', icon: SettingOutlined, labelKey: 'common.mcp' },
  { key: '/env', icon: EnvironmentOutlined, labelKey: 'common.env' },
  { key: '/workers', icon: CloudServerOutlined, labelKey: 'common.workers' },
  { key: '/agents', icon: TeamOutlined, labelKey: 'common.agents' },
  { key: '/sync', icon: SyncOutlined, labelKey: 'common.sync' },
  { key: '/model', icon: AppstoreOutlined, labelKey: 'common.models' },
  { key: '/openai/provider', icon: ApiOutlined, labelKey: 'common.providers' },
  { key: '/docs', icon: BookOutlined, labelKey: 'common.docs' },
  { key: '/demo', icon: PlayCircleOutlined, labelKey: 'common.demo' },
];

const themeModeMap: Record<string, 'auto' | 'light' | 'dark'> = {
  system: 'auto',
  light: 'light',
  dark: 'dark',
};

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const selectedKey = useMemo(() => {
    return menuItems.find((item) => pathname.startsWith(item.key))?.key ?? '/';
  }, [pathname]);

  const translatedMenuItems = useMemo(
    () =>
      menuItems.map((item) => ({
        key: item.key,
        icon: item.icon,
        label: t(item.labelKey),
      })),
    [t],
  );

  const handleNavigate = useCallback(
    (key: string) => {
      router.push(key);
      setMobileOpen(false);
    },
    [router],
  );

  const handleThemeSwitch = useCallback(
    (mode: 'auto' | 'light' | 'dark') => {
      const themeMap: Record<string, string> = {
        auto: 'system',
        light: 'light',
        dark: 'dark',
      };
      setTheme(themeMap[mode] ?? 'system');
    },
    [setTheme],
  );

  return (
    <Layout
      sidebar={
        <SideNav
          avatar={<span style={{ fontSize: 14, fontWeight: 600 }}>AutocodeLLM</span>}
          bottomActions={
            <ThemeSwitch
              themeMode={themeModeMap[theme ?? 'system'] ?? 'auto'}
              onThemeSwitch={handleThemeSwitch}
              labels={{ auto: '跟随系统', dark: '深色模式', light: '浅色模式' }}
            />
          }
        >
          <Menu
            items={translatedMenuItems}
            selectedKeys={[selectedKey]}
            onClick={({ key }) => { handleNavigate(key); }}
            variant="borderless"
          />
        </SideNav>
      }
      header={
        <Header
          logo={<span style={{ fontSize: 14, fontWeight: 600 }}>AutocodeLLM</span>}
          actions={
            <ActionIcon
              icon={MenuOutlined}
              size="large"
              onClick={() => { setMobileOpen(true); }}
            />
          }
        />
      }
    >
      <LayoutMain>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
          {children}
        </div>
      </LayoutMain>

      <Drawer
        placement="left"
        onClose={() => { setMobileOpen(false); }}
        open={mobileOpen}
        size="280"
        destroyOnHidden
        title={
          <Typography.Title level={5} style={{ margin: 0 }}>
            AutocodeLLM
          </Typography.Title>
        }
        styles={{ body: { padding: '8px 0' } }}
        extra={
          <ThemeSwitch
            themeMode={themeModeMap[theme ?? 'system'] ?? 'auto'}
            onThemeSwitch={handleThemeSwitch}
            labels={{ auto: '跟随系统', dark: '深色模式', light: '浅色模式' }}
          />
        }
      >
        <Menu
          items={translatedMenuItems}
          selectedKeys={[selectedKey]}
          onClick={({ key }) => { handleNavigate(key); }}
          variant="borderless"
          style={{ borderInlineEnd: 'none' }}
        />
      </Drawer>
    </Layout>
  );
}
