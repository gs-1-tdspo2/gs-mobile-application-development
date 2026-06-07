import { useState, useCallback, useRef, useEffect } from 'react';
import { fetchEstacoesByRegiao } from '@services/estacoesService';
import type { EstacaoIot, ApiError } from '@/types';
import type { FetchStatus } from '@hooks/useDashboardSummary';

interface UseEstacoesResult {
  status: FetchStatus;
  data: EstacaoIot[];
  errorMessage: string | null;
  load: (opts?: { silent?: boolean }) => Promise<void>;
}

export function useEstacoes(idRegiao: number | null): UseEstacoesResult {
  const [status, setStatus] = useState<FetchStatus>('idle');
  const [data, setData] = useState<EstacaoIot[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasSucceededRef = useRef(false);

  // Reset success flag when the target region changes so the next load shows a spinner
  useEffect(() => {
    hasSucceededRef.current = false;
  }, [idRegiao]);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (idRegiao === null) {
      setData([]);
      setStatus('idle');
      setErrorMessage(null);
      return;
    }
    const silent = opts?.silent === true;
    if (!silent || !hasSucceededRef.current) {
      setStatus('loading');
      setErrorMessage(null);
    }
    try {
      const result = await fetchEstacoesByRegiao(idRegiao);
      hasSucceededRef.current = true;
      setData(result);
      setStatus('success');
      setErrorMessage(null);
    } catch (err) {
      if (!silent || !hasSucceededRef.current) {
        const apiErr = err as ApiError;
        setErrorMessage(apiErr?.message ?? 'Erro ao carregar estações.');
        setStatus('error');
      }
    }
  }, [idRegiao]);

  return { status, data, errorMessage, load };
}
