import { Href, Link } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppCard } from '@/components/AppCard';
import { AppShell } from '@/components/AppShell';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { MetricCard } from '@/components/MetricCard';
import { RiskBadge } from '@/components/RiskBadge';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { getDashboardSummary } from '@/services/dashboardService';
import { screenStyles } from '@/styles/global';
import { DashboardSummary } from '@/types/dashboard';
import { getApiErrorMessage } from '@/utils/apiError';
import { useResponsiveLayout } from '@/utils/responsive';

export default function HomeScreen() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { isDesktop } = useResponsiveLayout();

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await getDashboardSummary();
      setSummary(data);
      setErrorMessage(null);
    } catch (error) {
      setSummary(null);
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadDashboard);
  }, [loadDashboard]);

  return (
    <AppShell activeRoute="dashboard">
      <SafeAreaView style={screenStyles.safeArea}>
        <ScrollView
          contentContainerStyle={[
            screenStyles.scrollContent,
            isDesktop && screenStyles.desktopScrollContent,
          ]}>

          {/* ── Page header ─────────────────────────────── */}
          <View style={[styles.pageHeader, isDesktop && styles.pageHeaderDesktop]}>
            <View style={styles.pageHeaderText}>
              <Text style={styles.pageTitle}>Dashboard Operacional</Text>
              <Text style={styles.pageSubtitle}>
                Monitoramento climático e ambiental das regiões vulneráveis
              </Text>
            </View>

            <View style={styles.apiChip}>
              <View style={[styles.chipDot, errorMessage ? styles.chipDotError : null]} />
              <View>
                <Text style={styles.chipLabel}>
                  {errorMessage ? 'Sem conexão' : 'API Online'}
                </Text>
                {!errorMessage && summary?.atualizadoEm ? (
                  <Text style={styles.chipMeta}>
                    {formatTimestamp(summary.atualizadoEm)}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>

          {/* ── Loading ──────────────────────────────────── */}
          {isLoading ? <LoadingState message="Carregando resumo do monitoramento..." /> : null}

          {/* ── Metric grid ──────────────────────────────── */}
          <View style={[styles.metricsGrid, isDesktop && styles.metricsGridDesktop]}>
            <MetricCard
              label="Regiões monitoradas"
              value={fmt(summary?.totalRegioes)}
              supportingText="Áreas sob cobertura"
              accentColor={colors.primary500}
              style={[styles.metricItem, isDesktop && styles.metricItemDesktop]}
            />
            <MetricCard
              label="Estações ativas"
              value={fmt(summary?.totalEstacoesAtivas)}
              supportingText="Sensores em operação"
              accentColor={colors.teal}
              style={[styles.metricItem, isDesktop && styles.metricItemDesktop]}
            />
            <MetricCard
              label="Alertas ativos"
              value={fmt(summary?.alertasAtivos)}
              supportingText="Pendências de monitoramento"
              accentColor={colors.warningOrange}
              style={[styles.metricItem, isDesktop && styles.metricItemDesktop]}
            />
            <MetricCard
              label="Alertas críticos"
              value={fmt(summary?.alertasCriticos)}
              supportingText="Prioridade imediata"
              accentColor={colors.criticalRed}
              style={[styles.metricItem, isDesktop && styles.metricItemDesktop]}
            />
            <MetricCard
              label="Leituras válidas"
              value={fmt(summary?.leiturasValidas)}
              supportingText="Amostras aceitas"
              accentColor={colors.deepGreen}
              style={[styles.metricItem, isDesktop && styles.metricItemDesktop]}
            />
            <MetricCard
              label="Maior risco atual"
              value={summary?.maiorRiscoAtual ?? '-'}
              supportingText="Nível consolidado mais severo"
              accentColor={riskColor(summary?.maiorRiscoAtual)}
              style={[styles.metricItem, isDesktop && styles.metricItemDesktop]}
            />
          </View>

          {/* ── Error banner (only when summary missing) ── */}
          {errorMessage && !summary ? (
            <ErrorState
              message={errorMessage}
              onRetry={loadDashboard}
            />
          ) : null}

          {/* ── Dashboard panels ─────────────────────────── */}
          {!isLoading ? (
            <View style={[styles.panels, isDesktop && styles.panelsDesktop]}>

              <AppCard
                title="Panorama regional"
                subtitle="Distribuição por severidade e cobertura operacional."
                variant="elevated"
                style={[styles.panelItem, isDesktop && styles.panelItemDesktop]}>
                <View style={styles.rows}>
                  <Row label="Maior risco">
                    {summary?.maiorRiscoAtual ? (
                      <RiskBadge nivel={summary.maiorRiscoAtual} />
                    ) : (
                      <Text style={styles.rowVal}>—</Text>
                    )}
                  </Row>
                  <Row label="Regiões em risco" value={fmt(summary?.regioesComRiscoAltoOuCritico)} />
                  <Row label="Observações climáticas" value={fmt(summary?.observacoesClimaticas)} />
                  <Row label="Avaliações de risco" value={fmt(summary?.avaliacoesRisco)} />
                  <Row label="Clientes ativos" value={fmt(summary?.totalClientesAtivos)} />
                </View>
              </AppCard>

              <AppCard
                title="Alertas e resposta"
                subtitle="Priorização de ocorrências para equipes institucionais."
                variant="elevated"
                style={[styles.panelItem, isDesktop && styles.panelItemDesktop]}>
                <View style={styles.rows}>
                  <Row label="Ativos" value={fmt(summary?.alertasAtivos)} highlight />
                  <Row label="Críticos" value={fmt(summary?.alertasCriticos)} danger />
                  <Row label="Altos" value={fmt(summary?.alertasAltos)} highlight />
                  <Row label="Resolvidos" value={fmt(summary?.alertasResolvidos)} />
                </View>
              </AppCard>

              <AppCard
                title="Ações rápidas"
                subtitle="Fluxos principais da operação."
                variant="elevated"
                style={[styles.panelItem, isDesktop && styles.panelItemDesktop]}>
                <View style={styles.actionGrid}>
                  <ActionTile href="/regioes"           title="Regiões"     sub="Ver monitoramento" />
                  <ActionTile href="/gerenciar-regioes" title="Gerenciar"   sub="CRUD de regiões" />
                  <ActionTile href="/alertas"           title="Alertas"     sub="Resolver ocorrências" />
                  <ActionTile href="/indicadores"       title="Indicadores" sub="Ver rankings" />
                </View>
              </AppCard>

              <AppCard
                title="Atividade recente"
                subtitle="Sinais de acompanhamento para a operação."
                variant="elevated"
                style={[styles.panelItem, isDesktop && styles.panelItemDesktop]}>
                <View style={styles.activityList}>
                  <ActivityRow
                    title="Monitoramento ativo"
                    detail="Indicadores consolidados para leitura rápida da operação."
                  />
                  <ActivityRow
                    title="Prioridade operacional"
                    detail="Alertas críticos e altos orientam a resposta das equipes."
                  />
                  <ActivityRow
                    title="Base regional"
                    detail="Regiões e estações mantêm a visão territorial do risco."
                  />
                </View>
              </AppCard>

            </View>
          ) : null}

        </ScrollView>
      </SafeAreaView>
    </AppShell>
  );
}

/* ── Helpers ──────────────────────────────────────────────── */

function fmt(value?: number): string {
  return value === undefined || value === null ? '-' : String(value);
}

function riskColor(nivel?: string): string {
  if (nivel === 'CRITICO')  return colors.criticalRed;
  if (nivel === 'ALTO')     return colors.highRisk;
  if (nivel === 'MODERADO') return colors.warningOrange;
  if (nivel === 'BAIXO')    return colors.deepGreen;
  return colors.primary500;
}

function formatTimestamp(ts: string): string {
  try {
    const d = new Date(ts);
    return `Atualizado ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return 'Atualizado';
  }
}

/* ── Sub-components ───────────────────────────────────────── */

function Row({
  label,
  value,
  highlight = false,
  danger = false,
  children,
}: {
  label: string;
  value?: string;
  highlight?: boolean;
  danger?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      {children ?? (
        <Text
          style={[
            rowStyles.value,
            highlight && rowStyles.highlight,
            danger && rowStyles.danger,
          ]}>
          {value ?? '—'}
        </Text>
      )}
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    paddingVertical: 9,
  },
  label: { color: colors.mutedText, fontSize: 13 },
  value: { color: colors.neutralText, fontSize: 13, fontWeight: '700' },
  highlight: { color: colors.warningOrange },
  danger: { color: colors.criticalRed },
});

function ActionTile({ href, title, sub }: { href: Href; title: string; sub: string }) {
  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="link"
        style={({ hovered, pressed }) => [
          actionStyles.tile,
          hovered  && actionStyles.hover,
          pressed  && actionStyles.pressed,
        ]}>
        <Text style={actionStyles.title}>{title}</Text>
        <Text style={actionStyles.sub}>{sub}</Text>
        <Text style={actionStyles.arrow}>Abrir →</Text>
      </Pressable>
    </Link>
  );
}

const actionStyles = StyleSheet.create({
  tile: {
    backgroundColor: colors.primary50,
    borderColor: colors.primary100,
    borderRadius: 6,
    borderWidth: 1,
    boxShadow: '0px 1px 3px rgba(0,0,0,0.08)',
    flexBasis: '47%',
    flexGrow: 1,
    gap: 3,
    minWidth: 160,
    padding: 14,
  },
  hover: {
    backgroundColor: colors.primary100,
    borderColor: colors.primary200,
    boxShadow: '0px 2px 6px rgba(0,0,0,0.12)',
  },
  pressed: { opacity: 0.88, transform: [{ translateY: 1 }] },
  title: { color: colors.neutralText, fontSize: 14, fontWeight: '700' },
  sub: { color: colors.mutedText, fontSize: 12, marginTop: 1 },
  arrow: { color: colors.primary600, fontSize: 12, fontWeight: '700', marginTop: 6 },
});

function ActivityRow({ title, detail }: { title: string; detail: string }) {
  return (
    <View style={actStyles.item}>
      <View style={actStyles.dot} />
      <View style={actStyles.text}>
        <Text style={actStyles.title}>{title}</Text>
        <Text style={actStyles.detail}>{detail}</Text>
      </View>
    </View>
  );
}

const actStyles = StyleSheet.create({
  item: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm },
  dot: {
    backgroundColor: colors.primaryAccent,
    borderRadius: 99,
    height: 7,
    marginTop: 6,
    width: 7,
  },
  text: { flex: 1, gap: 2 },
  title: { color: colors.neutralText, fontSize: 13, fontWeight: '700' },
  detail: { color: colors.mutedText, fontSize: 12, lineHeight: 17 },
});

/* ── Screen styles ────────────────────────────────────────── */

const styles = StyleSheet.create({
  pageHeader: {
    gap: spacing.sm,
  },
  pageHeaderDesktop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pageHeaderText: { flex: 1, gap: 3 },
  pageTitle: {
    color: colors.neutralText,
    fontSize: 24,
    fontWeight: '700',
  },
  pageSubtitle: {
    color: colors.mutedText,
    fontSize: 14,
    lineHeight: 20,
  },

  apiChip: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 6,
    borderWidth: 1,
    boxShadow: '0px 1px 3px rgba(0,0,0,0.08)',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipDot: {
    backgroundColor: '#22c55e',
    borderRadius: 99,
    height: 8,
    width: 8,
  },
  chipDotError: {
    backgroundColor: colors.criticalRed,
  },
  chipLabel: {
    color: colors.neutralText,
    fontSize: 12,
    fontWeight: '700',
  },
  chipMeta: {
    color: colors.mutedText,
    fontSize: 11,
    marginTop: 1,
  },

  metricsGrid: {
    gap: spacing.sm,
  },
  metricsGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metricItem: {
    flex: 1,
  },
  metricItemDesktop: {
    flexBasis: '30%',
    flexGrow: 1,
    minWidth: 220,
  },

  panels: {
    gap: spacing.md,
  },
  panelsDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  panelItem: {
    flex: 1,
  },
  panelItemDesktop: {
    flexBasis: '48%',
    flexGrow: 1,
    minWidth: 300,
  },

  rows: { gap: 0 },

  rowVal: {
    color: colors.mutedText,
    fontSize: 13,
  },

  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },

  activityList: { gap: spacing.sm },
});
