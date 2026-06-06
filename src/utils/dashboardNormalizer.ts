import type { DashboardSummary } from '@/types';
import type { NivelRisco } from '@constants/enums';

const VALID_NIVEIS: ReadonlyArray<NivelRisco> = [
  'BAIXO',
  'MODERADO',
  'ALTO',
  'CRITICO',
];

const NUMERIC_FIELDS = [
  'totalClientesAtivos',
  'totalRegioesAtivas',
  'totalEstacoesAtivas',
  'totalAlertasAtivos',
  'totalAlertasCriticos',
  'totalAlertasAltos',
  'totalAlertasResolvidos',
  'totalLeiturasValidas',
  'totalObservacoesClimaticas',
  'totalAvaliacoesRisco',
  'regioesComRiscoAltoOuCritico',
] as const;

export interface DashboardNormalizeResult {
  data: DashboardSummary | null;
  warnings: string[];
  isPartial: boolean;
}

/**
 * Validates and normalizes a raw /api/dashboard/summary response.
 *
 * - Missing numeric fields: recorded as warnings, set to 0 as display fallback.
 *   The warning banner in the UI makes these visible — they are not silent zeros.
 * - maiorNivelRiscoAtual: unknown values coerced to null with a warning.
 * - atualizadoEm: Java sends nanosecond timestamps without 'Z'.
 *   Truncated to ms precision and 'Z' appended to force UTC parsing.
 * - Null/undefined body (HTTP 204): returns { data: null, warnings: [], isPartial: false }.
 * - Malformed payload (not an object): returns { data: null, warnings: [...], isPartial: false }.
 */
export function normalizeDashboardSummary(raw: unknown): DashboardNormalizeResult {
  if (raw === null || raw === undefined) {
    return { data: null, warnings: [], isPartial: false };
  }

  if (typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      data: null,
      warnings: ['Resposta do servidor está em formato inesperado.'],
      isPartial: false,
    };
  }

  const obj = raw as Record<string, unknown>;
  const warnings: string[] = [];
  let isPartial = false;
  const out: Record<string, unknown> = {};

  for (const field of NUMERIC_FIELDS) {
    const val = obj[field];
    if (val === undefined || val === null) {
      warnings.push(`Campo ausente do painel: ${field}`);
      isPartial = true;
      out[field] = 0;
      if (__DEV__) {
        console.warn('[Amanajé] DashboardSummary campo ausente:', field);
      }
    } else if (typeof val !== 'number') {
      warnings.push(`Campo com tipo inesperado: ${field} (recebido: ${typeof val})`);
      isPartial = true;
      out[field] = 0;
      if (__DEV__) {
        console.warn('[Amanajé] DashboardSummary tipo incorreto:', field, typeof val);
      }
    } else {
      out[field] = val;
    }
  }

  // maiorNivelRiscoAtual: null is valid (no risk assessed yet)
  const nivel = obj['maiorNivelRiscoAtual'];
  if (nivel === null || nivel === undefined) {
    out['maiorNivelRiscoAtual'] = null;
  } else if (
    typeof nivel === 'string' &&
    (VALID_NIVEIS as readonly string[]).includes(nivel)
  ) {
    out['maiorNivelRiscoAtual'] = nivel as NivelRisco;
  } else {
    warnings.push(
      `Valor não reconhecido em maiorNivelRiscoAtual: "${nivel}". Exibindo estado neutro.`,
    );
    out['maiorNivelRiscoAtual'] = null;
    if (__DEV__) {
      console.warn('[Amanajé] maiorNivelRiscoAtual desconhecido:', nivel);
    }
  }

  // atualizadoEm: Java sends "2026-06-06T13:04:44.433155145" (nanoseconds, no 'Z').
  // Without 'Z', JS Date treats it as local time — wrong for a UTC backend.
  // Fix: truncate to milliseconds and append 'Z' to force UTC interpretation.
  const dtRaw = obj['atualizadoEm'];
  if (!dtRaw) {
    out['atualizadoEm'] = '';
    if (dtRaw === null) {
      warnings.push('Campo atualizadoEm ausente.');
      isPartial = true;
    }
  } else if (typeof dtRaw === 'string') {
    out['atualizadoEm'] = normalizeTimestamp(dtRaw);
  } else {
    out['atualizadoEm'] = String(dtRaw);
    warnings.push('Campo atualizadoEm em formato inesperado.');
  }

  return { data: out as unknown as DashboardSummary, warnings, isPartial };
}

/**
 * Normalizes a Java TIMESTAMP string to a valid UTC ISO 8601 string for JS Date.
 *
 * Input:  "2026-06-06T13:04:44.433155145"   (nanoseconds, no timezone)
 * Output: "2026-06-06T13:04:44.433Z"         (milliseconds, UTC)
 *
 * If the string already has a timezone offset or 'Z', it is preserved.
 * If format is unrecognized, the original string is returned unchanged.
 */
export function normalizeTimestamp(raw: string): string {
  const match = raw.match(
    /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/,
  );
  if (!match) return raw;
  const base = match[1];
  const frac = match[2] ? match[2].slice(0, 4) : ''; // keep up to 3 decimal digits (ms)
  const tz = match[3] ?? 'Z'; // assume UTC if no timezone marker present
  return `${base}${frac}${tz}`;
}
