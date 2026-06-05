import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppShell } from '@/components/AppShell';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { colors } from '@/constants/colors';
import { listarIndicadoresRegionais } from '@/services/indicadoresService';
import { screenStyles } from '@/styles/global';
import { IndicadorRegional } from '@/types/indicador';
import { getApiErrorMessage } from '@/utils/apiError';
import { useResponsiveLayout } from '@/utils/responsive';

/* ── Type predicate ──────────────────────────────────── */

// Narrows to records that have a real nomeRegiao (excludes aggregate null records).
function hasNomeRegiao(i: IndicadorRegional): i is IndicadorRegional & { nomeRegiao: string } {
  return typeof i.nomeRegiao === 'string' && i.nomeRegiao.trim().length > 0;
}

/* ── Formatters ──────────────────────────────────────── */

function fmtHHMM(ts?: string): string | null {
  if (!ts) return null;
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return null;
    return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
  } catch { return null; }
}

function fmtDateCompact(ts?: string): string {
  if (!ts) return '—';
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '—';
    const dd = d.getDate().toString().padStart(2, '0');
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    const hh = d.getHours().toString().padStart(2, '0');
    const mi = d.getMinutes().toString().padStart(2, '0');
    return `${dd}/${mm} ${hh}:${mi}`;
  } catch { return '—'; }
}

const TIPO_LABEL: Record<string, string> = {
  ENCHENTE:    'Enchente',
  TEMPESTADE:  'Tempestade',
  DESLIZAMENTO:'Deslizamento',
  QUALIDADE_AR:'Qualidade do Ar',
};
function tipoLabel(tipo?: string): string {
  return tipo ? (TIPO_LABEL[tipo] ?? tipo) : '—';
}

const TIPO_COLORS: Record<string, string> = {
  ENCHENTE:    '#3F51B5',
  TEMPESTADE:  '#5A6FD6',
  DESLIZAMENTO:'#303F9F',
  QUALIDADE_AR:'#3347A8',
};

function nivelColor(nivel?: string): string {
  if (nivel === 'CRITICO')  return '#D32F2F';
  if (nivel === 'ALTO')     return '#EF6C00';
  if (nivel === 'MODERADO') return '#F9A825';
  if (nivel === 'BAIXO')    return '#2E7D32';
  return '#3F51B5';
}

function nivelBg(nivel?: string): string {
  if (nivel === 'CRITICO')  return '#FFDAD6';
  if (nivel === 'ALTO')     return '#FFE8D6';
  if (nivel === 'MODERADO') return '#FFF3CD';
  if (nivel === 'BAIXO')    return '#DCFCE7';
  return '#EEF2FF';
}

/* ── Derived types ───────────────────────────────────── */

type RegioSummary = { nome: string; maxScore: number; nivel: string };
type TipoCount    = { label: string; count: number; color: string };
type NivelCount   = { nivel: string; count: number };
type RegioAlerts  = { nome: string; total: number };

const NIVEL_ORDER = ['CRITICO', 'ALTO', 'MODERADO', 'BAIXO'] as const;
const MAX_BAR_H   = 90;

/* ── Screen ──────────────────────────────────────────── */

