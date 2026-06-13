import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ThemeProvider } from '@/lib/theme-provider';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'AutocodeLLM — AI 编码代理平台',
  description: 'AutocodeLLM 编码代理平台，支持函数调用、任务代理、文件操作、Web 搜索等完整工具链',
  keywords: ['编码', '代理', '自动化工具'],
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
        <AntdRegistry>
          <ThemeProvider>
            <NextIntlClientProvider messages={messages}>
              {children}
            </NextIntlClientProvider>
          </ThemeProvider>
        </AntdRegistry>
      </body>
    </html>
  );

  return content;
}
