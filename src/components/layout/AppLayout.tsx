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
import styles from './AppLayout.module.css';

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

  const SidebarContent = () => (
    <div className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <Title level={4} className={styles.sidebarTitle!}>
          {t('common:appName')}
        </Title>
      </div>
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        items={translatedMenuItems}
        onClick={({ key }) => {
          router.push(key);
          setMobileOpen(false);
        }}
        className={styles.sidebarMenu!}
      />
    </div>
  );

  return (
    <Layout className={styles.layout!}>
      <div className={styles.desktopSider!}>
        <SidebarContent />
      </div>
      <Header className={styles.header!}>
        <Button
          type="text"
          icon={<MenuOutlined />}
          className={styles.menuToggle!}
          onClick={() => setMobileOpen(true)}
        />
        <Title level={5} className={styles.headerTitle!}>
          {t('common:appName')}
        </Title>
      </Header>
      <Layout className={styles.mainLayout!}>
        <Content className={styles.content!}>
          {children}
        </Content>
      </Layout>
      <Drawer
        placement="left"
        onClose={() => setMobileOpen(false)}
        open={mobileOpen}
        width={280}
        destroyOnClose
        styles={{ body: { padding: 0 } }}
      >
        <SidebarContent />
      </Drawer>
    </Layout>
  );
}
