import { useState, useCallback } from 'react';
import { fetchAlertas } from '@services/alertasService';
import type { Alerta, ApiError } from '@/types';
import type { FetchStatus } from '@hooks/useDashboardSummary';

interface UseAlertasResult {
  status: FetchStatus;
  data: Alerta[];
  errorMessage: string | null;
  load: () => Promise<void>;
}

export function useAlertas(): UseAlertasResult {
  const [status, setStatus] = useState<FetchStatus>('idle');
  const [data, setData] = useState<Alerta[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);
    try {
      const result = await fetchAlertas();
      setData(result);
      setStatus('success');
    } catch (err) {
      const apiErr = err as ApiError;
      setErrorMessage(apiErr?.message ?? 'Erro ao carregar alertas.');
      setStatus('error');
    }
  }, []);

  return { status, data, errorMessage, load };
}
