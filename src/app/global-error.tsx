'use client';

import { useEffect, useState } from 'react';
import { Button, Result } from 'antd';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetail, setShowDetail] = useState(false);

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
            subTitle={
              <div style={{ maxWidth: 600 }}>
                <p style={{ marginBottom: 8 }}>
                  抱歉，页面在加载过程中遇到了错误。请尝试刷新页面。
                </p>
                {error?.message && (
                  <p style={{ marginBottom: 8, color: '#ff4d4f' }}>
                    错误信息：{error.message}
                  </p>
                )}
                {showDetail && error?.stack && (
                  <pre
                    style={{
                      background: '#f5f5f5',
                      padding: 12,
                      borderRadius: 8,
                      fontSize: 12,
                      overflow: 'auto',
                      maxHeight: 300,
                      textAlign: 'left',
                      marginTop: 8,
                    }}
                  >
                    {error.stack}
                  </pre>
                )}
                <Button
                  type="link"
                  onClick={() => setShowDetail(!showDetail)}
                  style={{ marginTop: 8, padding: 0 }}
                >
                  {showDetail ? '隐藏错误详情' : '显示错误详情'}
                </Button>
              </div>
            }
            extra={[
              <Button key="reload" type="primary" onClick={reset}>
                重新加载
              </Button>,
              <Button key="home" onClick={() => (window.location.href = '/')}>
                返回首页
              </Button>,
            ]}
          />
        </div>
      </body>
    </html>
  );
}