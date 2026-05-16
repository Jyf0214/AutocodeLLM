'use client';

import { useEffect, useState, useCallback } from 'react';
import { message } from 'antd';
import { CopyOutlined, ReloadOutlined, HomeOutlined } from '@ant-design/icons';

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

  const handleCopy = useCallback(() => {
    const text = [
      `错误: ${error.message}`,
      error.digest ? `Digest: ${error.digest}` : '',
      '',
      error.stack ?? '',
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(text).then(
      () => message.success('已复制错误信息'),
      () => message.error('复制失败'),
    );
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
            background: 'var(--bg-primary)',
            padding: 24,
          }}
        >
          <div style={{ maxWidth: 520, width: '100%' }}>
            {/* 错误图标 */}
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                border: '2px solid var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                fontSize: 28,
                color: 'var(--text-primary)',
              }}
            >
              !
            </div>

            {/* 标题 */}
            <h2
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: 'var(--text-primary)',
                textAlign: 'center',
                margin: '0 0 8px',
              }}
            >
              页面加载失败
            </h2>

            {/* 描述 */}
            <p
              style={{
                fontSize: 14,
                color: 'var(--text-tertiary)',
                textAlign: 'center',
                margin: '0 0 8px',
                lineHeight: 1.6,
              }}
            >
              抱歉，页面在加载过程中遇到了错误。请尝试刷新页面。
            </p>

            {/* 错误信息 */}
            {error.message && (
              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  borderRadius: 8,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-primary)',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <p
                    style={{
                      fontSize: 13,
                      color: '#ff4d4f',
                      margin: 0,
                      wordBreak: 'break-all',
                      lineHeight: 1.5,
                      flex: 1,
                    }}
                  >
                    {error.message}
                  </p>
                  <button
                    onClick={handleCopy}
                    title="复制错误信息"
                    style={{
                      flexShrink: 0,
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--border-primary)',
                      borderRadius: 6,
                      background: 'var(--bg-primary)',
                      cursor: 'pointer',
                      color: 'var(--text-secondary)',
                      fontSize: 14,
                    }}
                  >
                    <CopyOutlined />
                  </button>
                </div>

                {error.digest && (
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '8px 0 0' }}>
                    Digest: {error.digest}
                  </p>
                )}
              </div>
            )}

            {/* 展开详情 */}
            {error.stack && (
              <>
                <button
                  onClick={() => setShowDetail(!showDetail)}
                  style={{
                    marginTop: 8,
                    padding: 0,
                    fontSize: 12,
                    color: 'var(--text-tertiary)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  {showDetail ? '隐藏错误详情' : '显示错误详情'}
                </button>

                {showDetail && (
                  <pre
                    style={{
                      marginTop: 8,
                      padding: 12,
                      borderRadius: 8,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-primary)',
                      fontSize: 11,
                      lineHeight: 1.5,
                      overflow: 'auto',
                      maxHeight: 240,
                      color: 'var(--text-secondary)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                    }}
                  >
                    {error.stack}
                  </pre>
                )}
              </>
            )}

            {/* 按钮 */}
            <div
              style={{
                display: 'flex',
                gap: 12,
                justifyContent: 'center',
                marginTop: 32,
              }}
            >
              <button
                onClick={reset}
                style={{
                  height: 40,
                  padding: '0 20px',
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#fff',
                  background: 'var(--text-primary)',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <ReloadOutlined />
                重新加载
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                style={{
                  height: 40,
                  padding: '0 20px',
                  fontSize: 14,
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  background: 'transparent',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <HomeOutlined />
                返回首页
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}