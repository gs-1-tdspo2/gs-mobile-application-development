import { useState, useCallback } from 'react';
import { fetchIndicadores } from '@services/indicadoresService';
import type { IndicadorRegional, ApiError } from '@/types';
import type { FetchStatus } from '@hooks/useDashboardSummary';

interface UseIndicadoresResult {
  status: FetchStatus;
  data: IndicadorRegional[];
  errorMessage: string | null;
  load: () => Promise<void>;
}

export function useIndicadores(): UseIndicadoresResult {
  const [status, setStatus] = useState<FetchStatus>('idle');
  const [data, setData] = useState<IndicadorRegional[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);
    try {
      const result = await fetchIndicadores();
      setData(result);
      setStatus('success');
    } catch (err) {
      const apiErr = err as ApiError;
      setErrorMessage(apiErr?.message ?? 'Erro ao carregar indicadores.');
      setStatus('error');
    }
  }, []);

  return { status, data, errorMessage, load };
}
