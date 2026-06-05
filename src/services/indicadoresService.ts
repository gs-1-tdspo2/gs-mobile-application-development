import { webGet } from '@/services/api';
import { IndicadorRegional } from '@/types/indicador';

export async function listarIndicadoresRegionais(): Promise<IndicadorRegional[]> {
  const data = await webGet<unknown>('/api/indicadores-regionais');
  return ensureArray<IndicadorRegional>(data);
}

function ensureArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    for (const key of ['content', 'data', 'items']) {
      if (Array.isArray(obj[key])) return obj[key] as T[];
    }
  }
  return [];
}
