'use client';

import React from 'react';
import { ConfigProvider as AntdConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';

interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * Ant Design 主题配置提供器
 * 独立拆分自 layout.tsx，便于维护
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <AntdConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#000000',
          colorSuccess: '#16a34a',
          colorWarning: '#f59e0b',
          colorError: '#dc2626',
          borderRadius: 8,
          fontSize: 14,
        },
        components: {
          Button: { borderRadius: 10, controlHeight: 40 },
          Input: { borderRadius: 8, controlHeight: 36 },
          Card: { borderRadius: 12 },
          Modal: { borderRadiusLG: 12 },
          Table: { borderRadius: 8 },
        },
      }}
    >
      {children}
    </AntdConfigProvider>
  );
}
