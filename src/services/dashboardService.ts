import { webGet } from '@/services/api';
import { DashboardSummary, DashboardSummaryRaw } from '@/types/dashboard';
import { RISCO_NIVEIS, RiscoNivel } from '@/types/risco';

export async function getDashboardSummary(): Promise<DashboardSummary> {
  try {
    const data = await webGet<DashboardSummaryRaw | unknown>('/api/dashboard/summary');
    const raw = normalizeRawDashboardResponse(data);
    const normalized = normalizeDashboardSummary(raw);

    if (__DEV__) {
      console.log('[DashboardService] raw data', data);
      console.log('[DashboardService] normalized summary', normalized);
    }

    return normalized;
  } catch (error) {
    if (__DEV__) {
      console.error('[DashboardService] getDashboardSummary error', error);
    }

    throw error;
  }
}

export async function buscarResumoDashboard(): Promise<DashboardSummary> {
  return getDashboardSummary();
}

export async function verificarSaudeApi(): Promise<unknown> {
  return webGet('/api/health');
}

function normalizeDashboardSummary(raw: DashboardSummaryRaw): DashboardSummary {
  return {
    totalClientesAtivos: pickNumber(raw, ['totalClientesAtivos', 'clientesAtivos']),
    totalRegioes: pickNumber(raw, [
      'totalRegioes',
      'totalRegioesAtivas',
      'totalRegions',
      'regioesMonitoradas',
    ]),
    totalEstacoesAtivas: pickNumber(raw, ['totalEstacoesAtivas', 'estacoesAtivas']),
    alertasAtivos: pickNumber(raw, ['alertasAtivos', 'totalAlertasAtivos', 'activeAlerts']),
    alertasCriticos: pickNumber(raw, [
      'alertasCriticos',
      'totalAlertasCriticos',
      'criticalAlerts',
      'regioesEmRiscoCritico',
    ]),
    alertasAltos: pickNumber(raw, ['totalAlertasAltos', 'alertasAltos']),
    alertasResolvidos: pickNumber(raw, ['totalAlertasResolvidos', 'alertasResolvidos']),
    leiturasValidas: pickNumber(raw, ['totalLeiturasValidas', 'leiturasValidas']),
    observacoesClimaticas: pickNumber(raw, [
      'totalObservacoesClimaticas',
      'observacoesClimaticas',
    ]),
    avaliacoesRisco: pickNumber(raw, ['totalAvaliacoesRisco', 'avaliacoesRisco']),
    regioesComRiscoAltoOuCritico: pickNumber(raw, [
      'regioesComRiscoAltoOuCritico',
      'regioesEmRisco',
      'regioesEmRiscoCritico',
    ]),
    maiorRiscoAtual: pickRisk(raw, [
      'maiorRiscoAtual',
      'maiorNivelRiscoAtual',
      'highestCurrentRisk',
      'maiorRisco',
    ]),
    atualizadoEm: pickString(raw, ['atualizadoEm', 'updatedAt', 'ultimaAtualizacao']),
    raw,
  };
}

function normalizeRawDashboardResponse(value: unknown): DashboardSummaryRaw {
  const parsed = parseJsonIfNeeded(value);

  if (isRecord(parsed)) {
    const wrapped = parsed.data ?? parsed.content ?? parsed.item;
    if (isRecord(wrapped)) {
      return wrapped as DashboardSummaryRaw;
    }

    return parsed as DashboardSummaryRaw;
  }

  return {};
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

function parseJsonIfNeeded(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
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

  if (value && typeof value === 'object' && 'nivel' in value) {
    return normalizeRisk((value as { nivel?: unknown }).nivel);
  }

  return undefined;
}
