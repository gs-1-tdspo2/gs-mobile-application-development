import { useState, useCallback, useRef } from 'react';
import { fetchRegioes } from '@services/regioesService';
import type { RegiaoMonitorada, ApiError } from '@/types';
import type { FetchStatus } from '@hooks/useDashboardSummary';

interface UseRegioesResult {
  status: FetchStatus;
  data: RegiaoMonitorada[];
  errorMessage: string | null;
  load: (opts?: { silent?: boolean }) => Promise<void>;
}

export function useRegioes(): UseRegioesResult {
  const [status, setStatus] = useState<FetchStatus>('idle');
  const [data, setData] = useState<RegiaoMonitorada[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasSucceededRef = useRef(false);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true;
    if (!silent || !hasSucceededRef.current) {
      setStatus('loading');
      setErrorMessage(null);
    }
    try {
      const result = await fetchRegioes();
      hasSucceededRef.current = true;
      setData(result);
      setStatus('success');
      setErrorMessage(null);
    } catch (err) {
      if (!silent || !hasSucceededRef.current) {
        const apiErr = err as ApiError;
        setErrorMessage(apiErr?.message ?? 'Erro ao carregar regiões.');
        setStatus('error');
      }
    }
  }, []);

  return { status, data, errorMessage, load };
}
