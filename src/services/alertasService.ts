import { api, webGet } from '@/services/api';
import { Alerta, AlertaReadModel } from '@/types/alerta';
import { RISCO_NIVEIS, RiscoNivel } from '@/types/risco';

export async function getAlertas(): Promise<AlertaReadModel[]> {
  const data = await webGet<Alerta[] | unknown>('/api/alertas');
  const alertas = ensureArray<Alerta>(data).map(normalizeAlerta);

  if (__DEV__) {
    console.log('[AlertasService] normalized alertas', alertas);
  }

  return alertas;
}

export async function listarAlertas(): Promise<AlertaReadModel[]> {
  return getAlertas();
}

export async function resolverAlerta(id: number | string): Promise<AlertaReadModel | null> {
  const response = await api.put<Alerta | '' | null>(`/api/alertas/${id}/resolver`);
  return response.data && typeof response.data === 'object' ? normalizeAlerta(response.data) : null;
}

function normalizeAlerta(raw: Alerta): AlertaReadModel {
  const status = pickString(raw, ['status', 'statusAlerta']);
  const resolvido = pickBoolean(raw, ['resolvido', 'resolved']) ?? normalizeStatus(status) === 'RESOLVIDO';
  const regiao = raw.regiao;

  return {
    id: pickValue(raw, ['id', 'idAlerta']) ?? '',
    titulo: pickString(raw, ['titulo', 'title', 'tipoAlerta']) ?? 'Alerta sem título',
    descricao: pickString(raw, ['descricao', 'description', 'mensagem']),
    recomendacao: pickString(raw, ['recomendacao']),
    tipoAlerta: pickString(raw, ['tipoAlerta']),
    nivel: pickRisk(raw, ['nivel', 'nivelRisco', 'riskLevel', 'severidade', 'severity']),
    status,
    resolvido,
    regiaoId: pickValue(raw, ['regiaoId', 'idRegiao']) ?? regiao?.id,
    regiaoNome: pickString(raw, ['regiaoNome']) ?? regiao?.nome ?? regiao?.name,
    criadoEm: pickString(raw, ['criadoEm', 'dataCriacao', 'createdAt', 'dtAlerta', 'dtCriadoEm']),
    resolvidoEm: pickString(raw, ['resolvidoEm', 'dataResolucao', 'resolvedAt', 'dtResolvidoEm']),
    raw,
  };
}

function ensureArray<T>(value: unknown): T[] {
  const parsed = parseJsonIfNeeded(value);

  if (Array.isArray(parsed)) {
    return parsed as T[];
  }

  if (parsed && typeof parsed === 'object') {
    const content = (parsed as { content?: unknown; data?: unknown; items?: unknown }).content;
    const data = (parsed as { data?: unknown }).data;
    const items = (parsed as { items?: unknown }).items;

    if (Array.isArray(content)) return content as T[];
    if (Array.isArray(data))    return data as T[];
    if (Array.isArray(items))   return items as T[];
  }

  return [];
}

function parseJsonIfNeeded(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return value; }
}

function pickValue(source: Record<string, unknown>, keys: string[]): number | string | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'number' || typeof value === 'string') return value;
  }
  return undefined;
}

function pickString(source: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return undefined;
}

function pickBoolean(source: Record<string, unknown>, keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const n = normalizeStatus(value);
      if (['ATIVO', 'ACTIVE', 'TRUE', 'S', 'SIM', 'RESOLVIDO'].includes(n)) return true;
      if (['INATIVO', 'INACTIVE', 'FALSE', 'N', 'NAO'].includes(n)) return false;
    }
  }
  return undefined;
}

function pickRisk(source: Record<string, unknown>, keys: string[]): RiscoNivel | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string') {
      const normalized = normalizeStatus(value);
      const risk = RISCO_NIVEIS.find((nivel) => nivel === normalized);
      if (risk) return risk;
    }
  }
  return undefined;
}

function normalizeStatus(value?: string): string {
  return (
    value?.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase() ?? ''
  );
}
