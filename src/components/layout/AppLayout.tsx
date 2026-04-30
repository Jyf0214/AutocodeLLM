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
} from '@/lib/ui';
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
import { Drawer, Typography } from 'antd';
import { useIsMobile } from '@/hooks/useMediaQuery';

/**
 * 菜单项配置
 * 定义导航菜单的结构和图标
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

/**
 * 主题模式映射
 */
const THEME_MODE_MAP: Record<string, 'auto' | 'light' | 'dark'> = {
  system: 'auto',
  light: 'light',
  dark: 'dark',
};

/**
 * 应用布局组件
 * 提供全局侧边栏导航和主题切换
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations();
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  /**
   * 当前选中的菜单项
   */
  const selectedKey = useMemo(() => {
    return (
      MENU_ITEMS.find((item) => pathname.startsWith(item.key))?.key ?? '/'
    );
  }, [pathname]);

  /**
   * 翻译后的菜单项
   */
  const translatedMenuItems = useMemo(
    () =>
      MENU_ITEMS.map((item) => ({
        key: item.key,
        icon: item.icon,
        label: t(item.labelKey),
      })),
    [t],
  );

  /**
   * 导航跳转处理
   */
  const handleNavigate = useCallback(
    (key: string) => {
      router.push(key);
      setMobileOpen(false);
    },
    [router],
  );

  /**
   * 主题切换处理
   */
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

  /**
   * 侧边栏内容
   */
  const sidebarContent = useMemo(
    () => (
      <SideNav
        avatar={
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              fontFamily:
                "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
          >
            AutocodeLLM
          </span>
        }
        bottomActions={
          <ThemeSwitch
            themeMode={THEME_MODE_MAP[theme ?? 'light'] ?? 'light'}
            onThemeSwitch={handleThemeSwitch}
            labels={{
              auto: '跟随系统',
              dark: '深色模式',
              light: '浅色模式',
            }}
          />
        }
      >
        <Menu
          items={translatedMenuItems}
          selectedKeys={[selectedKey]}
          onClick={({ key }) => handleNavigate(key)}
          variant="borderless"
        />
      </SideNav>
    ),
    [
      theme,
      handleThemeSwitch,
      translatedMenuItems,
      selectedKey,
      handleNavigate,
    ],
  );

  /**
   * 移动端抽屉
   */
  const mobileDrawer = useMemo(
    () => (
      <Drawer
        placement="left"
        onClose={() => setMobileOpen(false)}
        open={mobileOpen}
        size="85%"
        styles={{
          body: { padding: '8px 0' },
          mask: { backgroundColor: 'rgba(0, 0, 0, 0.45)' },
        }}
        destroyOnHidden
        title={
          <Typography.Title
            level={5}
            style={{ margin: 0, fontSize: 16, fontWeight: 600 }}
          >
            AutocodeLLM
          </Typography.Title>
        }
        extra={
          <ThemeSwitch
            themeMode={THEME_MODE_MAP[theme ?? 'light'] ?? 'light'}
            onThemeSwitch={handleThemeSwitch}
            labels={{
              auto: '跟随系统',
              dark: '深色模式',
              light: '浅色模式',
            }}
          />
        }
      >
        <Menu
          items={translatedMenuItems}
          selectedKeys={[selectedKey]}
          onClick={({ key }) => handleNavigate(key)}
          variant="borderless"
          style={{ borderInlineEnd: 'none' }}
        />
      </Drawer>
    ),
    [
      mobileOpen,
      theme,
      handleThemeSwitch,
      translatedMenuItems,
      selectedKey,
      handleNavigate,
    ],
  );

  /**
   * 判断是否为聊天页面（需要特殊布局处理）
   */
  const isChatPage = pathname.startsWith('/chat/');

  return (
    <Layout
      sidebar={isMobile ? undefined : sidebarContent}
      header={
        <Header
          logo={
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                fontFamily:
                  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              }}
            >
              AutocodeLLM
            </span>
          }
          actions={
            isMobile ? (
              <ActionIcon
                icon={<MenuOutlined />}
                size={24}
                onClick={() => setMobileOpen(true)}
              />
            ) : undefined
          }
        />
      }
    >
      <LayoutMain>
        <div
          style={
            isChatPage
              ? { height: '100%', overflow: 'hidden' }
              : {
                  maxWidth: 1200,
                  margin: '0 auto',
                  padding: '24px 16px',
                }
          }
        >
          {children}
        </div>
      </LayoutMain>
      {isMobile && mobileDrawer}
    </Layout>
  );
}
