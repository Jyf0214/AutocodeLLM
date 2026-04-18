'use client';

import { Flexbox, Text, Button } from '@lobehub/ui';
import { HomeOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { memo } from 'react';

/**
 * 404 错误页面组件
 * 提供友好的错误提示和导航选项
 */
export default function NotFoundPage() {
  const router = useRouter();

  return (
    <Flexbox
      align="center"
      justify="center"
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg-layout)',
        padding: 24,
      }}
    >
      <Flexbox
        gap={32}
        align="center"
        style={{ maxWidth: 480, textAlign: 'center' }}
      >
        {/* 404 视觉元素 */}
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: '50%',
            background:
              'linear-gradient(135deg, var(--lobe-color-primary), var(--lobe-color-warning))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 48,
            fontWeight: 'bold',
            color: '#fff',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          }}
        >
          404
        </div>

        {/* 错误信息 */}
        <Flexbox gap={12} align="center">
          <Text
            strong
            style={{
              fontSize: 28,
              background:
                'linear-gradient(135deg, var(--lobe-color-primary), var(--lobe-color-violet))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            页面未找到
          </Text>
          <Text
            type="secondary"
            style={{
              fontSize: 16,
              lineHeight: 1.6,
              maxWidth: 400,
            }}
          >
            抱歉，您访问的页面不存在或已被移除
          </Text>
        </Flexbox>

        {/* 操作按钮 */}
        <Flexbox gap={12} horizontal>
          <Button
            type="primary"
            icon={<HomeOutlined />}
            size="large"
            onClick={() => router.push('/')}
            style={{
              borderRadius: 10,
              padding: '0 24px',
            }}
          >
            返回首页
          </Button>
          <Button
            icon={<ArrowLeftOutlined />}
            size="large"
            onClick={() => router.back()}
            style={{
              borderRadius: 10,
              padding: '0 24px',
            }}
          >
            返回上一页
          </Button>
        </Flexbox>

        {/* 帮助提示 */}
        <div
          style={{
            marginTop: 24,
            padding: '12px 16px',
            borderRadius: 8,
            background: 'var(--color-fill-quaternary)',
            border: '1px solid var(--color-border)',
          }}
        >
          <Text type="secondary" style={{ fontSize: 13 }}>
            如果您认为这是一个错误，请{' '}
            <a
              href="https://github.com/Jyf0214/AutocodeLLM/issues"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--lobe-color-primary)',
                textDecoration: 'none',
              }}
            >
              提交 Issue
            </a>
          </Text>
        </div>
      </Flexbox>
    </Flexbox>
  );
}
