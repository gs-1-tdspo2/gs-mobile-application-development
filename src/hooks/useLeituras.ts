import { useState, useCallback } from 'react';
import { fetchLeiturasParaRegiao } from '@services/leiturasService';
import type { LeituraIot, ApiError } from '@/types';
import type { FetchStatus } from '@hooks/useDashboardSummary';

interface UseLeiturasResult {
  status: FetchStatus;
  data: LeituraIot[];
  errorMessage: string | null;
  load: () => Promise<void>;
}

export function useLeituras(idRegiao: number | null): UseLeiturasResult {
  const [status, setStatus] = useState<FetchStatus>('idle');
  const [data, setData] = useState<LeituraIot[]>([]);
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
      const result = await fetchLeiturasParaRegiao(idRegiao);
      setData(result);
      setStatus('success');
    } catch (err) {
      const apiErr = err as ApiError;
      setErrorMessage(apiErr?.message ?? 'Erro ao carregar leituras de sensores.');
      setStatus('error');
    }
  }, [idRegiao]);

  return { status, data, errorMessage, load };
}
