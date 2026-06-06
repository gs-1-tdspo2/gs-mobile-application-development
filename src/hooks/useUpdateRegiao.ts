import { useState, useCallback } from 'react';
import { updateRegiao } from '@services/regioesService';
import type { UpdateRegiaoRequest, RegiaoMonitorada, ApiError } from '@/types';

type MutStatus = 'idle' | 'loading' | 'success' | 'error';

interface UseUpdateRegiaoResult {
  status: MutStatus;
  error: string | null;
  execute: (id: number, data: UpdateRegiaoRequest) => Promise<RegiaoMonitorada | null>;
  reset: () => void;
}

export function useUpdateRegiao(): UseUpdateRegiaoResult {
  const [status, setStatus] = useState<MutStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (id: number, data: UpdateRegiaoRequest): Promise<RegiaoMonitorada | null> => {
    setStatus('loading');
    setError(null);
    try {
      const result = await updateRegiao(id, data);
      setStatus('success');
      return result;
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr?.message ?? 'Erro ao atualizar região.');
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
