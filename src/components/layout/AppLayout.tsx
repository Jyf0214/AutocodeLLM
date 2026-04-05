'use client';

import { useMemo, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { SideNav, Header, Menu, ActionIcon, ThemeSwitch, Icon } from '@lobehub/ui';
import {
  HomeOutlined,
  FolderOutlined,
  SettingOutlined,
  EnvironmentOutlined,
  CloudServerOutlined,
  TeamOutlined,
  SyncOutlined,
  AppstoreOutlined,
  ApiOutlined,
  BookOutlined,
  PlayCircleOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { Drawer } from 'antd';
import '@/styles/AppLayout.css';

const menuItems = [
  { key: '/', icon: HomeOutlined, label: 'common.appName' },
  { key: '/workplace', icon: FolderOutlined, label: 'common.workplace' },
  { key: '/setting/mcp', icon: SettingOutlined, label: 'common.mcp' },
  { key: '/env', icon: EnvironmentOutlined, label: 'common.env' },
  { key: '/workers', icon: CloudServerOutlined, label: 'common.workers' },
  { key: '/agents', icon: TeamOutlined, label: 'common.agents' },
  { key: '/sync', icon: SyncOutlined, label: 'common.sync' },
  { key: '/model', icon: AppstoreOutlined, label: 'common.models' },
  { key: '/openai/provider', icon: ApiOutlined, label: 'common.providers' },
  { key: '/docs', icon: BookOutlined, label: 'common.docs' },
  { key: '/demo', icon: PlayCircleOutlined, label: 'common.demo' },
];

const themeModeMap: Record<string, 'auto' | 'light' | 'dark'> = {
  system: 'auto',
  light: 'light',
  dark: 'dark',
};

interface AppLayoutProps {
  children: React.ReactNode;
}

function SidebarContent({
  items,
  selectedKey,
  onNavigate,
}: {
  items: { key: string; icon: typeof HomeOutlined; label: string }[];
  selectedKey: string;
  onNavigate: (key: string) => void;
}) {
  const { theme, setTheme } = useTheme();

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

  const lobeMenuItems = items.map((item) => ({
    key: item.key,
    icon: <Icon icon={item.icon} />,
    label: item.label,
  }));

  return (
    <SideNav
      avatar={
        <span style={{ fontSize: 16, fontWeight: 600 }}>
          AutocodeLLM
        </span>
      }
      bottomActions={
        <ThemeSwitch
          themeMode={themeModeMap[theme ?? 'system'] ?? 'auto'}
          onThemeSwitch={handleThemeSwitch}
          labels={{
            auto: '跟随系统',
            dark: '深色模式',
            light: '浅色模式',
          }}
        />
      }
      style={{ width: '100%', borderRight: 'none' }}
    >
      <Menu
        items={lobeMenuItems}
        selectedKeys={[selectedKey]}
        onClick={({ key }) => {
          onNavigate(key);
        }}
        variant="borderless"
        style={{ width: '100%' }}
      />
    </SideNav>
  );
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations();
  const [mobileOpen, setMobileOpen] = useState(false);

  const selectedKey = useMemo(() => {
    return menuItems.find((item) => pathname.startsWith(item.key))?.key ?? '/';
  }, [pathname]);

  const translatedMenuItems = useMemo(
    () =>
      menuItems.map((item) => {
        const parts = item.label.split('.');
        const namespace = parts[0] ?? '';
        const key = parts[1] ?? '';
        return {
          key: item.key,
          icon: item.icon,
          label: t(`${namespace}.${key}`),
        };
      }),
    [t],
  );

  const handleNavigate = (key: string) => {
    router.push(key);
    setMobileOpen(false);
  };

  return (
    <div className="app-layout">
      <div className="desktop-sider">
        <SidebarContent
          items={translatedMenuItems}
          selectedKey={selectedKey}
          onNavigate={handleNavigate}
        />
      </div>
      <Header
        logo={
          <span style={{ fontSize: 16, fontWeight: 600 }}>
            AutocodeLLM
          </span>
        }
        actions={
          <ActionIcon
            icon={MenuOutlined}
            size="large"
            onClick={() => {
              setMobileOpen(true);
            }}
            className="mobile-menu-btn"
          />
        }
        className="app-header"
      />
      <main className="main-layout">
        <div className="app-content">{children}</div>
      </main>
      <Drawer
        placement="left"
        onClose={() => {
          setMobileOpen(false);
        }}
        open={mobileOpen}
        size="large"
        destroyOnHidden
        styles={{ body: { padding: 0 } }}
      >
        <SidebarContent
          items={translatedMenuItems}
          selectedKey={selectedKey}
          onNavigate={handleNavigate}
        />
      </Drawer>
    </div>
  );
}
