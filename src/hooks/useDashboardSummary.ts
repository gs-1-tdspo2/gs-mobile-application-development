import { useState, useCallback } from 'react';
import { fetchDashboardSummary } from '@services/dashboardService';
import { normalizeDashboardSummary } from '@utils/dashboardNormalizer';
import type { DashboardSummary, ApiError } from '@/types';

export type FetchStatus = 'idle' | 'loading' | 'success' | 'error';

interface UseDashboardSummaryResult {
  status: FetchStatus;
  data: DashboardSummary | null;
  errorMessage: string | null;
  // Populated when the API response is missing or has unexpected fields.
  // isPartial=true means data is present but some fields fell back to 0.
  warnings: string[];
  isPartial: boolean;
  load: () => Promise<void>;
}

export function useDashboardSummary(): UseDashboardSummaryResult {
  const [status, setStatus] = useState<FetchStatus>('idle');
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isPartial, setIsPartial] = useState(false);

  const load = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);
    setWarnings([]);
    setIsPartial(false);
    try {
      const raw = await fetchDashboardSummary();
      const result = normalizeDashboardSummary(raw);

      if (result.data === null && result.warnings.length > 0) {
        // Malformed payload (not a clean 204 empty body)
        setErrorMessage(result.warnings.join(' '));
        setStatus('error');
      } else {
        setData(result.data);
        setWarnings(result.warnings);
        setIsPartial(result.isPartial);
        setStatus('success');
      }
    } catch (err) {
      const apiErr = err as ApiError;
      setErrorMessage(apiErr?.message ?? 'Erro ao carregar o painel.');
      setStatus('error');
    }
  }, []);

  return { status, data, errorMessage, warnings, isPartial, load };
}
