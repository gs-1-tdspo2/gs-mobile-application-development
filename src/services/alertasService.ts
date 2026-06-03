import { api } from '@/services/api';
import { Alerta } from '@/types/alerta';

export async function listarAlertas(): Promise<Alerta[]> {
  const response = await api.get<Alerta[]>('/api/alertas');
  return response.data;
}

export async function resolverAlerta(id: number | string): Promise<Alerta> {
  const response = await api.put<Alerta>(`/api/alertas/${id}/resolver`);
  return response.data;
}
