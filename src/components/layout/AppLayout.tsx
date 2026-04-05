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
  Icon,
  Layout,
  LayoutMain,
} from '@lobehub/ui';
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

const menuItems = [
  { key: '/', icon: HomeOutlined, labelKey: 'common.appName' },
  { key: '/workplace', icon: FolderOutlined, labelKey: 'common.workplace' },
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

function SidebarContent({
  items,
  selectedKey,
  onNavigate,
}: {
  items: { key: string; icon: React.ReactNode; label: string }[];
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

  return (
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
        items={items}
        selectedKeys={[selectedKey]}
        onClick={({ key }) => {
          onNavigate(key);
        }}
        variant="borderless"
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
      menuItems.map((item) => ({
        key: item.key,
        icon: <Icon icon={item.icon} />,
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

  return (
    <Layout>
      {/* Desktop sidebar */}
      <div
        style={{
          display: 'none',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          borderRight: '1px solid var(--border-primary)',
        }}
        className="desktop-sider"
      >
        <div style={{ width: 240, height: '100%', overflow: 'auto' }}>
          <SidebarContent
            items={translatedMenuItems}
            selectedKey={selectedKey}
            onNavigate={handleNavigate}
          />
        </div>
      </div>

      {/* Header */}
      <Header
        logo={<span style={{ fontSize: 14, fontWeight: 600 }}>AutocodeLLM</span>}
        actions={
          <ActionIcon
            icon={MenuOutlined}
            size="large"
            onClick={() => {
              setMobileOpen(true);
            }}
          />
        }
      />

      {/* Main content */}
      <LayoutMain style={{ marginTop: 48, paddingLeft: 0 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
          {children}
        </div>
      </LayoutMain>

      {/* Mobile drawer */}
      <Drawer
        placement="left"
        onClose={() => {
          setMobileOpen(false);
        }}
        open={mobileOpen}
        size={300}
        destroyOnHidden
        styles={{ body: { padding: 0 } }}
      >
        <SidebarContent
          items={translatedMenuItems}
          selectedKey={selectedKey}
          onNavigate={handleNavigate}
        />
      </Drawer>

      {/* Responsive styles via inline style tag */}
      <style>{`
        @media (min-width: 768px) {
          .desktop-sider {
            display: block !important;
          }
          .mobile-menu-btn {
            display: none !important;
          }
        }
      `}</style>
    </Layout>
  );
}
