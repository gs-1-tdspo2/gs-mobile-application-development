import { useState, useCallback } from 'react';
import { fetchRegiao } from '@services/regioesService';
import type { RegiaoMonitorada, ApiError } from '@/types';
import type { FetchStatus } from '@hooks/useDashboardSummary';

interface UseRegiaoResult {
  status: FetchStatus;
  data: RegiaoMonitorada | null;
  errorMessage: string | null;
  load: (id: number) => Promise<void>;
}

export function useRegiao(): UseRegiaoResult {
  const [status, setStatus] = useState<FetchStatus>('idle');
  const [data, setData] = useState<RegiaoMonitorada | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async (id: number) => {
    setStatus('loading');
    setErrorMessage(null);
    try {
      const result = await fetchRegiao(id);
      setData(result);
      setStatus('success');
    } catch (err) {
      const apiErr = err as ApiError;
      setErrorMessage(apiErr?.message ?? 'Erro ao carregar região.');
      setStatus('error');
    }
  }, []);

  return { status, data, errorMessage, load };
}
