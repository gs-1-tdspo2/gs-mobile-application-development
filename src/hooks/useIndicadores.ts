import { useState, useCallback, useRef } from 'react';
import { fetchIndicadores } from '@services/indicadoresService';
import type { IndicadorRegional, ApiError } from '@/types';
import type { FetchStatus } from '@hooks/useDashboardSummary';

interface UseIndicadoresResult {
  status: FetchStatus;
  data: IndicadorRegional[];
  errorMessage: string | null;
  load: (opts?: { silent?: boolean }) => Promise<void>;
}

export function useIndicadores(): UseIndicadoresResult {
  const [status, setStatus] = useState<FetchStatus>('idle');
  const [data, setData] = useState<IndicadorRegional[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasSucceededRef = useRef(false);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true;
    if (!silent || !hasSucceededRef.current) {
      setStatus('loading');
      setErrorMessage(null);
    }
    try {
      const result = await fetchIndicadores();
      hasSucceededRef.current = true;
      setData(result);
      setStatus('success');
      setErrorMessage(null);
    } catch (err) {
      if (!silent || !hasSucceededRef.current) {
        const apiErr = err as ApiError;
        setErrorMessage(apiErr?.message ?? 'Erro ao carregar indicadores.');
        setStatus('error');
      }
    }
  }, []);

  return { status, data, errorMessage, load };
}
