import { useState, useCallback } from 'react';
import { resolverAlerta } from '@services/alertasService';
import type { Alerta, ApiError } from '@/types';

type MutStatus = 'idle' | 'loading' | 'success' | 'error';

interface UseResolverAlertaResult {
  status: MutStatus;
  error: string | null;
  execute: (id: number) => Promise<Alerta | null>;
  reset: () => void;
}

export function useResolverAlerta(): UseResolverAlertaResult {
  const [status, setStatus] = useState<MutStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (id: number): Promise<Alerta | null> => {
    setStatus('loading');
    setError(null);
    try {
      const result = await resolverAlerta(id);
      setStatus('success');
      return result;
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr?.message ?? 'Erro ao resolver alerta.');
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
