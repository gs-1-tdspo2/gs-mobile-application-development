import { api } from './api';
import { API_ENDPOINTS } from '@constants/api';
import type { ObservacaoClimatica } from '@/types';

export async function fetchObservacaoClimatica(
  idRegiao: number,
): Promise<ObservacaoClimatica | null> {
  try {
    const result = await api.get<ObservacaoClimatica | null | undefined>(
      API_ENDPOINTS.REGIAO_OBS_CLIMATICA_ULTIMA(idRegiao),
    );
    return result ?? null;
  } catch (err) {
    // 404 means no observation exists for this region — treat as empty, not an error
    const e = err as { status?: number; statusCode?: number; response?: { status?: number } };
    const status = e?.status ?? e?.statusCode ?? e?.response?.status;
    if (status === 404) return null;
    throw err;
  }
}
