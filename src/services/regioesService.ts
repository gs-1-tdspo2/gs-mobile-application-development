import { api } from '@/services/api';
import { Regiao, RegiaoCreateRequest, RegiaoUpdateRequest } from '@/types/regiao';
import { RiscoAtual } from '@/types/risco';

export async function listarRegioes(): Promise<Regiao[]> {
  const response = await api.get<Regiao[]>('/api/regioes');
  return response.data;
}

export async function buscarRegiaoPorId(id: number | string): Promise<Regiao> {
  const response = await api.get<Regiao>(`/api/regioes/${id}`);
  return response.data;
}

export async function criarRegiao(payload: RegiaoCreateRequest): Promise<Regiao> {
  const response = await api.post<Regiao>('/api/regioes', payload);
  return response.data;
}

export async function atualizarRegiao(
  id: number | string,
  payload: RegiaoUpdateRequest,
): Promise<Regiao> {
  const response = await api.put<Regiao>(`/api/regioes/${id}`, payload);
  return response.data;
}

export async function excluirRegiao(id: number | string): Promise<void> {
  await api.delete(`/api/regioes/${id}`);
}

export async function buscarRiscoAtualDaRegiao(id: number | string): Promise<RiscoAtual> {
  const response = await api.get<RiscoAtual>(`/api/regioes/${id}/risco-atual`);
  return response.data;
}

export async function listarEstacoesPorRegiao(idRegiao: number | string): Promise<unknown[]> {
  const response = await api.get<unknown[]>(`/api/estacoes/regiao/${idRegiao}`);
  return response.data;
}
