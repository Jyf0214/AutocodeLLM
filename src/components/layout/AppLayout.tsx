'use client';

import { useMemo, useState } from 'react';
import { Layout, Menu, Typography, Button, Drawer } from 'antd';
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
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import '@/styles/AppLayout.css';

const { Content, Header } = Layout;
const { Title } = Typography;

const menuItems = [
  { key: '/', icon: <HomeOutlined />, label: 'common.appName' },
  { key: '/workplace', icon: <FolderOutlined />, label: 'common.workplace' },
  { key: '/setting/mcp', icon: <SettingOutlined />, label: 'common.mcp' },
  { key: '/env', icon: <EnvironmentOutlined />, label: 'common.env' },
  { key: '/workers', icon: <CloudServerOutlined />, label: 'common.workers' },
  { key: '/agents', icon: <TeamOutlined />, label: 'common.agents' },
  { key: '/sync', icon: <SyncOutlined />, label: 'common.sync' },
  { key: '/model', icon: <AppstoreOutlined />, label: 'common.models' },
  { key: '/openai/provider', icon: <ApiOutlined />, label: 'common.providers' },
  { key: '/docs', icon: <BookOutlined />, label: 'common.docs' },
  { key: '/demo', icon: <PlayCircleOutlined />, label: 'common.demo' },
];

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
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <Title level={4} style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 600 }}>
          AutocodeLLM
        </Title>
      </div>
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        items={items}
        onClick={({ key }) => {
          onNavigate(key);
        }}
        className="sidebar-menu"
      />
    </div>
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
    <Layout className="app-layout">
      <div className="desktop-sider">
        <SidebarContent
          items={translatedMenuItems}
          selectedKey={selectedKey}
          onNavigate={handleNavigate}
        />
      </div>
      <Header className="app-header">
        <Button
          type="text"
          icon={<MenuOutlined />}
          className="menu-toggle"
          onClick={() => {
            setMobileOpen(true);
          }}
        />
        <Title level={5} style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 600 }}>
          AutocodeLLM
        </Title>
      </Header>
      <Layout className="main-layout">
        <Content className="app-content">
          {children}
        </Content>
      </Layout>
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
    </Layout>
  );
}
