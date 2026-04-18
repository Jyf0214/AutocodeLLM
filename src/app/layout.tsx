import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';
import { ThemeProvider } from '@lobehub/ui';
import AppLayout from '@/components/layout/AppLayout';
import '../styles/globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const t = (await import('next-intl/server')).getTranslations('metadata');
  const title = await t('title');
  const description = await t('description');
  const keywords = (await t('keywords')) as unknown as string[];

  return {
    title,
    description,
    keywords,
    authors: [{ name: 'Jyf0214' }],
    creator: 'Jyf0214',
    publisher: 'AutocodeLLM',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
  };
}

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
                    fontFamily:
                      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Microsoft YaHei', sans-serif",
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
                    Card: {
                      borderRadius: 12,
                    },
                    Modal: {
                      borderRadius: 12,
                    },
                  },
                }}
              >
                <AppLayout>{children}</AppLayout>
              </ConfigProvider>
            </AntdRegistry>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
