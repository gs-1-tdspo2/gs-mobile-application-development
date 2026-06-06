import { useState, useCallback } from 'react';
import { createRegiao } from '@services/regioesService';
import type { CreateRegiaoRequest, RegiaoMonitorada, ApiError } from '@/types';

type MutStatus = 'idle' | 'loading' | 'success' | 'error';

interface UseCreateRegiaoResult {
  status: MutStatus;
  error: string | null;
  execute: (data: CreateRegiaoRequest) => Promise<RegiaoMonitorada | null>;
  reset: () => void;
}

export function useCreateRegiao(): UseCreateRegiaoResult {
  const [status, setStatus] = useState<MutStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (data: CreateRegiaoRequest): Promise<RegiaoMonitorada | null> => {
    setStatus('loading');
    setError(null);
    try {
      const result = await createRegiao(data);
      setStatus('success');
      return result;
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr?.message ?? 'Erro ao criar região.');
      setStatus('error');
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

  return { status, error, execute, reset };
}
