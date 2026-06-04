import { api, webGet } from '@/services/api';
import { Regiao, RegiaoCreateRequest, RegiaoReadModel, RegiaoUpdateRequest } from '@/types/regiao';
import { Estacao, EstacaoReadModel } from '@/types/estacao';
import { Leitura, LeituraReadModel } from '@/types/leitura';
import { RISCO_NIVEIS, RiscoAtual, RiscoAtualReadModel, RiscoNivel } from '@/types/risco';

export async function getRegioes(): Promise<RegiaoReadModel[]> {
  const data = await webGet<Regiao[]>('/api/regioes');
  return ensureArray<Regiao>(data).map(normalizeRegiao);
}

export async function listarRegioes(): Promise<RegiaoReadModel[]> {
  return getRegioes();
}

export async function getRegiaoById(id: number | string): Promise<RegiaoReadModel> {
  const data = await webGet<Regiao>(`/api/regioes/${id}`);
  return normalizeRegiao(data);
}

export async function buscarRegiaoPorId(id: number | string): Promise<RegiaoReadModel> {
  return getRegiaoById(id);
}

export async function createRegiao(payload: RegiaoCreateRequest): Promise<RegiaoReadModel> {
  const response = await api.post<Regiao>('/api/regioes', normalizePayload(payload));
  return normalizeRegiao(response.data);
}

export async function updateRegiao(
  id: number | string,
  payload: RegiaoUpdateRequest,
): Promise<RegiaoReadModel> {
  const response = await api.put<Regiao>(`/api/regioes/${id}`, normalizePayload(payload));
  return normalizeRegiao(response.data);
}

export async function deleteRegiao(id: number | string): Promise<void> {
  await api.delete(`/api/regioes/${id}`);
}

export async function getRiscoAtualByRegiao(
  idRegiao: number | string,
): Promise<RiscoAtualReadModel | null> {
  const data = await webGet<RiscoAtual | null>(`/api/regioes/${idRegiao}/risco-atual`);
  return data ? normalizeRiscoAtual(data) : null;
}

export async function getEstacoesByRegiao(idRegiao: number | string): Promise<EstacaoReadModel[]> {
  const data = await webGet<Estacao[] | unknown>(`/api/estacoes/regiao/${idRegiao}`);
  return ensureArray<Estacao>(data).map(normalizeEstacao);
}

export async function getLeiturasByRegiao(idRegiao: number | string): Promise<LeituraReadModel[]> {
  const data = await webGet<Leitura[] | unknown>(`/api/regioes/${idRegiao}/leituras`);
  return ensureArray<Leitura>(data).map(normalizeLeitura);
}

function normalizeRegiao(raw: Regiao): RegiaoReadModel {
  return {
    id: pickValue(raw, ['id', 'idRegiao', 'codigo']) ?? '',
    nome: pickString(raw, ['nome', 'name']) ?? 'Região sem nome',
    cidade: pickString(raw, ['cidade', 'city', 'municipio']),
    estado: pickString(raw, ['estado', 'state', 'uf']),
    tipoCliente: pickString(raw, [
      'tipoCliente',
      'clientType',
      'tipo_cliente',
      'tipoVisibilidade',
      'tipoArea',
    ]),
    descricao: pickString(raw, ['descricao', 'description']),
    ativo: pickBoolean(raw, ['ativo', 'active', 'stAtivo']),
    status: pickString(raw, ['status', 'situacao']),
    riscoNivel: pickRisk(raw, ['riscoAtual', 'currentRisk', 'nivelRisco', 'risco']),
    alertasAtivos: pickNumber(raw, ['alertasAtivos', 'activeAlertsCount', 'quantidadeAlertasAtivos']),
    raw,
  };
}

function normalizeRiscoAtual(raw: RiscoAtual): RiscoAtualReadModel {
  return {
    nivel: pickRisk(raw, ['nivel', 'nivelRisco', 'nivelConsolidado', 'riskLevel']),
    score: pickNumber(raw, ['score', 'pontuacao', 'scoreConsolidado']),
    descricao: pickString(raw, ['descricao', 'description']),
    atualizadoEm: pickString(raw, ['atualizadoEm', 'updatedAt', 'createdAt', 'calculadoEm']),
    raw,
  };
}

function normalizeEstacao(raw: Estacao): EstacaoReadModel {
  return {
    id: pickValue(raw, ['id', 'idEstacao']) ?? '',
    nome: pickString(raw, ['nome', 'name']) ?? 'Estação sem nome',
    codigo: pickString(raw, ['codigo', 'code', 'codigoEstacao']),
    status: pickString(raw, ['status', 'statusEstacao']),
    ativa: pickBoolean(raw, ['ativa', 'stAtivo']),
    tipo: pickString(raw, ['tipo', 'type', 'tipoEstacao']),
    ultimaLeituraEm: pickString(raw, ['ultimaLeitura', 'lastReadingAt', 'dtUltimaComunicacao']),
    raw,
  };
}

function normalizeLeitura(raw: Leitura): LeituraReadModel {
  return {
    id: pickValue(raw, ['id', 'idLeitura']) ?? '',
    temperatura: pickNumber(raw, ['temperatura']),
    umidade: pickNumber(raw, ['umidade']),
    indiceUv: pickNumber(raw, ['indiceUv', 'uvIndex']),
    chuva: pickNumber(raw, ['chuva', 'rainfall']),
    gasFumaca: pickNumber(raw, ['gasFumaca', 'gasSmoke']),
    distanciaAguaCm: pickNumber(raw, ['distanciaAguaCm']),
    nivelAguaPercentual: pickNumber(raw, ['nivelAguaPercentual']),
    inclinacaoGraus: pickNumber(raw, ['inclinacaoGraus']),
    vibracao: pickNumber(raw, ['vibracao']),
    pressaoHpa: pickNumber(raw, ['pressaoHpa']),
    pm25: pickNumber(raw, ['pm25']),
    pm10: pickNumber(raw, ['pm10']),
    dataHora: pickString(raw, ['dataHora', 'timestamp', 'createdAt', 'dtLeitura', 'dtRecebidoEm']),
    raw,
  };
}

function normalizePayload(payload: RegiaoCreateRequest | RegiaoUpdateRequest) {
  const normalizedEstado = payload.estado?.trim().toUpperCase();

  return {
    ...payload,
    nome: payload.nome?.trim(),
    cidade: payload.cidade?.trim(),
    estado: normalizedEstado,
    tipoCliente: payload.tipoCliente?.trim(),
    descricao: payload.descricao?.trim(),
  };
}

function ensureArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (value && typeof value === 'object') {
    const content = (value as { content?: unknown; data?: unknown; items?: unknown }).content;
    const data = (value as { data?: unknown }).data;
    const items = (value as { items?: unknown }).items;

    if (Array.isArray(content)) {
      return content as T[];
    }

    if (Array.isArray(data)) {
      return data as T[];
    }

    if (Array.isArray(items)) {
      return items as T[];
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
      const parsed = Number(value.replace(',', '.'));
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
      if (['ativo', 'active', 'true', 's', 'sim', 'ativa'].includes(normalized)) {
        return true;
      }
      if (['inativo', 'inactive', 'false', 'n', 'nao', 'não', 'inativa'].includes(normalized)) {
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
