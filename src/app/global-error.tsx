'use client';

import { useEffect } from 'react';
import { Button, Result } from 'antd';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="zh">
      <body>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#ffffff',
            padding: 24,
          }}
        >
          <Result
            status="error"
            title="页面加载失败"
            subTitle="抱歉，页面在加载过程中遇到了错误。请尝试刷新页面。"
            extra={[
              <Button key="reload" type="primary" onClick={reset}>
                重新加载
              </Button>,
              <Button key="home" onClick={() => window.location.href = '/'}>
                返回首页
              </Button>,
            ]}
          />
        </div>
      </body>
    </html>
  );
}