import { useState, useCallback } from 'react';
import { fetchEstacoesByRegiao } from '@services/estacoesService';
import type { EstacaoIot, ApiError } from '@/types';
import type { FetchStatus } from '@hooks/useDashboardSummary';

interface UseEstacoesResult {
  status: FetchStatus;
  data: EstacaoIot[];
  errorMessage: string | null;
  load: () => Promise<void>;
}

export function useEstacoes(idRegiao: number | null): UseEstacoesResult {
  const [status, setStatus] = useState<FetchStatus>('idle');
  const [data, setData] = useState<EstacaoIot[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (idRegiao === null) {
      setData([]);
      setStatus('idle');
      setErrorMessage(null);
      return;
    }
    setStatus('loading');
    setErrorMessage(null);
    try {
      const result = await fetchEstacoesByRegiao(idRegiao);
      setData(result);
      setStatus('success');
    } catch (err) {
      const apiErr = err as ApiError;
      setErrorMessage(apiErr?.message ?? 'Erro ao carregar estações.');
      setStatus('error');
    }
  }, [idRegiao]);

  return { status, data, errorMessage, load };
}
