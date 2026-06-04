import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { AppCard } from '@/components/AppCard';
import { AppShell } from '@/components/AppShell';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { MetricCard } from '@/components/MetricCard';
import { RiskBadge } from '@/components/RiskBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import {
  getEstacoesByRegiao,
  getLeiturasByRegiao,
  getRegiaoById,
  getRegioes,
  getRiscoAtualByRegiao,
} from '@/services/regioesService';
import { screenStyles } from '@/styles/global';
import { EstacaoReadModel } from '@/types/estacao';
import { LeituraReadModel } from '@/types/leitura';
import { RegiaoReadModel } from '@/types/regiao';
import { RiscoAtualReadModel } from '@/types/risco';
import { getApiErrorMessage } from '@/utils/apiError';
import { formatDate } from '@/utils/formatDate';
import { useResponsiveLayout } from '@/utils/responsive';

type SectionErrors = { regiao?: string; risco?: string; estacoes?: string; leituras?: string };

export default function RegiaoDetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [regiao, setRegiao]   = useState<RegiaoReadModel | null>(null);
  const [risco, setRisco]     = useState<RiscoAtualReadModel | null>(null);
  const [estacoes, setEstacoes] = useState<EstacaoReadModel[]>([]);
  const [leituras, setLeituras] = useState<LeituraReadModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sectionErrors, setSectionErrors] = useState<SectionErrors>({});
  const { isDesktop } = useResponsiveLayout();

  const latest = leituras[0];
  const effectiveRisk = risco?.nivel ?? regiao?.riscoNivel;

  const readingMetrics = useMemo(() => [
    { label: 'Temperatura', value: fmtNum(latest?.temperatura, '°C'), icon: '☀' },
    { label: 'Umidade',     value: fmtNum(latest?.umidade, '%'),       icon: '💧' },
    { label: 'Índice UV',   value: fmtNum(latest?.indiceUv),           icon: '⚡' },
    { label: 'Chuva',       value: fmtNum(latest?.chuva, 'mm'),        icon: '🌧' },
  ], [latest]);

  const loadDetails = useCallback(async () => {
    if (!id) { setIsLoading(false); setErrorMessage('ID da região não informado.'); return; }

    setIsLoading(true);
    setErrorMessage(null);
    setSectionErrors({});

    const nextErrors: SectionErrors = {};
    let regiaoData: RegiaoReadModel | null = null;

    try {
      regiaoData = await getRegiaoById(id);
    } catch (e) {
      nextErrors.regiao = getApiErrorMessage(e);
      try {
        const all = await getRegioes();
        regiaoData = all.find((r) => String(r.id) === String(id)) ?? null;
      } catch { regiaoData = null; }
    }

    const [riscoR, estacoesR, leiturasR] = await Promise.allSettled([
      getRiscoAtualByRegiao(id),
      getEstacoesByRegiao(id),
      getLeiturasByRegiao(id),
    ]);

    if (riscoR.status === 'fulfilled')   { setRisco(riscoR.value); }
    else { setRisco(null); nextErrors.risco = getApiErrorMessage(riscoR.reason); }

    if (estacoesR.status === 'fulfilled') { setEstacoes(estacoesR.value); }
    else { setEstacoes([]); nextErrors.estacoes = getApiErrorMessage(estacoesR.reason); }

    if (leiturasR.status === 'fulfilled') { setLeituras(leiturasR.value); }
    else { setLeituras([]); nextErrors.leituras = getApiErrorMessage(leiturasR.reason); }

    setRegiao(regiaoData);
    setSectionErrors(nextErrors);
    setIsLoading(false);
  }, [id]);

  useEffect(() => { void loadDetails(); }, [loadDetails]);

  return (
    <AppShell activeRoute="regioes">
      <SafeAreaView style={screenStyles.safeArea}>
        <ScrollView
          contentContainerStyle={[
            screenStyles.scrollContent,
            isDesktop && screenStyles.desktopScrollContent,
          ]}>

          {isLoading ? <LoadingState message="Carregando dados da região..." /> : null}
          {errorMessage ? <ErrorState message={errorMessage} onRetry={loadDetails} /> : null}

          {!isLoading && !errorMessage ? (
            <>
              {/* ── Region header ─────────────────────────── */}
              <View style={[styles.regionHead, isDesktop && styles.regionHeadDesktop]}>
                <View style={styles.regionHeadLeft}>
                  <Text style={styles.regionName}>{regiao?.nome ?? `Região ${id ?? ''}`}</Text>
                  <Text style={styles.regionMeta}>
                    {[regiao?.cidade, regiao?.estado].filter(Boolean).join(' / ') || 'Localização não informada'}
                    {regiao?.tipoCliente ? ` · ${regiao.tipoCliente}` : ''}
                  </Text>
                  {sectionErrors.regiao ? (
                    <Text style={styles.warnText}>Dados parciais (fallback ativo)</Text>
                  ) : null}
                </View>
                <View style={styles.regionHeadRight}>
                  {effectiveRisk ? <RiskBadge nivel={effectiveRisk} /> : null}
                  {regiao?.ativo !== undefined ? (
                    <StatusBadge status={regiao.ativo ? 'Ativo' : 'Inativo'} />
                  ) : null}
                </View>
              </View>

              {/* ── Top metric cards ─────────────────────── */}
              <View style={[styles.topMetrics, isDesktop && styles.topMetricsDesktop]}>
                <MetricCard
                  label="Risco atual"
                  value={effectiveRisk ?? '—'}
                  supportingText={risco?.score !== undefined ? `Score: ${risco.score}` : 'Nível consolidado'}
                  accentColor={riskColor(effectiveRisk)}
                  icon="⚠"
                  style={[styles.metric, isDesktop && styles.metricDesktop]}
                />
                <MetricCard
                  label="Alertas ativos"
                  value={regiao?.alertasAtivos !== undefined ? String(regiao.alertasAtivos) : '—'}
                  supportingText="Ocorrências pendentes"
                  accentColor="#EF6C00"
                  icon="△"
                  style={[styles.metric, isDesktop && styles.metricDesktop]}
                />
                <MetricCard
                  label="Estações ativas"
                  value={`${estacoes.filter((e) => e.ativa !== false).length}/${estacoes.length}`}
                  supportingText="Sensores vinculados"
                  accentColor="#009688"
                  icon="●"
                  style={[styles.metric, isDesktop && styles.metricDesktop]}
                />
                <MetricCard
                  label="Última leitura"
                  value={latest ? 'Disponível' : '—'}
                  supportingText={latest ? formatDate(latest.dataHora) : 'Sem dados recentes'}
                  accentColor="#3F51B5"
                  icon="◎"
                  style={[styles.metric, isDesktop && styles.metricDesktop]}
                />
              </View>

              {/* ── Mid row ──────────────────────────────── */}
              <View style={[styles.midRow, isDesktop && styles.midRowDesktop]}>

                {/* Risk analysis */}
                <AppCard
                  title="Análise de Risco"
                  subtitle="Consolidado ambiental para esta região."
                  variant="elevated"
                  style={[styles.panel, isDesktop && styles.panelLeft]}>
                  {sectionErrors.risco ? (
                    <ErrorState message={sectionErrors.risco} onRetry={loadDetails} />
                  ) : risco || effectiveRisk ? (
                    <View style={styles.riskBlock}>
                      {effectiveRisk ? <RiskBadge nivel={effectiveRisk} /> : null}
                      {risco?.score !== undefined ? (
                        <View style={styles.scoreRow}>
                          <Text style={styles.scoreLabel}>Score consolidado</Text>
                          <Text style={styles.scoreValue}>{risco.score}</Text>
                        </View>
                      ) : null}
                      {risco?.descricao ? (
                        <Text style={styles.riskDesc}>{risco.descricao}</Text>
                      ) : null}
                      <Text style={styles.riskMeta}>
                        Atualizado: {formatDate(risco?.atualizadoEm)}
                      </Text>
                    </View>
                  ) : (
                    <EmptyState title="Risco não informado" description="Nenhum risco atual encontrado." />
                  )}
                </AppCard>

                {/* Leituras */}
                <AppCard
                  title="Leituras Ambientais"
                  subtitle="Última leitura disponível das estações."
                  variant="elevated"
                  style={[styles.panel, isDesktop && styles.panelRight]}>
                  {sectionErrors.leituras ? (
                    <ErrorState message={sectionErrors.leituras} onRetry={loadDetails} />
                  ) : latest ? (
                    <View style={[styles.readingGrid, isDesktop && styles.readingGridDesktop]}>
                      {readingMetrics.map((m) => (
                        <View key={m.label} style={styles.readingItem}>
                          <Text style={styles.readingIcon}>{m.icon}</Text>
                          <Text style={styles.readingValue}>{m.value}</Text>
                          <Text style={styles.readingLabel}>{m.label}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <EmptyState title="Sem leituras" description="Nenhuma leitura recente encontrada." />
                  )}
                </AppCard>

              </View>

              {/* ── Bottom row ────────────────────────────── */}
              <View style={[styles.midRow, isDesktop && styles.midRowDesktop]}>

                {/* Stations table */}
                <AppCard
                  title="Status das Estações"
                  subtitle="Estações IoT vinculadas a esta região."
                  variant="elevated"
                  style={[styles.panel, isDesktop && styles.panelLeft]}>
                  {sectionErrors.estacoes ? (
                    <ErrorState message={sectionErrors.estacoes} onRetry={loadDetails} />
                  ) : estacoes.length > 0 ? (
                    <View style={styles.stationTable}>
                      {isDesktop ? (
                        <View style={styles.stHead}>
                          <Text style={[styles.stTh, styles.stColId]}>ID</Text>
                          <Text style={[styles.stTh, styles.stColNome]}>NOME DA ESTAÇÃO</Text>
                          <Text style={[styles.stTh, styles.stColStatus]}>STATUS</Text>
                          <Text style={[styles.stTh, styles.stColSync]}>ÚLTIMA SYNC</Text>
                        </View>
                      ) : null}
                      {estacoes.map((estacao) => (
                        <View key={String(estacao.id)} style={styles.stRow}>
                          <Text style={[styles.stCell, styles.stColId]}>{estacao.codigo ?? String(estacao.id).slice(0, 8)}</Text>
                          <Text style={[styles.stCell, styles.stColNome, styles.stNome]}>{estacao.nome}</Text>
                          <View style={styles.stColStatus}>
                            <StatusBadge status={estacao.ativa === false ? 'Inativo' : 'Ativo'} />
                          </View>
                          <Text style={[styles.stCell, styles.stColSync]}>{formatDate(estacao.ultimaLeituraEm)}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <EmptyState title="Nenhuma estação" description="Nenhuma estação vinculada a esta região." />
                  )}
                </AppCard>

                {/* Alerts shortcut */}
                <AppCard
                  title="Logs de Alerta"
                  subtitle="Acesse o console de alertas desta região."
                  variant="elevated"
                  style={[styles.panel, isDesktop && styles.panelSide]}>
                  <View style={styles.alertShortcut}>
                    <Text style={styles.shortcutText}>
                      Visualize e gerencie os alertas ambientais ativos e históricos desta região no console de alertas.
                    </Text>
                    <AppButton label="Ver Alertas" href="/alertas" />
                  </View>
                </AppCard>

              </View>
            </>
          ) : null}

        </ScrollView>
      </SafeAreaView>
    </AppShell>
  );
}

function fmtNum(v?: number, suffix = ''): string {
  return v === undefined ? '—' : `${v}${suffix}`;
}

function riskColor(nivel?: string): string {
  if (nivel === 'CRITICO')  return '#D32F2F';
  if (nivel === 'ALTO')     return '#EF6C00';
  if (nivel === 'MODERADO') return '#F9A825';
  return '#3F51B5';
}

const styles = StyleSheet.create({
  regionHead: { gap: spacing.sm },
  regionHeadDesktop: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  regionHeadLeft: { flex: 1, gap: 2 },
  regionHeadRight: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  regionName: { color: colors.neutralText, fontSize: 24, fontWeight: '700' },
  regionMeta: { color: colors.mutedText, fontSize: 14, lineHeight: 20 },
  warnText: { color: '#EF6C00', fontSize: 12, fontWeight: '600' },

  topMetrics: { gap: spacing.sm },
  topMetricsDesktop: { flexDirection: 'row', gap: spacing.md },
  metric: { flex: 1 },
  metricDesktop: { flexBasis: '22%', flexGrow: 1 },

  midRow: { gap: spacing.md },
  midRowDesktop: { alignItems: 'flex-start', flexDirection: 'row' },
  panel: { flex: 1 },
  panelLeft: { flexBasis: '60%', flexGrow: 1 },
  panelRight: { flexBasis: '36%', flexGrow: 1 },
  panelSide: { flexBasis: '36%', flexGrow: 1 },

  riskBlock: { gap: 10 },
  scoreRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between' },
  scoreLabel: { color: colors.mutedText, fontSize: 13 },
  scoreValue: { color: colors.neutralText, fontSize: 24, fontWeight: '700' },
  riskDesc: { color: colors.mutedText, fontSize: 13, lineHeight: 18 },
  riskMeta: { color: colors.mutedText, fontSize: 12 },

  readingGrid: { gap: spacing.sm },
  readingGridDesktop: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  readingItem: { alignItems: 'center', flex: 1, gap: 3, minWidth: 80 },
  readingIcon: { fontSize: 20 },
  readingValue: { color: colors.neutralText, fontSize: 18, fontWeight: '700' },
  readingLabel: { color: colors.mutedText, fontSize: 11, textAlign: 'center' },

  stationTable: { gap: 0 },
  stHead: {
    backgroundColor: '#F8F9FB',
    borderBottomColor: '#DDE1EA',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingVertical: 8,
  },
  stTh: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, paddingHorizontal: 6 },
  stRow: {
    alignItems: 'center',
    borderBottomColor: '#EEF0F4',
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 44,
    paddingVertical: 6,
  },
  stCell: { color: colors.mutedText, fontSize: 13, paddingHorizontal: 6 },
  stNome: { color: colors.neutralText, fontWeight: '600' },
  stColId:     { width: 90 },
  stColNome:   { flex: 1 },
  stColStatus: { width: 80 },
  stColSync:   { width: 110 },

  alertShortcut: { gap: spacing.md },
  shortcutText: { color: colors.mutedText, fontSize: 13, lineHeight: 19 },
});
