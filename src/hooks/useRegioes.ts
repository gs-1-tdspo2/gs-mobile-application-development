import { useState, useCallback } from 'react';
import { fetchRegioes } from '@services/regioesService';
import type { RegiaoMonitorada, ApiError } from '@/types';
import type { FetchStatus } from '@hooks/useDashboardSummary';

interface UseRegioesResult {
  status: FetchStatus;
  data: RegiaoMonitorada[];
  errorMessage: string | null;
  load: () => Promise<void>;
}

export function useRegioes(): UseRegioesResult {
  const [status, setStatus] = useState<FetchStatus>('idle');
  const [data, setData] = useState<RegiaoMonitorada[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);
    try {
      const result = await fetchRegioes();
      setData(result);
      setStatus('success');
    } catch (err) {
      const apiErr = err as ApiError;
      setErrorMessage(apiErr?.message ?? 'Erro ao carregar regiões.');
      setStatus('error');
    }
  }, []);

  return { status, data, errorMessage, load };
}