export default function IndicadoresScreen() {
  const [indicadores, setIndicadores] = useState<IndicadorRegional[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const { isDesktop }                 = useResponsiveLayout();

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setIndicadores(await listarIndicadoresRegionais());
    } catch (e) {
      setIndicadores([]);
      setError(getApiErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Regional records only — excludes aggregate row (nomeRegiao: null)
  const regionais = useMemo(
    () => indicadores.filter(hasNomeRegiao),
    [indicadores],
  );

  // Analytics summary
  const summary = useMemo(() => {
    const regiaoSet = new Set(
      indicadores
        .map((i) => i.nomeRegiao)
        .filter((v): v is string => typeof v === 'string' && v.trim().length > 0),
    );
    const tipoSet = new Set(
      indicadores
        .map((i) => i.tipoRisco)
        .filter((v): v is string => typeof v === 'string' && v.trim().length > 0),
    );
    const scores = indicadores
      .map((i) => i.scoreMedio)
      .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    const scoreMedio = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : undefined;
    const lastCalc = indicadores
      .map((i) => i.dtCalculo)
      .filter((v): v is string => typeof v === 'string')
      .sort()
      .at(-1);
    return { totalRegioes: regiaoSet.size, tiposRisco: tipoSet.size, scoreMedio, lastCalc };
  }, [indicadores]);

  // Max scoreMedio per region, colored by associated nivelRiscoMedio
  const byRegiao = useMemo((): RegioSummary[] => {
    const map = new Map<string, RegioSummary>();
    for (const ind of regionais) {
      const nome  = ind.nomeRegiao;
      const score = ind.scoreMedio;
      const nivel = ind.nivelRiscoMedio ?? '—';
      if (score === undefined) continue;
      const existing = map.get(nome);
      if (!existing || score > existing.maxScore) {
        map.set(nome, { nome, maxScore: score, nivel });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.maxScore - a.maxScore);
  }, [regionais]);

  // Count per nivelRiscoMedio (regional records)
  const byNivel = useMemo((): NivelCount[] => {
    const map = new Map<string, number>();
    for (const ind of regionais) {
      const nivel = ind.nivelRiscoMedio;
      if (!nivel) continue;
      map.set(nivel, (map.get(nivel) ?? 0) + 1);
    }
    return NIVEL_ORDER
      .filter((n) => map.has(n))
      .map((nivel) => ({ nivel, count: map.get(nivel) ?? 0 }));
  }, [regionais]);

  // Count per tipoRisco (all records including aggregate)
  const byTipoRisco = useMemo((): TipoCount[] => {
    const map = new Map<string, number>();
    for (const ind of indicadores) {
      const tipo = ind.tipoRisco;
      if (!tipo) continue;
      map.set(tipo, (map.get(tipo) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([tipo, count]) => ({
        label: tipoLabel(tipo),
        count,
        color: TIPO_COLORS[tipo] ?? '#3F51B5',
      }))
      .sort((a, b) => b.count - a.count);
  }, [indicadores]);

  // Sum of quantidadeAlertasAtivos per region
  const byAlertasAtivos = useMemo((): RegioAlerts[] => {
    const map = new Map<string, number>();
    for (const ind of regionais) {
      const nome = ind.nomeRegiao;
      map.set(nome, (map.get(nome) ?? 0) + (ind.quantidadeAlertasAtivos ?? 0));
    }
    return Array.from(map.entries())
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total);
  }, [regionais]);

  // Table: all records sorted dtCalculo DESC
  const tableRows = useMemo(
    () => [...indicadores].sort((a, b) =>
      (b.dtCalculo ?? '').localeCompare(a.dtCalculo ?? ''),
    ),
    [indicadores],
  );

  const loaded      = !isLoading && !error && indicadores.length > 0;
  const alertasMax  = byAlertasAtivos.reduce((m, r) => Math.max(m, r.total), 0);
  const calcLabel   = fmtHHMM(summary.lastCalc);

  return (
    <AppShell activeRoute="indicadores">
      <SafeAreaView style={screenStyles.safeArea}>
        <ScrollView
          contentContainerStyle={[
            screenStyles.scrollContent,
            isDesktop && screenStyles.desktopScrollContent,
          ]}>

          {/* ── Page header ──────────────────────────── */}
          <View style={[styles.pageHeader, isDesktop && styles.pageHeaderRow]}>
            <Text style={styles.pageTitle}>Indicadores Regionais</Text>
            {loaded ? (
              <View style={styles.headerMeta}>
                <Text style={styles.headerMetaText}>{indicadores.length} indicadores</Text>
                {calcLabel ? (
                  <Text style={styles.headerMetaText}>· Calculado: {calcLabel}</Text>
                ) : null}
              </View>
            ) : null}
          </View>

          {/* ── States ───────────────────────────────── */}
          {isLoading ? <LoadingState message="Carregando indicadores..." /> : null}
          {!isLoading && error ? <ErrorState message={error} onRetry={load} /> : null}
          {!isLoading && !error && indicadores.length === 0 ? (
            <EmptyState
              title="Nenhum indicador disponível"
              description="Não há dados de indicadores regionais no momento."
            />
          ) : null}

          {/* ── Analytics content ────────────────────── */}
          {loaded ? (
            <>
              {/* Overview tiles */}
              <View style={styles.tilesGrid}>
                <AnalyticsTile
                  label="Total Indicadores"
                  value={String(indicadores.length)}
                  sub="registros"
                />
                <AnalyticsTile
                  label="Regiões Avaliadas"
                  value={String(summary.totalRegioes)}
                  sub="áreas monitoradas"
                />
                <AnalyticsTile
                  label="Tipos de Risco"
                  value={String(summary.tiposRisco)}
                  sub="categorias distintas"
                />
                <AnalyticsTile
                  label="Score Médio"
                  value={summary.scoreMedio !== undefined ? String(summary.scoreMedio) : '—'}
                  sub="escala 0 – 100"
                />
              </View>

              {/* Score por região + nível de risco */}
              <View style={[styles.midRow, isDesktop && styles.midRowDesktop]}>

                <View style={[styles.panel, isDesktop && styles.panelLeft]}>
                  <Text style={styles.panelTitle}>Score Máximo por Região</Text>
                  <View style={styles.panelDivider} />
                  {byRegiao.length > 0
                    ? byRegiao.map(({ nome, maxScore, nivel }) => (
                        <HScoreBar key={nome} nome={nome} score={maxScore} nivel={nivel} />
                      ))
                    : <Text style={styles.panelEmpty}>Dados regionais não disponíveis.</Text>}
                </View>

                <View style={[styles.panel, isDesktop && styles.panelRight]}>
                  <Text style={styles.panelTitle}>Nível de Risco</Text>
                  <View style={styles.panelDivider} />
                  {byNivel.length > 0
                    ? byNivel.map(({ nivel, count }) => (
                        <HCountBar
                          key={nivel}
                          label={nivel}
                          count={count}
                          max={regionais.length}
                          color={nivelColor(nivel)}
                        />
                      ))
                    : <Text style={styles.panelEmpty}>Sem dados de nível de risco.</Text>}
                </View>

              </View>

              {/* Tipo de risco + alertas ativos */}
              <View style={[styles.midRow, isDesktop && styles.midRowDesktop]}>

                <View style={[styles.panel, isDesktop && styles.panelLeft]}>
                  <Text style={styles.panelTitle}>Distribuição por Tipo de Risco</Text>
                  <View style={styles.panelDivider} />
                  {byTipoRisco.length > 0
                    ? <VBarChart data={byTipoRisco} />
                    : <Text style={styles.panelEmpty}>Tipos de risco não disponíveis.</Text>}
                </View>

                <View style={[styles.panel, isDesktop && styles.panelRight]}>
                  <Text style={styles.panelTitle}>Alertas Ativos por Região</Text>
                  <View style={styles.panelDivider} />
                  {byAlertasAtivos.length > 0 && alertasMax > 0
                    ? byAlertasAtivos.map(({ nome, total }) => (
                        <HAlertBar key={nome} nome={nome} total={total} max={alertasMax} />
                      ))
                    : <Text style={styles.panelEmpty}>
                        Sem alertas ativos nos indicadores regionais.
                      </Text>}
                </View>

              </View>

              {/* Analytical table */}
              <View style={styles.tableContainer}>
                {isDesktop ? (
                  <View style={styles.tableHead}>
                    <Text style={[styles.thCell, styles.colRegiao]}>REGIÃO</Text>
                    <Text style={[styles.thCell, styles.colCidade]}>CIDADE / UF</Text>
                    <Text style={[styles.thCell, styles.colTipo]}>TIPO DE RISCO</Text>
                    <Text style={[styles.thCell, styles.colScore]}>SCORE</Text>
                    <Text style={[styles.thCell, styles.colNivel]}>NÍVEL</Text>
                    <Text style={[styles.thCell, styles.colEst]}>ESTAÇÕES</Text>
                    <Text style={[styles.thCell, styles.colAl]}>ALERTAS</Text>
                    <Text style={[styles.thCell, styles.colDt]}>CALCULADO</Text>
                  </View>
                ) : null}

                {tableRows.map((ind, idx) => {
                  const nome   = ind.nomeRegiao ?? 'Agregado';
                  const cidade = [ind.cidade, ind.estado].filter(Boolean).join(' / ') || '—';
                  const tipo   = tipoLabel(ind.tipoRisco);
                  const score  = ind.scoreMedio;
                  const nivel  = ind.nivelRiscoMedio;
                  const est    = ind.quantidadeEstacoes;
                  const al     = ind.quantidadeAlertasAtivos;
                  const dt     = ind.dtCalculo;
                  const color  = nivelColor(nivel);

                  return isDesktop ? (
                    <View key={idx} style={styles.tableRow}>
                      <View style={styles.colRegiao}>
                        <Text style={styles.rowNome} numberOfLines={1}>{nome}</Text>
                      </View>
                      <Text style={[styles.rowCell, styles.colCidade]} numberOfLines={1}>{cidade}</Text>
                      <Text style={[styles.rowCell, styles.colTipo]}>{tipo}</Text>
                      <View style={styles.colScore}>
                        {score !== undefined
                          ? <Text style={[styles.scoreVal, { color }]}>{score}</Text>
                          : <Text style={styles.dash}>—</Text>}
                      </View>
                      <View style={styles.colNivel}>
                        {nivel ? (
                          <View style={[styles.nivelBadge, { backgroundColor: nivelBg(nivel) }]}>
                            <Text style={[styles.nivelBadgeText, { color }]}>{nivel}</Text>
                          </View>
                        ) : <Text style={styles.dash}>—</Text>}
                      </View>
                      <Text style={[styles.rowCell, styles.colEst, styles.numCell]}>
                        {est !== undefined ? String(est) : '—'}
                      </Text>
                      <Text style={[styles.rowCell, styles.colAl, styles.numCell]}>
                        {al !== undefined ? String(al) : '—'}
                      </Text>
                      <Text style={[styles.rowCell, styles.colDt]}>{fmtDateCompact(dt)}</Text>
                    </View>
                  ) : (
                    <MobileIndicadorCard key={idx} ind={ind} />
                  );
                })}
              </View>

            </>
          ) : null}

        </ScrollView>
      </SafeAreaView>
    </AppShell>
  );
}

/* ── Sub-components ──────────────────────────────────── */

function AnalyticsTile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <View style={at.tile}>
      <Text style={at.label}>{label}</Text>
      <Text style={at.value}>{value}</Text>
      <Text style={at.sub}>{sub}</Text>
    </View>
  );
}

function HScoreBar({ nome, score, nivel }: { nome: string; score: number; nivel: string }) {
  const color = nivelColor(nivel);
  return (
    <View style={hb.row}>
      <Text style={hb.nome} numberOfLines={1}>{nome}</Text>
      <View style={hb.track}>
        <View style={[hb.fill, { width: `${score}%`, backgroundColor: color }]} />
      </View>
      <Text style={[hb.score, { color }]}>{score}</Text>
    </View>
  );
}

function HCountBar({
  label, count, max, color,
}: { label: string; count: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <View style={hc.row}>
      <Text style={hc.label}>{label}</Text>
      <View style={hc.track}>
        <View style={[hc.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[hc.count, { color }]}>{count}</Text>
    </View>
  );
}

function HAlertBar({ nome, total, max }: { nome: string; total: number; max: number }) {
  const pct   = max > 0 ? Math.round((total / max) * 100) : 0;
  const color = total > 0 ? '#EF6C00' : '#9CA3AF';
  return (
    <View style={hb.row}>
      <Text style={hb.nome} numberOfLines={1}>{nome}</Text>
      <View style={hb.track}>
        <View style={[hb.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[hb.score, { color }]}>{total}</Text>
    </View>
  );
}

function VBarChart({ data }: { data: TipoCount[] }) {
  const maxCount = data.reduce((m, d) => Math.max(m, d.count), 0);
  return (
    <View style={vc.chart}>
      {data.map(({ label, count, color }) => {
        const barH = maxCount > 0 ? Math.round((count / maxCount) * MAX_BAR_H) : 0;
        return (
          <View key={label} style={vc.col}>
            <Text style={vc.count}>{count}</Text>
            <View style={vc.barWrap}>
              <View style={[vc.bar, { height: barH, backgroundColor: color }]} />
            </View>
            <Text style={vc.label} numberOfLines={2}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

function MobileIndicadorCard({ ind }: { ind: IndicadorRegional }) {
  const nome   = ind.nomeRegiao ?? 'Agregado';
  const nivel  = ind.nivelRiscoMedio;
  const score  = ind.scoreMedio;
  const tipo   = tipoLabel(ind.tipoRisco);
  const est    = ind.quantidadeEstacoes;
  const al     = ind.quantidadeAlertasAtivos;
  const dt     = ind.dtCalculo;
  const color  = nivelColor(nivel);

  return (
    <View style={mc.card}>
      <View style={mc.topRow}>
        <Text style={mc.nome} numberOfLines={1}>{nome}</Text>
        {nivel ? (
          <View style={[mc.badge, { backgroundColor: nivelBg(nivel) }]}>
            <Text style={[mc.badgeText, { color }]}>{nivel}</Text>
          </View>
        ) : null}
      </View>
      <View style={mc.meta}>
        <Text style={mc.tipo}>{tipo}</Text>
        {score !== undefined
          ? <Text style={[mc.score, { color }]}>Score: {score}</Text>
          : null}
      </View>
      <View style={mc.counters}>
        {est !== undefined ? <Text style={mc.counter}>{est} estações</Text> : null}
        {al !== undefined  ? <Text style={mc.counter}>{al} alertas</Text>  : null}
      </View>
      {dt ? <Text style={mc.dt}>{fmtDateCompact(dt)}</Text> : null}
    </View>
  );
}

/* ── Styles ──────────────────────────────────────────── */

const styles = StyleSheet.create({
  pageHeader:    { gap: 6 },
  pageHeaderRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  pageTitle:     { color: '#1F2937', fontSize: 24, fontWeight: '700' },
  headerMeta:    { alignItems: 'center', flexDirection: 'row', gap: 6 },
  headerMetaText:{ color: '#6B7280', fontSize: 12 },

  tilesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },

  midRow:        { gap: 16 },
  midRowDesktop: { alignItems: 'flex-start', flexDirection: 'row' },

  panel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DDE2EA',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    overflow: 'hidden',
  },
  panelLeft:  { flexBasis: '58%', flexGrow: 1 },
  panelRight: { flexBasis: '38%', flexGrow: 1 },

  panelTitle: {
    color: '#1F2937',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
    padding: 16,
    paddingBottom: 12,
  },
  panelDivider: { backgroundColor: '#DDE2EA', height: 1 },
  panelEmpty:   { color: '#9CA3AF', fontSize: 13, padding: 16 },

  tableContainer: {
    backgroundColor: colors.surface,
    borderColor: '#DDE2EA',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableHead: {
    alignItems: 'center',
    backgroundColor: '#F8F9FB',
    borderBottomColor: '#DDE2EA',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  thCell: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, paddingHorizontal: 4 },

  tableRow: {
    alignItems: 'center',
    borderBottomColor: '#EEF0F4',
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  colRegiao: { flex: 2, paddingHorizontal: 4 },
  colCidade: { width: 110, paddingHorizontal: 4 },
  colTipo:   { width: 120, paddingHorizontal: 4 },
  colScore:  { width: 55,  paddingHorizontal: 4 },
  colNivel:  { width: 100, paddingHorizontal: 4 },
  colEst:    { width: 75,  paddingHorizontal: 4 },
  colAl:     { width: 70,  paddingHorizontal: 4 },
  colDt:     { width: 100, paddingHorizontal: 4 },

  rowNome:  { color: colors.neutralText, fontSize: 13, fontWeight: '600' },
  rowCell:  { color: colors.mutedText, fontSize: 13 },
  numCell:  { textAlign: 'center' },
  scoreVal: { fontSize: 14, fontWeight: '700' },
  dash:     { color: colors.mutedText, fontSize: 13 },

  nivelBadge:    { alignSelf: 'flex-start', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  nivelBadgeText:{ fontSize: 11, fontWeight: '700' },
});

const at = StyleSheet.create({
  tile: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DDE2EA',
    borderLeftColor: '#3F51B5',
    borderLeftWidth: 3,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    gap: 3,
    minWidth: 150,
    padding: 14,
  },
  label: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  value: { color: '#1F2937', fontSize: 20, fontWeight: '700' },
  sub:   { color: '#9CA3AF', fontSize: 11 },
});

const hb = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderBottomColor: '#F3F4F6',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  nome: { color: '#1F2937', fontSize: 12, fontWeight: '500', width: 155 },
  track: {
    backgroundColor: '#EEF0F4',
    borderRadius: 99,
    flex: 1,
    height: 7,
    overflow: 'hidden',
  },
  fill:  { borderRadius: 99, height: 7 },
  score: { fontSize: 13, fontWeight: '700', textAlign: 'right', width: 30 },
});

const hc = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderBottomColor: '#F3F4F6',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  label: { color: '#6B7280', fontSize: 11, fontWeight: '700', letterSpacing: 0.3, width: 72 },
  track: {
    backgroundColor: '#EEF0F4',
    borderRadius: 99,
    flex: 1,
    height: 6,
    overflow: 'hidden',
  },
  fill:  { borderRadius: 99, height: 6 },
  count: { fontSize: 13, fontWeight: '700', textAlign: 'right', width: 24 },
});

const vc = StyleSheet.create({
  chart: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: 8,
  },
  col:    { alignItems: 'center', flex: 1, gap: 6 },
  barWrap:{
    backgroundColor: '#EEF0F4',
    borderRadius: 6,
    height: MAX_BAR_H,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    width: '100%',
  },
  bar:   { borderTopLeftRadius: 4, borderTopRightRadius: 4, width: '100%' },
  count: { color: '#1F2937', fontSize: 12, fontWeight: '700' },
  label: { color: '#6B7280', fontSize: 11, marginBottom: 4, paddingHorizontal: 4, textAlign: 'center' },
});

const mc = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderBottomColor: '#EEF0F4',
    borderBottomWidth: 1,
    gap: 4,
    padding: 14,
  },
  topRow:  { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  nome:    { color: colors.neutralText, flex: 1, fontSize: 13, fontWeight: '600' },
  badge:   { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  meta:    { alignItems: 'center', flexDirection: 'row', gap: 12 },
  tipo:    { color: colors.mutedText, fontSize: 12 },
  score:   { fontSize: 13, fontWeight: '700' },
  counters:{ alignItems: 'center', flexDirection: 'row', gap: 12 },
  counter: { color: colors.mutedText, fontSize: 11 },
  dt:      { color: colors.mutedText, fontSize: 11 },
});
