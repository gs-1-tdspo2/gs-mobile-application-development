import { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEstacoes } from '@hooks/useEstacoes';
import { useLeituras } from '@hooks/useLeituras';
import { usePolling } from '@hooks/usePolling';
import { LoadingState } from '@components/ui/LoadingState';
import { ErrorState } from '@components/ui/ErrorState';
import { SensorReadingSection, SensorHistoryCard } from '@components/charts';
import { ObservacaoClimaticaCard } from '@components/clima';
import { Colors } from '@constants/colors';
import { FontSize, Spacing, Radius, Shadow } from '@constants/design';
import { StatusEstacaoLabels, TipoEstacaoLabels } from '@constants/enums';
import type { StatusEstacao } from '@constants/enums';
import { extractSensorAnalysis } from '@utils/sensorTransforms';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<StatusEstacao, string> = {
  ATIVA:      '#2E7D32',
  INATIVA:    '#757575',
  MANUTENCAO: '#EF6C00',
  FALHA:      '#D32F2F',
  SEM_COM:    '#F9A825',
};

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function EstacaoDetalheScreen() {
  const { id, idRegiao } = useLocalSearchParams<{ id: string; idRegiao: string }>();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  const idEstacaoNum = id     ? Number(id)      : null;
  const idRegiaoNum  = idRegiao ? Number(idRegiao) : null;

  const { data: estacoes, status: estStatus, load: loadEstacoes } = useEstacoes(idRegiaoNum);
  const { data: leituras, status: leitStatus, errorMessage: leitError, load: loadLeituras } =
    useLeituras(idRegiaoNum);

  const estacao = useMemo(() =>
    estacoes.find(e => e.idEstacao === idEstacaoNum) ?? null,
    [estacoes, idEstacaoNum],
  );

  // Only filter by idEstacao if the API actually includes that field in readings
  const hasIdEstacaoInLeituras = useMemo(() =>
    leituras.some(l => l.idEstacao != null),
    [leituras],
  );

  const stationLeituras = useMemo(() => {
    if (!idEstacaoNum || leituras.length === 0) return leituras;
    if (!hasIdEstacaoInLeituras) return leituras;
    const filtered = leituras.filter(l => l.idEstacao === idEstacaoNum);
    return filtered.length > 0 ? filtered : leituras;
  }, [leituras, idEstacaoNum, hasIdEstacaoInLeituras]);

  const isRegionFallback = useMemo(() => {
    if (!idEstacaoNum || !hasIdEstacaoInLeituras || leituras.length === 0) return false;
    return leituras.filter(l => l.idEstacao === idEstacaoNum).length === 0;
  }, [leituras, idEstacaoNum, hasIdEstacaoInLeituras]);

  const analysis = useMemo(() => extractSensorAnalysis(stationLeituras), [stationLeituras]);

  const loadAll = useCallback(() => {
    loadEstacoes();
    loadLeituras();
  }, [loadEstacoes, loadLeituras]);

  const pollAll = useCallback(() => {
    loadEstacoes({ silent: true });
    loadLeituras({ silent: true });
  }, [loadEstacoes, loadLeituras]);

  useFocusEffect(useCallback(() => { loadAll(); }, [loadAll]));
  usePolling(pollAll);

  // ── Guard: region ID required ────────────────────────────────────────────────

  if (!idRegiaoNum) {
    return (
      <View style={styles.root}>
        <View style={styles.centeredError}>
          <Ionicons name="warning-outline" size={40} color={Colors.textMuted} />
          <Text style={styles.centeredErrorTitle}>Região não identificada</Text>
          <Text style={styles.centeredErrorMsg}>
            Não foi possível identificar a região vinculada a esta estação.
          </Text>
        </View>
      </View>
    );
  }

  const isFirstLoad =
    (estStatus === 'loading' || estStatus === 'idle') && estacoes.length === 0;
  const isError =
    estStatus === 'error' && estacoes.length === 0;

  if (isFirstLoad) return <LoadingState message="Carregando dados da estação…" />;
  if (isError)     return <ErrorState message="Erro ao carregar a estação." onRetry={loadAll} />;

  const statusColor = estacao
    ? (STATUS_COLORS[estacao.statusEstacao] ?? Colors.textMuted)
    : Colors.textMuted;
  const hasLeituras = stationLeituras.length > 0;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: estacao?.nome ?? 'Estação' }} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Station header ─────────────────────────────── */}
        {estacao ? (
          <View style={[styles.headerCard, isDesktop && styles.headerCardDesktop]}>
            <Text style={styles.stationName}>{estacao.nome}</Text>
            <Text style={styles.stationCode}>{estacao.codigoEstacao}</Text>

            <View style={styles.badgeRow}>
              <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
                <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                  {StatusEstacaoLabels[estacao.statusEstacao] ?? estacao.statusEstacao}
                </Text>
              </View>
              <View style={styles.tipoBadge}>
                <Text style={styles.tipoBadgeText}>
                  {TipoEstacaoLabels[estacao.tipoEstacao] ?? estacao.tipoEstacao}
                </Text>
              </View>
              {estacao.statusEstacao === 'ATIVA' && (
                <View style={styles.livePill}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>Ao vivo</Text>
                </View>
              )}
            </View>

            <View style={styles.metaGrid}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Última comunicação</Text>
                <Text style={styles.metaValue}>{formatDate(estacao.dtUltimaComunicacao)}</Text>
              </View>
              {estacao.latitude != null && estacao.longitude != null && (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Coordenadas</Text>
                  <Text style={[styles.metaValue, styles.metaMono]}>
                    {Number(estacao.latitude).toFixed(5)}, {Number(estacao.longitude).toFixed(5)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          estStatus === 'success' && (
            <View style={styles.stationMissingBox}>
              <Ionicons name="radio-outline" size={20} color={Colors.textMuted} />
              <Text style={styles.stationMissingText}>
                Estação #{idEstacaoNum} não encontrada na região.
              </Text>
            </View>
          )
        )}

        {/* ── Condições meteorológicas da região ─────────── */}
        {idRegiaoNum && (
          <ObservacaoClimaticaCard
            idRegiao={idRegiaoNum}
            title="Condições meteorológicas da região vinculada"
          />
        )}

        {/* ── Live telemetry ─────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="pulse-outline" size={16} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Telemetria em tempo real</Text>
          </View>

          {(leitStatus === 'loading' || leitStatus === 'idle') && leituras.length === 0 && (
            <View style={styles.inlineLoading}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.inlineLoadingText}>Carregando leituras…</Text>
            </View>
          )}

          {leitStatus === 'error' && leituras.length === 0 && (
            <Text style={styles.inlineErrorText}>
              {leitError ?? 'Erro ao carregar leituras de sensores.'}
            </Text>
          )}

          {leitStatus === 'success' && !hasLeituras && (
            <Text style={styles.emptyText}>
              Nenhuma leitura encontrada para esta estação.
            </Text>
          )}

          {/* Region-level fallback disclosure */}
          {hasLeituras && isRegionFallback && (
            <View style={styles.disclosureBox}>
              <Ionicons name="information-circle-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.disclosureText}>
                A API retorna leituras por região. Não foi possível isolar completamente esta estação.
              </Text>
            </View>
          )}

          {hasLeituras && analysis.rangeLabel && (
            <Text style={styles.rangeText}>
              {analysis.totalLeituras} {analysis.totalLeituras === 1 ? 'leitura' : 'leituras'} · {analysis.rangeLabel}
            </Text>
          )}

          {hasLeituras && (
            <>
              <SensorReadingSection
                title="Nível de água"
                componente="HC-SR04"
                color="#1565C0"
                seriesMap={{
                  distancia: analysis.agua.distancia,
                  nivel: analysis.agua.nivel,
                }}
              />
              <SensorReadingSection
                title="Qualidade do ar"
                componente="Potenciômetro (sim. PMS5003)"
                color="#6A1B9A"
                seriesMap={{
                  pm25: analysis.particulado.pm25,
                  pm10: analysis.particulado.pm10,
                }}
              />
              <SensorReadingSection
                title="Pressão atmosférica"
                componente="BMP180"
                color="#00695C"
                seriesMap={{ pressao: analysis.pressao }}
              />
              <SensorReadingSection
                title="Inclinação e vibração"
                componente="MPU6050"
                color="#BF360C"
                seriesMap={{
                  inclinacao: analysis.movimento.inclinacao,
                  vibracao: analysis.movimento.vibracao,
                }}
              />
            </>
          )}
        </View>

        {/* ── Histórico dos sensores ─────────────────────── */}
        {hasLeituras && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="analytics-outline" size={16} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Histórico dos sensores</Text>
            </View>
            <View style={[styles.historyGrid, isDesktop && styles.historyGridDesktop]}>
              <View style={[isDesktop && styles.historyItem]}>
                <SensorHistoryCard
                  title="Nível de água"
                  sensorName="HC-SR04"
                  color="#1565C0"
                  leituras={stationLeituras}
                  primaryField="nivelAguaPercentual"
                  primaryLabel="Nível de água"
                  primaryUnit="%"
                  secondaryField="distanciaAguaCm"
                  secondaryLabel="Distância ao sensor"
                  secondaryUnit="cm"
                />
              </View>
              <View style={[isDesktop && styles.historyItem]}>
                <SensorHistoryCard
                  title="Qualidade do ar"
                  sensorName="PMS5003 / simulado"
                  color="#6A1B9A"
                  leituras={stationLeituras}
                  primaryField="pm25"
                  primaryLabel="PM2.5"
                  primaryUnit="µg/m³"
                  secondaryField="pm10"
                  secondaryLabel="PM10"
                  secondaryUnit="µg/m³"
                />
              </View>
              <View style={[isDesktop && styles.historyItem]}>
                <SensorHistoryCard
                  title="Pressão atmosférica"
                  sensorName="BMP180"
                  color="#00695C"
                  leituras={stationLeituras}
                  primaryField="pressaoHpa"
                  primaryLabel="Pressão"
                  primaryUnit="hPa"
                />
              </View>
              <View style={[isDesktop && styles.historyItem]}>
                <SensorHistoryCard
                  title="Movimento físico"
                  sensorName="MPU6050"
                  color="#BF360C"
                  leituras={stationLeituras}
                  primaryField="inclinacaoGraus"
                  primaryLabel="Inclinação"
                  primaryUnit="°"
                  secondaryField="vibracao"
                  secondaryLabel="Vibração"
                  secondaryUnit="índice"
                />
              </View>
            </View>
          </View>
        )}


        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: { flex: 1 },
  content: {
    padding: Spacing.md,
  },
  contentDesktop: {
    paddingHorizontal: Spacing.xl,
  },

  // Station header card
  headerCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  headerCardDesktop: {
    padding: Spacing.xl,
  },
  stationName: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 2,
    lineHeight: 26,
  },
  stationCode: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  statusBadgeText: { fontSize: FontSize.xs, fontWeight: '700' },
  tipoBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    backgroundColor: '#EEF0FB',
  },
  tipoBadgeText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.primary },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2E7D32' },
  liveText: { fontSize: FontSize.xs, fontWeight: '700', color: '#1B5E20' },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  metaItem: { minWidth: 140 },
  metaLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '500',
    marginBottom: 2,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.4,
  },
  metaValue: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: '600',
  },
  metaMono: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: FontSize.xs,
  },

  stationMissingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  stationMissingText: { fontSize: FontSize.sm, color: Colors.textMuted, flex: 1 },

  // Sections
  section: { marginBottom: Spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },


  // Telemetry states
  inlineLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  inlineLoadingText: { fontSize: FontSize.sm, color: Colors.textMuted },
  inlineErrorText: {
    fontSize: FontSize.sm,
    color: '#C62828',
    paddingVertical: Spacing.md,
    fontStyle: 'italic' as const,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontStyle: 'italic' as const,
    paddingVertical: Spacing.md,
    lineHeight: 18,
  },
  disclosureBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    backgroundColor: Colors.background,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  disclosureText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    flex: 1,
    lineHeight: 16,
  },
  rangeText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },

  // Centered error (no idRegiao)
  centeredError: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  centeredErrorTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  centeredErrorMsg: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },

  // History section
  historyGrid: {
    gap: Spacing.sm,
  },
  historyGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  historyItem: {
    flex: 1,
    minWidth: 300,
  },
});
