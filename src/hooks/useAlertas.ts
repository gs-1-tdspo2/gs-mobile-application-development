import { useState, useCallback, useRef } from 'react';
import { fetchAlertas } from '@services/alertasService';
import type { Alerta, ApiError } from '@/types';
import type { FetchStatus } from '@hooks/useDashboardSummary';

interface UseAlertasResult {
  status: FetchStatus;
  data: Alerta[];
  errorMessage: string | null;
  load: (opts?: { silent?: boolean }) => Promise<void>;
}

export function useAlertas(): UseAlertasResult {
  const [status, setStatus] = useState<FetchStatus>('idle');
  const [data, setData] = useState<Alerta[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasSucceededRef = useRef(false);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true;
    if (!silent || !hasSucceededRef.current) {
      setStatus('loading');
      setErrorMessage(null);
    }
    try {
      const result = await fetchAlertas();
      hasSucceededRef.current = true;
      setData(result);
      setStatus('success');
      setErrorMessage(null);
    } catch (err) {
      if (!silent || !hasSucceededRef.current) {
        const apiErr = err as ApiError;
        setErrorMessage(apiErr?.message ?? 'Erro ao carregar alertas.');
        setStatus('error');
      }
    }
  }, []);

  return { status, data, errorMessage, load };
}
