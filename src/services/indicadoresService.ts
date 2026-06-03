import { api } from '@/services/api';
import { IndicadorRegional } from '@/types/indicador';

export async function listarIndicadoresRegionais(): Promise<IndicadorRegional[]> {
  const response = await api.get<IndicadorRegional[]>('/api/indicadores-regionais');
  return response.data;
}
