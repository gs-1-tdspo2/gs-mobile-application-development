import { webGet } from '@/services/api';
import { Cliente } from '@/types/cliente';

export async function listarClientes(): Promise<Cliente[]> {
  const data = await webGet<unknown>('/api/clientes');
  return Array.isArray(data) ? (data as Cliente[]) : [];
}
