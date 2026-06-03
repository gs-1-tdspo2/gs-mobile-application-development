import { api } from '@/services/api';
import { Regiao, RegiaoReadModel } from '@/types/regiao';
import { RISCO_NIVEIS, RiscoNivel } from '@/types/risco';

export async function getRegioes(): Promise<RegiaoReadModel[]> {
  const response = await api.get<Regiao[]>('/api/regioes');
  return ensureArray(response.data).map(normalizeRegiao);
}

export async function listarRegioes(): Promise<RegiaoReadModel[]> {
  return getRegioes();
}

export async function getRegiaoById(id: number | string): Promise<RegiaoReadModel> {
  const response = await api.get<Regiao>(`/api/regioes/${id}`);
  return normalizeRegiao(response.data);
}

export async function buscarRegiaoPorId(id: number | string): Promise<RegiaoReadModel> {
  return getRegiaoById(id);
}

function normalizeRegiao(raw: Regiao): RegiaoReadModel {
  return {
    id: pickValue(raw, ['id', 'codigo']) ?? '',
    nome: pickString(raw, ['nome', 'name']) ?? 'Região sem nome',
    cidade: pickString(raw, ['cidade', 'city', 'municipio']),
    estado: pickString(raw, ['estado', 'state', 'uf']),
    tipoCliente: pickString(raw, ['tipoCliente', 'clientType', 'tipo_cliente']),
    descricao: pickString(raw, ['descricao', 'description']),
    ativo: pickBoolean(raw, ['ativo', 'active']),
    status: pickString(raw, ['status', 'situacao']),
    riscoNivel: pickRisk(raw, ['riscoAtual', 'currentRisk', 'nivelRisco', 'risco']),
    alertasAtivos: pickNumber(raw, ['alertasAtivos', 'activeAlertsCount', 'quantidadeAlertasAtivos']),
    raw,
  };
}

function ensureArray(value: unknown): Regiao[] {
  if (Array.isArray(value)) {
    return value as Regiao[];
  }

  if (value && typeof value === 'object') {
    const content = (value as { content?: unknown; data?: unknown; items?: unknown }).content;
    const data = (value as { data?: unknown }).data;
    const items = (value as { items?: unknown }).items;

    if (Array.isArray(content)) {
      return content as Regiao[];
    }

    if (Array.isArray(data)) {
      return data as Regiao[];
    }

    if (Array.isArray(items)) {
      return items as Regiao[];
    }
  }

  return [];
}

function pickValue(source: Record<string, unknown>, keys: string[]): number | string | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'number' || typeof value === 'string') {
      return value;
    }
  }

  return undefined;
}

function pickString(source: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  return undefined;
}

function pickNumber(source: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
}

function pickBoolean(source: Record<string, unknown>, keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = value.toLowerCase();
      if (['ativo', 'active', 'true'].includes(normalized)) {
        return true;
      }
      if (['inativo', 'inactive', 'false'].includes(normalized)) {
        return false;
      }
    }
  }

  return undefined;
}

function pickRisk(source: Record<string, unknown>, keys: string[]): RiscoNivel | undefined {
  for (const key of keys) {
    const value = source[key];
    const risk = normalizeRisk(value);
    if (risk) {
      return risk;
    }
  }

  return undefined;
}

function normalizeRisk(value: unknown): RiscoNivel | undefined {
  if (typeof value === 'string') {
    const normalized = value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();
    return RISCO_NIVEIS.find((nivel) => nivel === normalized);
  }

  if (value && typeof value === 'object') {
    const riskObject = value as { nivel?: unknown; level?: unknown; risco?: unknown };
    return normalizeRisk(riskObject.nivel ?? riskObject.level ?? riskObject.risco);
  }

  return undefined;
}
