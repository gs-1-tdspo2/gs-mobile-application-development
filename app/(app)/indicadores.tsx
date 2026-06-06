import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAppContext } from '@contexts/AppContext';
import { useIndicadores } from '@hooks/useIndicadores';
import { useRegioes } from '@hooks/useRegioes';
import { useEstacoes } from '@hooks/useEstacoes';
import { useLeituras } from '@hooks/useLeituras';
import { Colors, RiskColors, RiskBackgrounds } from '@constants/colors';
import { FontSize, Spacing, Radius, Shadow } from '@constants/design';
import { NivelRiscoLabels, CategoriaRiscoLabels, TipoEstacaoLabels, StatusEstacaoLabels } from '@constants/enums';
import { RegionSelector } from '@components/charts/RegionSelector';
import { SensorDimensionGrid } from '@components/charts/SensorDimensionCard';
import { SensorReadingSection } from '@components/charts/SensorReadingSection';
import { ChartCard } from '@components/charts/ChartCard';
import { HorizontalBarChart } from '@components/charts/HorizontalBarChart';
import { Card } from '@components/ui';
import { extractSensorAnalysis } from '@utils/sensorTransforms';
import { buildRegionalRanking } from '@utils/chartTransforms';
import type { EstacaoIot, RegiaoMonitorada } from '@/types';
import type { NivelRisco } from '@constants/enums';

// ─── Station coverage section ─────────────────────────────────────────────────

function EstacaoRow({ estacao }: { estacao: EstacaoIot }) {
  const statusColor: Record<string, string> = {
    ATIVA: '#2E7D32',
    INATIVA: '#757575',
    MANUTENCAO: '#EF6C00',
    FALHA: '#D32F2F',
    SEM_COM: '#9E9E9E',
  };
  const color = statusColor[estacao.statusEstacao] ?? Colors.textMuted;

  return (
    <View style={stStyles.row}>
      <View style={stStyles.rowTop}>
        <Text style={stStyles.estNome} numberOfLines={1}>{estacao.nome}</Text>
        <View style={[stStyles.statusBadge, { backgroundColor: color + '22' }]}>
          <Text style={[stStyles.statusText, { color }]}>
            {StatusEstacaoLabels[estacao.statusEstacao] ?? estacao.statusEstacao}
          </Text>
        </View>
      </View>
      <View style={stStyles.rowMeta}>
        <Text style={stStyles.meta}>{estacao.codigoEstacao}</Text>
        <Text style={stStyles.metaSep}>·</Text>
        <Text style={stStyles.meta}>
          {TipoEstacaoLabels[estacao.tipoEstacao] ?? estacao.tipoEstacao}
        </Text>
        {estacao.dtUltimaComunicacao ? (
          <>
            <Text style={stStyles.metaSep}>·</Text>
            <Text style={stStyles.meta}>Últ. com.: {estacao.dtUltimaComunicacao.slice(0, 16).replace('T', ' ')}</Text>
          </>
        ) : null}
      </View>
      {(estacao.latitude != null && estacao.longitude != null) ? (
        <Text style={stStyles.coords}>
          {estacao.latitude.toFixed(4)}, {estacao.longitude.toFixed(4)}
        </Text>
      ) : null}
    </View>
  );
}

const stStyles = StyleSheet.create({
  row: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  estNome: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: Spacing.xs,
  },
  meta: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  metaSep: {
    fontSize: FontSize.xs,
    color: Colors.border,
  },
  coords: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
});

// ─── Regional indicator row ───────────────────────────────────────────────────

