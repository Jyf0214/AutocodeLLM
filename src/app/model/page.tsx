'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ModelPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/provider');
  }, [router]);
  return null;
}
