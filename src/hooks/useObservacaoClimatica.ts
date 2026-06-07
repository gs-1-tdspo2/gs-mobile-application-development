import { useState, useCallback, useRef, useEffect } from 'react';
import { fetchObservacaoClimatica } from '@services/observacoesClimaticasService';
import type { ObservacaoClimatica, ApiError } from '@/types';
import type { FetchStatus } from '@hooks/useDashboardSummary';

interface UseObservacaoClimaticaResult {
  status: FetchStatus;
  data: ObservacaoClimatica | null;
  errorMessage: string | null;
  load: (opts?: { silent?: boolean }) => Promise<void>;
}

export function useObservacaoClimatica(
  idRegiao: number | null,
): UseObservacaoClimaticaResult {
  const [status, setStatus] = useState<FetchStatus>('idle');
  const [data, setData] = useState<ObservacaoClimatica | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasSucceededRef = useRef(false);

  useEffect(() => {
    hasSucceededRef.current = false;
  }, [idRegiao]);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (idRegiao === null) {
      setData(null);
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
      const result = await fetchObservacaoClimatica(idRegiao);
      hasSucceededRef.current = true;
      setData(result);
      setStatus('success');
      setErrorMessage(null);
    } catch (err) {
      if (!silent || !hasSucceededRef.current) {
        const apiErr = err as ApiError;
        setErrorMessage(apiErr?.message ?? 'Erro ao carregar observação climática.');
        setStatus('error');
      }
    }
  }, [idRegiao]);

  return { status, data, errorMessage, load };
}
