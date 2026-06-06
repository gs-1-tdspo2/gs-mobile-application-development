import { useState, useCallback } from 'react';
import { createEstacao } from '@services/estacoesService';
import type { CreateEstacaoRequest, EstacaoIot, ApiError } from '@/types';

type MutStatus = 'idle' | 'loading' | 'success' | 'error';

interface UseCreateEstacaoResult {
  status: MutStatus;
  error: string | null;
  execute: (data: CreateEstacaoRequest) => Promise<EstacaoIot | null>;
  reset: () => void;
}

export function useCreateEstacao(): UseCreateEstacaoResult {
  const [status, setStatus] = useState<MutStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (data: CreateEstacaoRequest): Promise<EstacaoIot | null> => {
    setStatus('loading');
    setError(null);
    try {
      const result = await createEstacao(data);
      setStatus('success');
      return result;
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr?.message ?? 'Erro ao cadastrar estação.');
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
