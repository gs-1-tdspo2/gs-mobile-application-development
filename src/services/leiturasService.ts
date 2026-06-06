import { api } from './api';
import { API_ENDPOINTS } from '@constants/api';
import type { LeituraIot } from '@/types';

export async function fetchLeiturasParaRegiao(idRegiao: number): Promise<LeituraIot[]> {
  const result = await api.get<LeituraIot[] | undefined>(
    API_ENDPOINTS.REGIAO_LEITURAS(idRegiao),
  );
  return result ?? [];
}
