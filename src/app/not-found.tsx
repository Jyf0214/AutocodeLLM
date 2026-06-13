'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { HomeOutlined, ArrowLeftOutlined } from '@ant-design/icons';

export default function NotFoundPage() {
  const t = useTranslations('notFound');
  const router = useRouter();

  return (
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
      <div style={{ maxWidth: 400, textAlign: 'center' }}>
        {/* 404 数字 */}
        <div
          style={{
            fontSize: 120,
            fontWeight: 800,
            color: 'var(--text-primary)',
            lineHeight: 1,
            marginBottom: 16,
            letterSpacing: '-4px',
            opacity: 0.15,
          }}
        >
          404
        </div>

        {/* 标题 */}
        <h2
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: 'var(--text-primary)',
            margin: '0 0 8px',
          }}
        >
          {t('title')}
        </h2>

        {/* 描述 */}
        <p
          style={{
            fontSize: 14,
            color: 'var(--text-tertiary)',
            margin: '0 0 32px',
            lineHeight: 1.6,
          }}
        >
          {t('description')}
        </p>

        {/* 按钮 */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={() => { router.push('/'); }}
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
            <HomeOutlined />
            {t('goHome')}
          </button>
          <button
            onClick={() => { router.back(); }}
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
            <ArrowLeftOutlined />
            {t('goBack')}
          </button>
        </div>
      </div>
    </div>
  );
}