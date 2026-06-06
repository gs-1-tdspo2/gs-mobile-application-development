import { useState, useCallback } from 'react';
import { fetchClientes } from '@services/clientesService';
import type { Cliente, ApiError } from '@/types';
import type { FetchStatus } from '@hooks/useDashboardSummary';

interface UseClientesResult {
  status: FetchStatus;
  data: Cliente[];
  errorMessage: string | null;
  load: () => Promise<void>;
}

export function useClientes(): UseClientesResult {
  const [status, setStatus] = useState<FetchStatus>('idle');
  const [data, setData] = useState<Cliente[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);
    try {
      const result = await fetchClientes();
      setData(result);
      setStatus('success');
    } catch (err) {
      const apiErr = err as ApiError;
      setErrorMessage(apiErr?.message ?? 'Erro ao carregar clientes.');
      setStatus('error');
    }
  }, []);

  return { status, data, errorMessage, load };
}
