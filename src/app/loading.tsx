'use client';

import { useEffect } from 'react';
import { useLoading } from '@/components/LoadingContext';

export default function Loading() {
  const { startLoading, stopLoading } = useLoading();

  useEffect(() => {
    startLoading();
    return () => {
      stopLoading();
    };
  }, [startLoading, stopLoading]);

  return null;
}
