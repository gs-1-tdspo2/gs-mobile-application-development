import { api } from './api';
import { API_ENDPOINTS } from '@constants/api';
import type { EstacaoIot, CreateEstacaoRequest } from '@/types';

export async function fetchEstacoesByRegiao(idRegiao: number): Promise<EstacaoIot[]> {
  try {
    const result = await api.get<EstacaoIot[] | undefined>(
      API_ENDPOINTS.ESTACOES_BY_REGIAO(idRegiao),
    );
    return result ?? [];
  } catch (err) {
    // 404 = region exists but has no active stations — treat as empty list, not an error
    if ((err as { status?: number })?.status === 404) return [];
    throw err;
  }
}

export async function createEstacao(data: CreateEstacaoRequest): Promise<EstacaoIot> {
  return api.post<EstacaoIot>(API_ENDPOINTS.ESTACOES, data);
}
