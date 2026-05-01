'use client';

import { ClerkProvider as ClerkProviderBase, useAuth } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import type { ReactNode } from 'react';

interface ClerkProviderWrapperProps {
  children: ReactNode;
}

/**
 * Clerk Provider 包装组件
 * 仅在客户端渲染，根据主题提供相应的 Clerk 主题
 */
export default function ClerkProviderWrapper({ children }: ClerkProviderWrapperProps) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return <>{children}</>;
  }

  return (
    <ClerkProviderBase
      publishableKey={publishableKey}
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: '#000000',
          borderRadius: '6px',
        },
      }}
    >
      {children}
    </ClerkProviderBase>
  );
}
