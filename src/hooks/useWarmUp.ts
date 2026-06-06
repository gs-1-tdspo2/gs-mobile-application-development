import { useState, useCallback } from 'react';
import { api } from '@services/api';
import { API_ENDPOINTS } from '@constants/api';
import type { ApiError } from '@/types';

export type WarmUpStatus = 'idle' | 'loading' | 'ready' | 'timeout' | 'error';

export function useWarmUp() {
  const [status, setStatus] = useState<WarmUpStatus>('idle');

  const start = useCallback(async () => {
    setStatus('loading');
    try {
      await api.get(API_ENDPOINTS.HEALTH, true);
      setStatus('ready');
    } catch (err) {
      const apiErr = err as ApiError;
      setStatus(apiErr?.status === 408 ? 'timeout' : 'error');
    }
  }, []);

  return { status, start };
}
