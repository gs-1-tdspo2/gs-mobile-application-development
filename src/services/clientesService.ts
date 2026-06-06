import { api } from './api';
import { API_ENDPOINTS } from '@constants/api';
import type { Cliente } from '@/types';

export async function fetchClientes(): Promise<Cliente[]> {
  const result = await api.get<Cliente[] | undefined>(API_ENDPOINTS.CLIENTES);
  return result ?? [];
}
