import { useState, useEffect, useCallback, useLayoutEffect, useMemo } from 'react';
import { usePolling } from '@hooks/usePolling';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { useDashboardSummary } from '@hooks/useDashboardSummary';
import { useAlertas } from '@hooks/useAlertas';
import { useIndicadores } from '@hooks/useIndicadores';
import { useRegioes } from '@hooks/useRegioes';
import { useAppContext } from '@contexts/AppContext';
import { LoadingState, ErrorState, RiskBadge } from '@components/ui';
import {
  ChartCard,
  FilterBar,
  RiskLevelDonut,
  HorizontalBarChart,
  RegionalRankingBar,
} from '@components/charts';
import type { FilterOption } from '@components/charts';
import { Colors, RiskColors, RiskBackgrounds } from '@constants/colors';
import { FontSize, Spacing, Radius, Shadow } from '@constants/design';
import {
  NivelRiscoLabels,
  CategoriaRiscoLabels,
} from '@constants/enums';
import type { NivelRisco, CategoriaRisco } from '@constants/enums';
import type { DashboardSummary } from '@/types';
import {
  aggregateByNivelRisco,
  aggregateByTipoRisco,
  buildRegionalRanking,
  aggregateAlertasByStatusBars,
  aggregateAlertasByTipo,
  buildCoverageByState,
} from '@utils/chartTransforms';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(iso: string): string {
  if (!iso) return 'Atualização não informada';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 'Formato de data inválido';
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
      `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ` +
      `${pad(d.getHours())}:${pad(d.getMinutes())}`
    );
  } catch {
    return iso;
  }
}

// ─── Filter options ───────────────────────────────────────────────────────────

const NIVEL_OPTIONS: FilterOption<NivelRisco>[] = [
  { key: null, label: 'Todos' },
  { key: 'CRITICO', label: NivelRiscoLabels.CRITICO },
  { key: 'ALTO', label: NivelRiscoLabels.ALTO },
  { key: 'MODERADO', label: NivelRiscoLabels.MODERADO },
  { key: 'BAIXO', label: NivelRiscoLabels.BAIXO },
];

const TIPO_OPTIONS: FilterOption<CategoriaRisco>[] = [
  { key: null, label: 'Todos' },
  { key: 'ENCHENTE', label: CategoriaRiscoLabels.ENCHENTE },
  { key: 'TEMPESTADE', label: CategoriaRiscoLabels.TEMPESTADE },
  { key: 'QUALIDADE_AR', label: CategoriaRiscoLabels.QUALIDADE_AR },
  { key: 'DESLIZAMENTO', label: CategoriaRiscoLabels.DESLIZAMENTO },
];

// ─── KPI builders ─────────────────────────────────────────────────────────────

interface KPIItem {
  label: string;
  value: number;
  fg?: string;
  bg?: string;
  size?: 'normal' | 'large';
}

function buildGovernKPIs(d: DashboardSummary): KPIItem[] {
  return [
    { label: 'Regiões em atenção', value: d.regioesComRiscoAltoOuCritico, fg: RiskColors.ALTO, bg: RiskBackgrounds.ALTO, size: 'large' },
    { label: 'Alertas críticos', value: d.totalAlertasCriticos, fg: RiskColors.CRITICO, bg: RiskBackgrounds.CRITICO, size: 'large' },
    { label: 'Alertas ativos', value: d.totalAlertasAtivos, fg: Colors.text },
    { label: 'Alertas resolvidos', value: d.totalAlertasResolvidos, fg: RiskColors.BAIXO, bg: RiskBackgrounds.BAIXO },
    { label: 'Estações ativas', value: d.totalEstacoesAtivas },
    { label: 'Leituras válidas', value: d.totalLeiturasValidas },
    { label: 'Avaliações de risco', value: d.totalAvaliacoesRisco },
    { label: 'Obs. climáticas', value: d.totalObservacoesClimaticas },
  ];
}

