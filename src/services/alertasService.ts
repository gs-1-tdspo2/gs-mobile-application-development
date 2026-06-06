import { api } from './api';
import { API_ENDPOINTS } from '@constants/api';
import type { Alerta } from '@/types';

export async function fetchAlertas(): Promise<Alerta[]> {
  const result = await api.get<Alerta[] | undefined>(API_ENDPOINTS.ALERTAS);
  return result ?? [];
}

export async function resolverAlerta(id: number): Promise<Alerta> {
  return api.put<Alerta>(API_ENDPOINTS.ALERTA_RESOLVER(id));
}
