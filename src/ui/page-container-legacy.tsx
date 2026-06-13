'use client';

import React from 'react';

/**
 * 旧版 PageContainer (带 title/subtitle/extra)
 * 向后兼容，用于尚未迁移到新版 PageContainer 的页面
 */
interface PageContainerProps {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  extra?: React.ReactNode;
}

const maxWidthPresets = { lg: 1200, md: 900, sm: 720, full: '100%' } as const;
const paddingPresets = { default: '32px 16px', compact: '24px 16px' } as const;

export function PageContainer({ children, title, subtitle, extra, maxWidth = 'lg', padding = 'default' }: PageContainerProps & { maxWidth?: keyof typeof maxWidthPresets | number; padding?: keyof typeof paddingPresets }) {
  const resolvedMaxWidth = typeof maxWidth === 'number' ? maxWidth : maxWidthPresets[maxWidth];
  const resolvedPadding = paddingPresets[padding];
  return (
    <div style={{ maxWidth: resolvedMaxWidth, margin: '0 auto', padding: resolvedPadding }}>
      {(title ?? extra) && (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            {title && <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>{title}</h1>}
            {subtitle && <p style={{ fontSize: 14, color: 'var(--text-tertiary)', margin: '4px 0 0' }}>{subtitle}</p>}
          </div>
          {extra && <div>{extra}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
