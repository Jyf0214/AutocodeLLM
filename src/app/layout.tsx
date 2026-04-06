import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';
import { ThemeProvider } from '@lobehub/ui';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'AutocodeLLM',
  description: 'AI 编码代理平台 — 支持函数调用、任务代理、文件操作、Web 搜索等完整工具链',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();

  return (
    <html lang="zh" suppressHydrationWarning>
      <body>
        <ThemeProvider themeMode="light">
          <NextIntlClientProvider messages={messages}>
            <AntdRegistry>
              <ConfigProvider
                theme={{
                  token: {
                    borderRadius: 6,
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Microsoft YaHei', sans-serif",
                    fontSize: 14,
                  },
                  components: {
                    Button: {
                      borderRadius: 6,
                      controlHeight: 36,
                    },
                    Input: {
                      borderRadius: 6,
                      controlHeight: 36,
                    },
                  },
                }}
              >
                {children}
              </ConfigProvider>
            </AntdRegistry>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
