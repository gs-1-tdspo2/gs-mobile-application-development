import { useState, useCallback, useRef } from 'react';
import { fetchDashboardSummary } from '@services/dashboardService';
import { normalizeDashboardSummary } from '@utils/dashboardNormalizer';
import type { DashboardSummary, ApiError } from '@/types';

export type FetchStatus = 'idle' | 'loading' | 'success' | 'error';

interface UseDashboardSummaryResult {
  status: FetchStatus;
  data: DashboardSummary | null;
  errorMessage: string | null;
  warnings: string[];
  isPartial: boolean;
  load: (opts?: { silent?: boolean }) => Promise<void>;
}

export function useDashboardSummary(): UseDashboardSummaryResult {
  const [status, setStatus] = useState<FetchStatus>('idle');
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isPartial, setIsPartial] = useState(false);
  const hasSucceededRef = useRef(false);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true;
    if (!silent || !hasSucceededRef.current) {
      setStatus('loading');
      setErrorMessage(null);
      setWarnings([]);
      setIsPartial(false);
    }
    try {
      const raw = await fetchDashboardSummary();
      const result = normalizeDashboardSummary(raw);

      if (result.data === null && result.warnings.length > 0) {
        // Malformed payload
        if (!silent || !hasSucceededRef.current) {
          setErrorMessage(result.warnings.join(' '));
          setStatus('error');
        }
      } else {
        hasSucceededRef.current = true;
        setData(result.data);
        setWarnings(result.warnings);
        setIsPartial(result.isPartial);
        setStatus('success');
      }
    } catch (err) {
      if (!silent || !hasSucceededRef.current) {
        const apiErr = err as ApiError;
        setErrorMessage(apiErr?.message ?? 'Erro ao carregar o painel.');
        setStatus('error');
      }
    }
  }, []);

  return { status, data, errorMessage, warnings, isPartial, load };
}