function IndicadorRow({ item, isLast }: {
  item: { nomeRegiao: string; cidade: string; estado: string; tipoRisco: string; scoreMedio: number; nivelRiscoMedio: NivelRisco; quantidadeAlertasAtivos: number };
  isLast: boolean;
}) {
  const riskColor = RiskColors[item.nivelRiscoMedio];
  const riskBg = RiskBackgrounds[item.nivelRiscoMedio];
  return (
    <View style={[indStyles.row, isLast && indStyles.rowLast]}>
      <View style={indStyles.rowLeft}>
        <Text style={indStyles.nome} numberOfLines={1}>{item.nomeRegiao}</Text>
        <Text style={indStyles.sub}>{item.cidade} · {item.estado}</Text>
        <Text style={indStyles.tipo}>{CategoriaRiscoLabels[item.tipoRisco as keyof typeof CategoriaRiscoLabels] ?? item.tipoRisco}</Text>
      </View>
      <View style={indStyles.rowRight}>
        <View style={[indStyles.nivelBadge, { backgroundColor: riskBg }]}>
          <Text style={[indStyles.nivelText, { color: riskColor }]}>
            {NivelRiscoLabels[item.nivelRiscoMedio]}
          </Text>
        </View>
        <Text style={indStyles.score}>{item.scoreMedio.toFixed(0)}<Text style={indStyles.scoreUnit}> pts</Text></Text>
        {item.quantidadeAlertasAtivos > 0 ? (
          <Text style={indStyles.alertas}>{item.quantidadeAlertasAtivos} alerta{item.quantidadeAlertasAtivos > 1 ? 's' : ''}</Text>
        ) : null}
      </View>
    </View>
  );
}

const indStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLeft: {
    flex: 1,
    marginRight: Spacing.sm,
    rowGap: 2,
  },
  nome: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  sub: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  tipo: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  rowRight: {
    alignItems: 'flex-end',
    rowGap: 2,
  },
  nivelBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  nivelText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  score: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  scoreUnit: {
    fontSize: FontSize.xs,
    fontWeight: '400',
    color: Colors.textMuted,
  },
  alertas: {
    fontSize: FontSize.xs,
    color: '#D32F2F',
    fontWeight: '600',
  },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function IndicadoresScreen() {
  // ── Context ──────────────────────────────────────────────────────────────────
  const { isGoverno } = useAppContext();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  // ── State ────────────────────────────────────────────────────────────────────
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRegiaoId, setSelectedRegiaoId] = useState<number | null>(null);

  // ── Hooks — ALWAYS called unconditionally, BEFORE any early return ───────────
  const { status: indStatus, data: indicadores, errorMessage: indError, load: loadInd } = useIndicadores();
  const { status: regStatus, data: regioes, errorMessage: regError, load: loadReg } = useRegioes();
  const { status: estStatus, data: estacoes, errorMessage: estError, load: loadEst } = useEstacoes(selectedRegiaoId);
  const { status: leitStatus, data: leituras, errorMessage: leitError, load: loadLeit } = useLeituras(selectedRegiaoId);

  // ── Derived data — ALL useMemo before conditional returns ───────────────────
  const rankingRows = useMemo(
    () => buildRegionalRanking(indicadores, null, null, 15),
    [indicadores],
  );

  const sensorAnalysis = useMemo(
    () => extractSensorAnalysis(leituras),
    [leituras],
  );

  const selectedRegiao: RegiaoMonitorada | null = useMemo(
    () => regioes.find(r => r.idRegiao === selectedRegiaoId) ?? null,
    [regioes, selectedRegiaoId],
  );

  // ── Effects ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    loadInd();
    loadReg();
  }, [loadInd, loadReg]);

  useEffect(() => {
    if (selectedRegiaoId !== null) {
      loadEst();
      loadLeit();
    }
  }, [selectedRegiaoId, loadEst, loadLeit]);

  // ── Callbacks ────────────────────────────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const tasks: Promise<void>[] = [loadInd(), loadReg()];
    if (selectedRegiaoId !== null) {
      tasks.push(loadEst(), loadLeit());
    }
    await Promise.all(tasks);
    setRefreshing(false);
  }, [loadInd, loadReg, loadEst, loadLeit, selectedRegiaoId]);

  const handleSelectRegiao = useCallback((id: number | null) => {
    setSelectedRegiaoId(id);
  }, []);

  // ── Context-sensitive copy ───────────────────────────────────────────────────
  const subtitle = isGoverno
    ? 'Priorização de risco, cobertura de estações e telemetria operacional por região.'
    : 'Evidências ambientais e monitoramento territorial das comunidades acompanhadas.';

  const indicadoresTitle = isGoverno
    ? 'Situação territorial por região'
    : 'Indicadores de risco por comunidade';

  const indicadoresSubtitle = isGoverno
    ? 'Score médio, nível de risco e alertas ativos por região monitorada.'
    : 'Regiões com avaliação de risco calculada para apoio a relatórios.';

  // ── Overall loading / error ──────────────────────────────────────────────────
  const globalLoading = indStatus === 'loading' && indicadores.length === 0;
  const globalError = indStatus === 'error' && indicadores.length === 0;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Indicadores e Sensores</Text>
        <Text style={styles.pageSubtitle}>{subtitle}</Text>
      </View>

      {/* ── Region selector ──────────────────────────────────────────────────── */}
      {regStatus === 'success' && regioes.length > 0 ? (
        <RegionSelector
          regioes={regioes}
          selectedId={selectedRegiaoId}
          onSelect={handleSelectRegiao}
        />
      ) : regStatus === 'loading' ? (
        <View style={styles.regionLoading}>
          <Text style={styles.regionLoadingText}>Carregando regiões...</Text>
        </View>
      ) : regStatus === 'error' ? (
        <View style={styles.callout}>
          <Text style={styles.calloutText}>Erro ao carregar regiões: {regError}</Text>
        </View>
      ) : null}

      {/* ── Callout: select region for sensor readings ───────────────────────── */}
      {selectedRegiaoId === null ? (
        <View style={styles.callout}>
          <Text style={styles.calloutTitle}>Leituras por sensor</Text>
          <Text style={styles.calloutText}>
            Selecione uma região acima para visualizar leituras de sensores IoT, cobertura de estações
            e análise de telemetria ambiental.
          </Text>
        </View>
      ) : null}

      {/* ── Regional indicator analytics ─────────────────────────────────────── */}
      <ChartCard
        title={indicadoresTitle}
        subtitle={indicadoresSubtitle}
        loading={globalLoading}
        error={globalError ? (indError ?? 'Erro ao carregar indicadores regionais.') : null}
        empty={!globalLoading && !globalError && rankingRows.length === 0}
        emptyMessage="Nenhum indicador regional encontrado."
      >
        <View style={styles.rankingList}>
          {rankingRows.map((item, i) => (
            <IndicadorRow key={item.idIndicador} item={item} isLast={i === rankingRows.length - 1} />
          ))}
        </View>
      </ChartCard>

      {/* ── Sensor dimension reference cards ────────────────────────────────── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Dimensões de sensores IoT</Text>
        <Text style={styles.sectionSubtitle}>
          Amanajé integra quatro tipos de sensores para cobertura multidimensional de risco ambiental.
        </Text>
      </View>
      <SensorDimensionGrid />

      {/* ── Station coverage (only when region selected) ─────────────────────── */}
      {selectedRegiaoId !== null ? (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedRegiao?.nome ?? 'Região selecionada'} · {selectedRegiao?.estado ?? ''}
            </Text>
            <Text style={styles.sectionSubtitle}>
              {isGoverno
                ? 'Estações operacionais e telemetria de sensores para esta região.'
                : 'Estações de monitoramento e leituras ambientais para esta comunidade.'}
            </Text>
          </View>

          {/* Station list */}
          <ChartCard
            title="Cobertura de estações"
            subtitle={
              estStatus === 'success'
                ? `${estacoes.length} estação${estacoes.length !== 1 ? 'ões' : ''} vinculada${estacoes.length !== 1 ? 's' : ''} a esta região`
                : undefined
            }
            loading={estStatus === 'loading'}
            error={estStatus === 'error' ? (estError ?? 'Erro ao carregar estações.') : null}
            empty={estStatus === 'success' && estacoes.length === 0}
            emptyMessage="Nenhuma estação IoT encontrada para esta região."
          >
            <View>
              {estacoes.map(est => (
                <EstacaoRow key={est.idEstacao} estacao={est} />
              ))}
            </View>
          </ChartCard>

          {/* Sensor reading sections — only when leituras loaded */}
          {leitStatus !== 'idle' ? (
            <>
              {/* Nível de água — HC-SR04 */}
              <SensorReadingSection
                title="Nível de água"
                componente="HC-SR04 · Ultrassônico"
                color="#1565C0"
                loading={leitStatus === 'loading'}
                error={leitStatus === 'error' ? (leitError ?? 'Erro ao carregar leituras.') : null}
                seriesMap={leitStatus === 'success' ? {
                  distancia: sensorAnalysis.agua.distancia,
                  nivel: sensorAnalysis.agua.nivel,
                } : {
                  distancia: { unit: 'cm', label: 'Distância à água', available: false, points: [], latestValue: null, latestLabel: null, min: null, max: null },
                  nivel: { unit: '%', label: 'Nível de água', available: false, points: [], latestValue: null, latestLabel: null, min: null, max: null },
                }}
              />

              {/* Material particulado — Slider (PMS5003 sim) */}
              <SensorReadingSection
                title="Material particulado"
                componente="Potenciômetro Slider (simulação PMS5003)"
                color="#6A1B9A"
                loading={leitStatus === 'loading'}
                error={leitStatus === 'error' ? (leitError ?? 'Erro ao carregar leituras.') : null}
                seriesMap={leitStatus === 'success' ? {
                  pm25: sensorAnalysis.particulado.pm25,
                  pm10: sensorAnalysis.particulado.pm10,
                } : {
                  pm25: { unit: 'µg/m³', label: 'PM2.5', available: false, points: [], latestValue: null, latestLabel: null, min: null, max: null },
                  pm10: { unit: 'µg/m³', label: 'PM10', available: false, points: [], latestValue: null, latestLabel: null, min: null, max: null },
                }}
              />

              {/* Pressão atmosférica — BMP180 */}
              <SensorReadingSection
                title="Pressão atmosférica"
                componente="BMP180 · Barométrico"
                color="#00695C"
                loading={leitStatus === 'loading'}
                error={leitStatus === 'error' ? (leitError ?? 'Erro ao carregar leituras.') : null}
                seriesMap={leitStatus === 'success' ? {
                  pressao: sensorAnalysis.pressao,
                } : {
                  pressao: { unit: 'hPa', label: 'Pressão atmosférica', available: false, points: [], latestValue: null, latestLabel: null, min: null, max: null },
                }}
              />

              {/* Inclinação e vibração — MPU6050 */}
              <SensorReadingSection
                title="Movimento físico"
                componente="MPU6050 · Acelerômetro / Giroscópio"
                color="#BF360C"
                loading={leitStatus === 'loading'}
                error={leitStatus === 'error' ? (leitError ?? 'Erro ao carregar leituras.') : null}
                seriesMap={leitStatus === 'success' ? {
                  inclinacao: sensorAnalysis.movimento.inclinacao,
                  vibracao: sensorAnalysis.movimento.vibracao,
                } : {
                  inclinacao: { unit: '°', label: 'Inclinação', available: false, points: [], latestValue: null, latestLabel: null, min: null, max: null },
                  vibracao: { unit: 'índice', label: 'Vibração', available: false, points: [], latestValue: null, latestLabel: null, min: null, max: null },
                }}
              />

              {/* Reading summary footer */}
              {leitStatus === 'success' && sensorAnalysis.totalLeituras > 0 ? (
                <Card style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>Resumo das leituras</Text>
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryValue}>{sensorAnalysis.totalLeituras}</Text>
                      <Text style={styles.summaryLabel}>Leituras IoT</Text>
                    </View>
                    {sensorAnalysis.rangeLabel ? (
                      <View style={styles.summaryItemWide}>
                        <Text style={styles.summaryValue}>{sensorAnalysis.rangeLabel}</Text>
                        <Text style={styles.summaryLabel}>Intervalo de dados</Text>
                      </View>
                    ) : null}
                  </View>
                </Card>
              ) : null}
            </>
          ) : null}
        </>
      ) : null}

      {/* Padding at bottom */}
      <View style={styles.bottomPad} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  pageHeader: {
    marginBottom: Spacing.lg,
  },
  pageTitle: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    lineHeight: 20,
  },
  regionLoading: {
    marginBottom: Spacing.md,
  },
  regionLoadingText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  callout: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.primary + '44',
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  calloutTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  calloutText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    lineHeight: 20,
  },
  sectionHeader: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
    lineHeight: 18,
  },
  rankingList: {
    rowGap: 0,
  },
  summaryCard: {
    marginBottom: Spacing.md,
  },
  summaryTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: Spacing.lg,
    rowGap: Spacing.sm,
  },
  summaryItem: {
    alignItems: 'flex-start',
  },
  summaryItemWide: {
    flex: 1,
    alignItems: 'flex-start',
  },
  summaryValue: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  summaryLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 1,
  },
  bottomPad: {
    height: Spacing.xl,
  },
});
