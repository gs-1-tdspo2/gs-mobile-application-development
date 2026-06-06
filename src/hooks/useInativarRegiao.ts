import { useState, useCallback } from 'react';
import { inativarRegiao } from '@services/regioesService';
import type { ApiError } from '@/types';

type MutStatus = 'idle' | 'loading' | 'success' | 'error';

interface UseInativarRegiaoResult {
  status: MutStatus;
  error: string | null;
  execute: (id: number) => Promise<boolean>;
  reset: () => void;
}

export function useInativarRegiao(): UseInativarRegiaoResult {
  const [status, setStatus] = useState<MutStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (id: number): Promise<boolean> => {
    setStatus('loading');
    setError(null);
    try {
      await inativarRegiao(id);
      setStatus('success');
      return true;
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr?.message ?? 'Erro ao inativar região.');
      setStatus('error');
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

  return { status, error, execute, reset };
}
