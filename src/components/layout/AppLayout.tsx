'use client';

import { useMemo } from 'react';
import { Layout, Menu, Typography } from 'antd';
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
} from '@ant-design/icons';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

const { Sider, Content } = Layout;
const { Title } = Typography;

const menuItems = [
  { key: '/', icon: <HomeOutlined />, label: 'common:appName' },
  { key: '/workplace', icon: <FolderOutlined />, label: 'common:workplace' },
  { key: '/setting/mcp', icon: <SettingOutlined />, label: 'common:mcp' },
  { key: '/env', icon: <EnvironmentOutlined />, label: 'common:env' },
  { key: '/workers', icon: <CloudServerOutlined />, label: 'common:workers' },
  { key: '/agents', icon: <TeamOutlined />, label: 'common:agents' },
  { key: '/sync', icon: <SyncOutlined />, label: 'common:sync' },
  { key: '/model', icon: <AppstoreOutlined />, label: 'common:models' },
  { key: '/openai/provider', icon: <ApiOutlined />, label: 'common:providers' },
  { key: '/docs', icon: <BookOutlined />, label: 'common:docs' },
  { key: '/demo', icon: <PlayCircleOutlined />, label: 'common:demo' },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations();

  const selectedKey = useMemo(() => {
    return menuItems.find((item) => pathname.startsWith(item.key))?.key ?? '/';
  }, [pathname]);

  const translatedMenuItems = useMemo(
    () =>
      menuItems.map((item) => ({
        key: item.key,
        icon: item.icon,
        label: t(item.label),
      })),
    [t],
  );

  return (
    <Layout style={{ minHeight: '100dvh' }}>
      <Sider
        breakpoint="lg"
        collapsedWidth={80}
        style={{
          borderRight: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <Title
            level={4}
            style={{
              margin: 0,
              color: 'var(--primary)',
              fontSize: 18,
            }}
          >
            {t('common:appName')}
          </Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={translatedMenuItems}
          onClick={({ key }) => {
            router.push(key);
          }}
          style={{ borderRight: 'none' }}
        />
      </Sider>
      <Layout>
        <Content
          style={{
            padding: 24,
            background: 'var(--background)',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
