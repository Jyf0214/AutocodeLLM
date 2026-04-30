'use client';

import { Flexbox, Text, Button } from '@/lib/ui';
import { HomeOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { memo } from 'react';

export default memo(function NotFoundPage() {
  const t = useTranslations('notFound');
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
      <Flexbox gap={32} align="center" style={{ maxWidth: 480, textAlign: 'center' }}>
        {/* 404 视觉元素 */}
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--text-primary), var(--text-primary))',
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
              background: 'linear-gradient(135deg, var(--text-primary), var(--text-primary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {t('title')}
          </Text>
          <Text
            type="secondary"
            style={{
              fontSize: 16,
              lineHeight: 1.6,
              maxWidth: 400,
            }}
          >
            {t('description')}
          </Text>
        </Flexbox>

        {/* 操作按钮 */}
        <Flexbox gap={12} horizontal>
          <Button
            type="primary"
            icon={<HomeOutlined />}
            size="large"
            onClick={() => router.push('/')}
            style={{ borderRadius: 10, padding: '0 24px' }}
          >
            {t('goHome')}
          </Button>
          <Button
            icon={<ArrowLeftOutlined />}
            size="large"
            onClick={() => router.back()}
            style={{ borderRadius: 10, padding: '0 24px' }}
          >
            {t('goBack')}
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
            {t('reportIssue')}
            <a
              href="https://github.com/Jyf0214/AutocodeLLM/issues"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--text-primary)', textDecoration: 'none' }}
            >
              {t('submitIssue')}
            </a>
          </Text>
        </div>
      </Flexbox>
    </Flexbox>
  );
});
