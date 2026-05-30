import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';
import { ThemeProvider } from '@/lib/ui';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'AutocodeLLM — AI 编码代理平台',
  description: '基于 LobeHub UI 的 AI 编码代理平台，支持函数调用、任务代理、文件操作、Web 搜索等完整工具链',
  keywords: ['AI', '编码', '代理', 'LobeHub', 'LLM', '自动化工具'],
  authors: [{ name: 'Jyf0214' }],
  creator: 'Jyf0214',
  publisher: 'AutocodeLLM',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

/**
 * 根布局组件
 * 提供全局主题、国际化、Ant Design 配置
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();

  const content = (
    <html lang="zh" suppressHydrationWarning>
      <body>
        <ThemeProvider themeMode="light">
          <MantineProvider
            theme={{
              primaryColor: 'dark',
              defaultRadius: 'md',
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Microsoft YaHei', sans-serif",
              fontSizes: { md: '14px' },
              components: {
                Button: { defaultProps: { radius: 'md' } },
                Input: { defaultProps: { radius: 'md' } },
                Card: { defaultProps: { radius: 'md' } },
                Modal: { defaultProps: { radius: 'md' } },
              },
            }}
          >
            <AntdRegistry>
              <ConfigProvider
                theme={{
                  token: {
                    colorPrimary: '#000000',
                    borderRadius: 6,
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Microsoft YaHei', sans-serif",
                    fontSize: 14,
                  },
                  components: {
                    Button: { borderRadius: 6, controlHeight: 36 },
                    Input: { borderRadius: 6, controlHeight: 36 },
                    Card: { borderRadius: 12 },
                    Modal: { borderRadius: 12 },
                  },
                }}
              >
                <NextIntlClientProvider messages={messages}>
                  <Notifications position="top-right" zIndex={10000} />
                  {children}
                </NextIntlClientProvider>
              </ConfigProvider>
            </AntdRegistry>
          </MantineProvider>
        </ThemeProvider>
      </body>
    </html>
  );

  return content;
}
