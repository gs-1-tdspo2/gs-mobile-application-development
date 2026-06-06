import { api } from './api';
import { API_ENDPOINTS } from '@constants/api';
import type { IndicadorRegional } from '@/types';

export async function fetchIndicadores(): Promise<IndicadorRegional[]> {
  const result = await api.get<IndicadorRegional[] | undefined>(API_ENDPOINTS.INDICADORES_REGIONAIS);
  return result ?? [];
}
