'use client';

import { useEffect } from 'react';

export default function ModelPage() {
  useEffect(() => {
    window.location.href = '/provider';
  }, []);
  return null;
}
