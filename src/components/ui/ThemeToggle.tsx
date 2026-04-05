'use client';

import { useTheme } from 'next-themes';
import { Dropdown, Tooltip } from 'antd';
import { SunOutlined, MoonOutlined, LaptopOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import '@/styles/ThemeToggle.css';

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const currentTheme = (theme ?? 'system') as 'light' | 'dark' | 'system';
  const isDark = resolvedTheme === 'dark';

  const items: MenuProps['items'] = [
    {
      key: 'light',
      icon: <SunOutlined />,
      label: '浅色模式',
      onClick: () => {
        setTheme('light');
      },
    },
    {
      key: 'dark',
      icon: <MoonOutlined />,
      label: '深色模式',
      onClick: () => {
        setTheme('dark');
      },
    },
    {
      key: 'system',
      icon: <LaptopOutlined />,
      label: '跟随系统',
      onClick: () => {
        setTheme('system');
      },
    },
  ];

  const iconMap = {
    light: <SunOutlined />,
    dark: <MoonOutlined />,
    system: <LaptopOutlined />,
  };

  return (
    <Tooltip title="切换主题" placement="right">
      <Dropdown menu={{ items }} placement="bottomRight" trigger={['click']}>
        <button
          type="button"
          className={`theme-toggle ${isDark ? 'theme-toggle-dark' : ''}`}
          aria-label="切换主题"
        >
          {iconMap[currentTheme]}
        </button>
      </Dropdown>
    </Tooltip>
  );
}
