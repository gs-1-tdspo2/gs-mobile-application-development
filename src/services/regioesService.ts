import { api } from './api';
import { API_ENDPOINTS } from '@constants/api';
import type { RegiaoMonitorada, CreateRegiaoRequest, UpdateRegiaoRequest, RiscoAtual } from '@/types';

export async function fetchRegioes(): Promise<RegiaoMonitorada[]> {
  const result = await api.get<RegiaoMonitorada[] | undefined>(API_ENDPOINTS.REGIOES);
  return result ?? [];
}

export async function fetchRegiao(id: number): Promise<RegiaoMonitorada> {
  return api.get<RegiaoMonitorada>(API_ENDPOINTS.REGIAO_BY_ID(id));
}

export async function createRegiao(data: CreateRegiaoRequest): Promise<RegiaoMonitorada> {
  return api.post<RegiaoMonitorada>(API_ENDPOINTS.REGIOES, data);
}

export async function updateRegiao(id: number, data: UpdateRegiaoRequest): Promise<RegiaoMonitorada> {
  return api.put<RegiaoMonitorada>(API_ENDPOINTS.REGIAO_BY_ID(id), data);
}

export async function inativarRegiao(id: number): Promise<void> {
  await api.delete<void>(API_ENDPOINTS.REGIAO_BY_ID(id));
}

export async function fetchRiscoAtual(id: number): Promise<RiscoAtual> {
  return api.get<RiscoAtual>(API_ENDPOINTS.REGIAO_RISCO_ATUAL(id));
}