function buildONGKPIs(d: DashboardSummary): KPIItem[] {
  return [
    { label: 'Comunidades monitoradas', value: d.totalRegioesAtivas, fg: Colors.primary, size: 'large' },
    { label: 'Alertas em acompanhamento', value: d.totalAlertasAtivos, fg: RiskColors.ALTO, bg: RiskBackgrounds.ALTO, size: 'large' },
    { label: 'Alertas críticos', value: d.totalAlertasCriticos, fg: RiskColors.CRITICO, bg: RiskBackgrounds.CRITICO },
    { label: 'Estações ativas', value: d.totalEstacoesAtivas },
    { label: 'Leituras registradas', value: d.totalLeiturasValidas },
    { label: 'Obs. climáticas', value: d.totalObservacoesClimaticas },
    { label: 'Avaliações realizadas', value: d.totalAvaliacoesRisco },
  ];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ContextMeta({ contextLabel, atualizadoEm }: { contextLabel: string; atualizadoEm?: string }) {
  return (
    <View style={styles.metaRow}>
      <View style={styles.contextPill}>
        <Text style={styles.contextPillText}>{contextLabel}</Text>
      </View>
      {atualizadoEm ? (
        <Text style={styles.lastUpdated}>Atualizado em {formatDateTime(atualizadoEm)}</Text>
      ) : null}
    </View>
  );
}

function StatusCard({
  nivel,
  regioesEmAtencao,
  isGoverno,
}: {
  nivel: NivelRisco | null;
  regioesEmAtencao: number;
  isGoverno: boolean;
}) {
  const isKnown = nivel === 'BAIXO' || nivel === 'MODERADO' || nivel === 'ALTO' || nivel === 'CRITICO';
  const bg = isKnown ? RiskBackgrounds[nivel as NivelRisco] : '#EEF2FF';
  const fg = isKnown ? RiskColors[nivel as NivelRisco] : Colors.primary;
  const riskLabel = isKnown ? NivelRiscoLabels[nivel as NivelRisco] : 'Não informado';
  const title = isGoverno ? 'Situação Operacional' : 'Monitoramento Ambiental';
  const subtitle = isGoverno
    ? `${regioesEmAtencao} ${regioesEmAtencao === 1 ? 'região' : 'regiões'} com risco alto ou crítico`
    : 'Maior nível de risco nas regiões monitoradas';
  return (
    <View style={[styles.statusCard, { backgroundColor: bg, borderLeftColor: fg }]}>
      <Text style={styles.statusTitle}>{title}</Text>
      <View style={styles.statusValueRow}>
        <Text style={[styles.statusValue, { color: fg }]}>{riskLabel}</Text>
        {isKnown && <RiskBadge nivel={nivel as NivelRisco} />}
      </View>
      <Text style={[styles.statusSubtitle, { color: fg }]}>{subtitle}</Text>
    </View>
  );
}

function KPICard({ item, cardWidth }: { item: KPIItem; cardWidth: number }) {
  const isLarge = item.size === 'large';
  return (
    <View
      style={[
        styles.kpiCard,
        { width: cardWidth },
        item.bg ? { backgroundColor: item.bg, borderColor: item.fg ?? Colors.border } : null,
        isLarge ? styles.kpiCardLarge : null,
      ]}
    >
      <Text style={[styles.kpiValue, { color: item.fg ?? Colors.text }, isLarge ? styles.kpiValueLarge : null]}>
        {item.value.toLocaleString('pt-BR')}
      </Text>
      <Text style={styles.kpiLabel} numberOfLines={2}>{item.label}</Text>
    </View>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { isGoverno } = useAppContext();

  const {
    status: summaryStatus, data: summary, errorMessage: summaryErr,
    warnings, isPartial, load: loadSummary,
  } = useDashboardSummary();
  const { status: alertasStatus, data: alertas, errorMessage: alertasErr, load: loadAlertas } = useAlertas();
  const { status: indStatus, data: indicadores, errorMessage: indErr, load: loadIndicadores } = useIndicadores();
  const { status: regStatus, data: regioes, errorMessage: regErr, load: loadRegioes } = useRegioes();

  const [refreshing, setRefreshing] = useState(false);
  const { width } = useWindowDimensions();
  const navigation = useNavigation();
  const router = useRouter();

  const [nivelFilter, setNivelFilter] = useState<NivelRisco | null>(null);
  const [tipoFilter, setTipoFilter] = useState<CategoriaRisco | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Dashboard' });
  }, [navigation]);

  useEffect(() => {
    loadSummary();
    loadAlertas();
    loadIndicadores();
    loadRegioes();
  }, [loadSummary, loadAlertas, loadIndicadores, loadRegioes]);

  // Live polling every 10 s while the dashboard is focused
  const pollAll = useCallback(() => {
    loadSummary({ silent: true });
    loadAlertas({ silent: true });
    loadIndicadores({ silent: true });
    loadRegioes({ silent: true });
  }, [loadSummary, loadAlertas, loadIndicadores, loadRegioes]);
  usePolling(pollAll);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadSummary(), loadAlertas(), loadIndicadores(), loadRegioes()]);
    setRefreshing(false);
  }, [loadSummary, loadAlertas, loadIndicadores, loadRegioes]);

  // ── All useMemo before conditional returns ────────────────────────────────

  // Card A filter (nivelFilter) controls only Card A data and the ranking
  const riskLevelSlices = useMemo(
    () => aggregateByNivelRisco(indicadores, nivelFilter),
    [indicadores, nivelFilter],
  );
  // Card B filter (tipoFilter) controls only Card B data and the ranking
  const riskTypeBars = useMemo(
    () => aggregateByTipoRisco(indicadores, tipoFilter),
    [indicadores, tipoFilter],
  );
  const rankingRows = useMemo(
    () => buildRegionalRanking(indicadores, nivelFilter, tipoFilter),
    [indicadores, nivelFilter, tipoFilter],
  );
  const alertStatusBars = useMemo(
    () => aggregateAlertasByStatusBars(alertas, null),
    [alertas],
  );
  // Alert type chart is unfiltered — shows full distribution
  const alertTypeBars = useMemo(() => aggregateAlertasByTipo(alertas), [alertas]);
  const coverageRows = useMemo(
    () => buildCoverageByState(regioes, indicadores),
    [regioes, indicadores],
  );

  // ── Conditional returns (only after all hooks) ────────────────────────────

  if (summaryStatus === 'loading' && summary === null && !refreshing) {
    return <LoadingState message="Carregando painel..." />;
  }
  if (summaryStatus === 'error' && summary === null) {
    return (
      <ErrorState
        message={summaryErr ?? 'Não foi possível carregar o painel.'}
        onRetry={loadSummary}
      />
    );
  }
  if (summaryStatus === 'success' && summary === null) {
    return (
      <ErrorState
        message="O painel ainda não possui dados disponíveis."
        onRetry={loadSummary}
      />
    );
  }

  // ── Layout computations ───────────────────────────────────────────────────

  const isWide = width >= 768;
  // Sidebar is 220px on desktop; content area = viewport - sidebar. On mobile = full width.
  const SIDEBAR_W = isWide ? 220 : 0;
  const contentW  = width - SIDEBAR_W - (isWide ? Spacing.xl * 2 : Spacing.md * 2);
  const numCols   = contentW >= 600 ? 4 : 2;
  const cardWidth = (contentW - Spacing.sm * (numCols - 1)) / numCols;
  const contextLabel = isGoverno ? 'Governo / Defesa Civil' : 'ONG';
  const kpiItems = summary
    ? isGoverno ? buildGovernKPIs(summary) : buildONGKPIs(summary)
    : [];

  const indicadoresLoading = indStatus === 'loading' || indStatus === 'idle';
  const alertasLoading = alertasStatus === 'loading' || alertasStatus === 'idle';
  const regioesLoading = regStatus === 'loading' || regStatus === 'idle';

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <ScrollView
      style={styles.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[Colors.primary]}
          tintColor={Colors.primary}
        />
      }
    >
      <View style={[styles.content, isWide && styles.contentWide]}>
        {/* Context label + last updated */}
        <ContextMeta contextLabel={contextLabel} atualizadoEm={summary?.atualizadoEm || undefined} />

        {/* Stale-data banner */}
        {summaryStatus === 'error' && summary !== null && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>
              {summaryErr ?? 'Falha ao atualizar. Exibindo dados anteriores.'}
            </Text>
          </View>
        )}

        {/* Partial-data banner */}
        {isPartial && summary !== null && (
          <View style={styles.partialBanner}>
            <Text style={styles.partialBannerTitle}>Dados parcialmente disponíveis</Text>
            {warnings.map(w => (
              <Text key={w} style={styles.partialBannerText}>{w}</Text>
            ))}
          </View>
        )}

        {/* ── Operational status ───────────────────────────────────────────── */}
        {summary && (
          <StatusCard
            nivel={summary.maiorNivelRiscoAtual}
            regioesEmAtencao={summary.regioesComRiscoAltoOuCritico}
            isGoverno={isGoverno}
          />
        )}

        {/* ── KPI grid ─────────────────────────────────────────────────────── */}
        {kpiItems.length > 0 && (
          <View>
            <SectionHeader
              title={isGoverno ? 'Indicadores operacionais' : 'Indicadores de monitoramento'}
            />
            <View style={styles.kpiGrid}>
              {kpiItems.map(item => (
                <KPICard key={item.label} item={item} cardWidth={cardWidth} />
              ))}
            </View>
          </View>
        )}

        {/* ── Risk distribution ────────────────────────────────────────────── */}
        <SectionHeader
          title={isGoverno ? 'Análise de Risco' : 'Análise Ambiental'}
          subtitle={isGoverno
            ? 'Distribuição de risco e tipo de ameaça por região'
            : 'Nível e categoria de risco nas regiões monitoradas'}
        />

        <View style={[styles.chartRow, isWide && styles.chartRowWide]}>
          <View style={isWide ? styles.col : styles.colFull}>
            <ChartCard
              title="Distribuição por Nível de Risco"
              subtitle="Contagem de regiões por nível calculado"
              loading={indicadoresLoading}
              error={indErr}
              empty={!indicadoresLoading && riskLevelSlices.length === 0}
              emptyMessage="Sem indicadores disponíveis."
              filterSlot={
                <FilterBar<NivelRisco>
                  label="Filtrar por nível"
                  options={NIVEL_OPTIONS}
                  value={nivelFilter}
                  onChange={setNivelFilter}
                />
              }
            >
              <RiskLevelDonut data={riskLevelSlices} />
            </ChartCard>
          </View>

          <View style={isWide ? styles.col : styles.colFull}>
            <ChartCard
              title="Distribuição por Tipo de Risco"
              subtitle={tipoFilter
                ? `Regiões com tipo ${CategoriaRiscoLabels[tipoFilter]}`
                : 'Categorias em todas as regiões'}
              loading={indicadoresLoading}
              error={indErr}
              empty={!indicadoresLoading && riskTypeBars.every(b => b.value === 0)}
              emptyMessage="Sem dados para o filtro selecionado."
              filterSlot={
                <FilterBar<CategoriaRisco>
                  label="Filtrar por categoria"
                  options={TIPO_OPTIONS}
                  value={tipoFilter}
                  onChange={setTipoFilter}
                />
              }
            >
              <HorizontalBarChart data={riskTypeBars} />
            </ChartCard>
          </View>
        </View>

        {/* ── Regional ranking ─────────────────────────────────────────────── */}
        <SectionHeader
          title={isGoverno ? 'Ranking de Risco Regional' : 'Regiões por Criticidade'}
          subtitle="Regiões ordenadas pelo maior score de risco calculado"
        />

        <ChartCard
          title={rankingRows.length > 0 ? `Top ${rankingRows.length} regiões` : 'Ranking regional'}
          loading={indicadoresLoading}
          error={indErr}
          empty={!indicadoresLoading && rankingRows.length === 0}
          emptyMessage={
            nivelFilter || tipoFilter
              ? 'Nenhuma região encontrada para os filtros selecionados.'
              : 'Sem dados de indicadores disponíveis.'
          }
        >
          <RegionalRankingBar
            data={rankingRows}
            onPress={(idRegiao) => router.push(`/regioes/${idRegiao}`)}
          />
        </ChartCard>

        {/* ── Alerts ───────────────────────────────────────────────────────── */}
        <SectionHeader
          title={isGoverno ? 'Console de Alertas' : 'Alertas Monitorados'}
          subtitle={isGoverno
            ? 'Status e categorização dos alertas gerados'
            : 'Acompanhamento dos alertas nas regiões'}
        />

        <View style={[styles.chartRow, isWide && styles.chartRowWide]}>
          <View style={isWide ? styles.col : styles.colFull}>
            <ChartCard
              title="Status dos Alertas"
              subtitle="Ciclo de vida dos alertas registrados"
              loading={alertasLoading}
              error={alertasErr}
              empty={!alertasLoading && alertStatusBars.length === 0}
              emptyMessage="Sem alertas registrados."
            >
              <HorizontalBarChart
                data={alertStatusBars}
                onBarPress={(key) => router.push(`/alertas?status=${key}`)}
              />
            </ChartCard>
          </View>

          <View style={isWide ? styles.col : styles.colFull}>
            <ChartCard
              title="Alertas por Categoria"
              subtitle="Distribuição por tipo de risco"
              loading={alertasLoading}
              error={alertasErr}
              empty={!alertasLoading && alertTypeBars.length === 0}
              emptyMessage="Sem alertas registrados."
            >
              <HorizontalBarChart
                data={alertTypeBars}
                onBarPress={(key) => router.push(`/alertas?tipo=${key}`)}
              />
            </ChartCard>
          </View>
        </View>

        {/* ── Coverage by state ────────────────────────────────────────────── */}
        <SectionHeader
          title={isGoverno ? 'Cobertura por Estado' : 'Abrangência Geográfica'}
          subtitle="Regiões monitoradas e nível máximo de risco por estado"
        />

        <ChartCard
          title="Estados monitorados"
          loading={regioesLoading || indicadoresLoading}
          error={regErr ?? indErr}
          empty={!regioesLoading && !indicadoresLoading && coverageRows.length === 0}
          emptyMessage="Sem dados de cobertura disponíveis."
        >
          <View style={styles.coverageLegend}>
            {(['CRITICO', 'ALTO', 'MODERADO', 'BAIXO'] as NivelRisco[]).map(n => (
              <View key={n} style={styles.coverageLegendItem}>
                <View style={[styles.coverageLegendDot, { backgroundColor: RiskColors[n] }]} />
                <Text style={styles.coverageLegendLabel}>{NivelRiscoLabels[n]}</Text>
              </View>
            ))}
          </View>

          <View style={styles.coverageGrid}>
            {coverageRows.map(row => {
              const fg = row.maxNivel ? RiskColors[row.maxNivel] : Colors.textMuted;
              const bg = row.maxNivel ? RiskBackgrounds[row.maxNivel] : Colors.background;
              return (
                <TouchableOpacity
                  key={row.estado}
                  style={[styles.coverageCard, { borderTopColor: fg }]}
                  onPress={() => router.push(`/regioes?estado=${row.estado}`)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.coverageEstado, { color: fg }]}>{row.estado}</Text>
                  <Text style={styles.coverageStat}>
                    {row.qtRegioes} {row.qtRegioes === 1 ? 'região' : 'regiões'}
                  </Text>
                  {row.qtAlertasAtivos > 0 && (
                    <Text style={[styles.coverageAlerts, { color: fg }]}>
                      {row.qtAlertasAtivos} alerta{row.qtAlertasAtivos > 1 ? 's' : ''}
                    </Text>
                  )}
                  {row.maxNivel && (
                    <View style={[styles.coverageLevelPill, { backgroundColor: bg }]}>
                      <Text style={[styles.coverageLevelText, { color: fg }]}>
                        {NivelRiscoLabels[row.maxNivel]}
                      </Text>
                    </View>
                  )}
                  {row.maxScore > 0 && (
                    <Text style={styles.coverageScore}>score {row.maxScore}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ChartCard>

        <View style={styles.bottomPad} />
      </View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.md,
  },
  contentWide: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },

  // Two-column chart layout (desktop)
  chartRow: {
    rowGap: Spacing.md,
  },
  chartRowWide: {
    flexDirection: 'row',
    columnGap: Spacing.md,
    alignItems: 'flex-start',
  },
  col: {
    flex: 1,
  },
  colFull: {},

  // Meta row
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
    rowGap: Spacing.xs,
  },
  contextPill: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  contextPillText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.card,
  },
  lastUpdated: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },

  // Banners
  errorBanner: {
    backgroundColor: RiskBackgrounds.ALTO,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: RiskColors.ALTO,
  },
  errorBannerText: {
    fontSize: FontSize.sm,
    color: RiskColors.ALTO,
    lineHeight: 18,
  },
  partialBanner: {
    backgroundColor: RiskBackgrounds.MODERADO,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: RiskColors.MODERADO,
    rowGap: 2,
  },
  partialBannerTitle: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: RiskColors.MODERADO,
    marginBottom: 2,
  },
  partialBannerText: {
    fontSize: FontSize.xs,
    color: RiskColors.MODERADO,
    lineHeight: 16,
  },

  // Status card
  statusCard: {
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  statusTitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statusValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  statusValue: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statusSubtitle: {
    fontSize: FontSize.sm,
    lineHeight: 18,
  },

  // Section headers
  sectionHeader: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },

  // KPI grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: Spacing.sm,
    columnGap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  kpiCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  kpiCardLarge: {
    borderBottomWidth: 3,
    borderBottomColor: Colors.border,
  },
  kpiValue: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  kpiValueLarge: {
    fontSize: FontSize.title,
    fontWeight: '800',
    letterSpacing: -1,
  },
  kpiLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    lineHeight: 16,
  },

  // Coverage grid
  coverageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: Spacing.sm,
    columnGap: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  coverageCard: {
    backgroundColor: Colors.background,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    minWidth: 84,
    alignItems: 'center',
    borderTopWidth: 3,
    rowGap: 2,
  },
  coverageEstado: {
    fontSize: FontSize.xl,
    fontWeight: '800',
  },
  coverageStat: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  coverageAlerts: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    textAlign: 'center',
  },
  coverageLevelPill: {
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    marginTop: 2,
  },
  coverageLevelText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  coverageScore: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },

  // Coverage legend
  coverageLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: Spacing.xs,
    columnGap: Spacing.md,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  coverageLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: Spacing.xs,
  },
  coverageLegendDot: {
    width: 10,
    height: 10,
    borderRadius: Radius.pill,
  },
  coverageLegendLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '500',
  },

  bottomPad: {
    height: Spacing.xl,
  },
});
