import type { IndicadorRegional, Alerta, RegiaoMonitorada } from '@/types';
import type { NivelRisco, CategoriaRisco, StatusAlerta, TipoAlerta } from '@constants/enums';
import {
  NivelRiscoLabels,
  CategoriaRiscoLabels,
  StatusAlertaLabels,
  TipoAlertaLabels,
} from '@constants/enums';
import { RiskColors } from '@constants/colors';

// ─── Shared data shapes ───────────────────────────────────────────────────────

/** One slice of a pie/donut chart. Maps to PolarChart data item. */
export interface PieSlice {
  [key: string]: unknown;
  label: string;
  value: number;
  color: string;
  key: string;
}

/** One entry in a horizontal bar chart */
export interface BarEntry {
  key: string;
  label: string;
  value: number;
  maxValue: number;
  color: string;
  sublabel?: string;
}

/** One row in the regional ranking */
export interface RankingEntry {
  idIndicador: number;
  nomeRegiao: string;
  cidade: string;
  estado: string;
  tipoRisco: CategoriaRisco;
  scoreMedio: number;
  nivelRiscoMedio: NivelRisco;
  quantidadeAlertasAtivos: number;
}

/** Per-state coverage row */
export interface CoverageEntry {
  estado: string;
  qtRegioes: number;
  qtAlertasAtivos: number;
  maxScore: number;
  maxNivel: NivelRisco | null;
}

// ─── Alert colors (not in the risk palette) ───────────────────────────────────

const STATUS_COLORS: Record<StatusAlerta, string> = {
  ABERTO: '#D32F2F',
  EM_ANALISE: '#EF6C00',
  RESOLVIDO: '#2E7D32',
  CANCELADO: '#757575',
};

// ─── Indicadores transforms ───────────────────────────────────────────────────

/** Distribution of nivelRiscoMedio for donut chart, optionally filtered to a specific level. */
export function aggregateByNivelRisco(
  indicadores: IndicadorRegional[],
  nivelFilter: NivelRisco | null = null,
): PieSlice[] {
  const ORDER: NivelRisco[] = ['CRITICO', 'ALTO', 'MODERADO', 'BAIXO'];
  const source = nivelFilter ? indicadores.filter(i => i.nivelRiscoMedio === nivelFilter) : indicadores;
  const counts: Partial<Record<NivelRisco, number>> = {};
  for (const ind of source) {
    counts[ind.nivelRiscoMedio] = (counts[ind.nivelRiscoMedio] ?? 0) + 1;
  }
  return ORDER
    .filter(n => (counts[n] ?? 0) > 0)
    .map(n => ({
      key: n,
      label: NivelRiscoLabels[n],
      value: counts[n]!,
      color: RiskColors[n],
    }));
}

/** Distribution of tipoRisco for bar chart, optionally filtered by tipoRisco. */
export function aggregateByTipoRisco(
  indicadores: IndicadorRegional[],
  tipoFilter: CategoriaRisco | null = null,
): BarEntry[] {
  const filtered = tipoFilter
    ? indicadores.filter(i => i.tipoRisco === tipoFilter)
    : indicadores;

  const TIPOS: CategoriaRisco[] = ['ENCHENTE', 'TEMPESTADE', 'QUALIDADE_AR', 'DESLIZAMENTO'];
  const counts: Partial<Record<CategoriaRisco, number>> = {};
  for (const ind of filtered) {
    counts[ind.tipoRisco] = (counts[ind.tipoRisco] ?? 0) + 1;
  }
  const maxVal = Math.max(...TIPOS.map(t => counts[t] ?? 0), 1);

  return TIPOS.map(t => ({
    key: t,
    label: CategoriaRiscoLabels[t],
    value: counts[t] ?? 0,
    maxValue: maxVal,
    color: '#3F51B5',
  }));
}

/** Top N indicadores sorted by scoreMedio descending, excluding the national aggregate. */
export function buildRegionalRanking(
  indicadores: IndicadorRegional[],
  nivelFilter: NivelRisco | null = null,
  tipoFilter: CategoriaRisco | null = null,
  limit = 12,
): RankingEntry[] {
  let items = indicadores.filter(i => i.idRegiao !== null);
  if (nivelFilter) items = items.filter(i => i.nivelRiscoMedio === nivelFilter);
  if (tipoFilter) items = items.filter(i => i.tipoRisco === tipoFilter);
  return items
    .sort((a, b) => b.scoreMedio - a.scoreMedio)
    .slice(0, limit)
    .map(i => ({
      idIndicador: i.idIndicador,
      nomeRegiao: i.nomeRegiao ?? i.cidade,
      cidade: i.cidade,
      estado: i.estado,
      tipoRisco: i.tipoRisco,
      scoreMedio: i.scoreMedio,
      nivelRiscoMedio: i.nivelRiscoMedio,
      quantidadeAlertasAtivos: i.quantidadeAlertasAtivos,
    }));
}

// ─── Alertas transforms ───────────────────────────────────────────────────────

/** Distribution of statusAlerta for donut chart. */
export function aggregateAlertasByStatus(alertas: Alerta[]): PieSlice[] {
  const counts: Partial<Record<StatusAlerta, number>> = {};
  for (const a of alertas) {
    counts[a.statusAlerta] = (counts[a.statusAlerta] ?? 0) + 1;
  }
  return (Object.entries(counts) as [StatusAlerta, number][])
    .filter(([, v]) => v > 0)
    .map(([s, v]) => ({
      key: s,
      label: StatusAlertaLabels[s],
      value: v,
      color: STATUS_COLORS[s],
    }));
}

/** Distribution of statusAlerta as bar entries, optionally filtered to a specific status. */
export function aggregateAlertasByStatusBars(
  alertas: Alerta[],
  statusFilter: StatusAlerta | null = null,
): BarEntry[] {
  const source = statusFilter ? alertas.filter(a => a.statusAlerta === statusFilter) : alertas;
  const STATUSES: StatusAlerta[] = ['ABERTO', 'EM_ANALISE', 'RESOLVIDO', 'CANCELADO'];
  const counts: Partial<Record<StatusAlerta, number>> = {};
  for (const a of source) {
    counts[a.statusAlerta] = (counts[a.statusAlerta] ?? 0) + 1;
  }
  const active = STATUSES.filter(s => (counts[s] ?? 0) > 0);
  const maxVal = Math.max(...active.map(s => counts[s] ?? 0), 1);
  return active.map(s => ({
    key: s,
    label: StatusAlertaLabels[s],
    value: counts[s]!,
    maxValue: maxVal,
    color: STATUS_COLORS[s],
  }));
}

/** Distribution of tipoAlerta for bar chart, optionally filtered by statusAlerta. */
export function aggregateAlertasByTipo(
  alertas: Alerta[],
  statusFilter: StatusAlerta | null = null,
): BarEntry[] {
  const filtered = statusFilter
    ? alertas.filter(a => a.statusAlerta === statusFilter)
    : alertas;

  const TIPOS: TipoAlerta[] = ['ENCHENTE', 'TEMPESTADE', 'QUALIDADE_AR', 'DESLIZAMENTO', 'OPERACIONAL'];
  const counts: Partial<Record<TipoAlerta, number>> = {};
  for (const a of filtered) {
    counts[a.tipoAlerta] = (counts[a.tipoAlerta] ?? 0) + 1;
  }
  const activeTipos = TIPOS.filter(t => (counts[t] ?? 0) > 0);
  const maxVal = Math.max(...activeTipos.map(t => counts[t] ?? 0), 1);

  return activeTipos.map(t => ({
    key: t,
    label: TipoAlertaLabels[t],
    value: counts[t]!,
    maxValue: maxVal,
    color: '#3F51B5',
  }));
}

// ─── Regioes + Indicadores coverage ──────────────────────────────────────────

/** Per-state coverage summary. Excludes national aggregate (estado="BR"). */
export function buildCoverageByState(
  regioes: RegiaoMonitorada[],
  indicadores: IndicadorRegional[],
): CoverageEntry[] {
  const map = new Map<string, CoverageEntry>();

  for (const r of regioes) {
    if (r.estado === 'BR') continue;
    if (!map.has(r.estado)) {
      map.set(r.estado, { estado: r.estado, qtRegioes: 0, qtAlertasAtivos: 0, maxScore: 0, maxNivel: null });
    }
    map.get(r.estado)!.qtRegioes++;
  }

  for (const ind of indicadores) {
    if (!ind.idRegiao || ind.estado === 'BR') continue;
    const entry = map.get(ind.estado);
    if (!entry) continue;
    entry.qtAlertasAtivos += ind.quantidadeAlertasAtivos;
    if (ind.scoreMedio > entry.maxScore) {
      entry.maxScore = ind.scoreMedio;
      entry.maxNivel = ind.nivelRiscoMedio;
    }
  }

  return Array.from(map.values()).sort((a, b) => b.maxScore - a.maxScore);
}
