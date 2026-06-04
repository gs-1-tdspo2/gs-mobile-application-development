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
  const [error, setError] = useState<string | null>(null);
  const { isDesktop } = useResponsiveLayout();

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getDashboardSummary();
      setSummary(data);
    } catch (e) {
      setSummary(null);
      setError(getApiErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  return (
    <AppShell activeRoute="dashboard">
      <SafeAreaView style={screenStyles.safeArea}>
        <ScrollView
          contentContainerStyle={[
            screenStyles.scrollContent,
            isDesktop && screenStyles.desktopScrollContent,
          ]}>

          {/* ── Page header ─────────────────────────── */}
          <View style={styles.pageHead}>
            <View>
              <Text style={styles.eyebrow}>PAINEL OPERACIONAL</Text>
              <Text style={styles.title}>Dashboard Operacional</Text>
              <Text style={styles.subtitle}>Monitoramento climático e ambiental das regiões vulneráveis</Text>
            </View>
            {summary?.atualizadoEm ? (
              <View style={styles.updatedChip}>
                <Text style={styles.updatedText}>Atualizado {fmtTime(summary.atualizadoEm)}</Text>
              </View>
            ) : null}
          </View>

          {/* ── Metrics row ──────────────────────────── */}
          {isLoading ? (
            <LoadingState message="Carregando indicadores..." />
          ) : (
            <View style={[styles.metricsRow, isDesktop && styles.metricsRowDesktop]}>
              <MetricCard
                label="Regiões monitoradas"
                value={fmt(summary?.totalRegioes)}
                supportingText="Áreas ativas"
                accentColor="#3F51B5"
                icon="◎"
                style={[styles.metric, isDesktop && styles.metricDesktop]}
              />
              <MetricCard
                label="Estações ativas"
                value={fmt(summary?.totalEstacoesAtivas)}
                supportingText="Sensores em operação"
                accentColor="#009688"
                icon="●"
                style={[styles.metric, isDesktop && styles.metricDesktop]}
              />
              <MetricCard
                label="Alertas ativos"
                value={fmt(summary?.alertasAtivos)}
                supportingText="Aguardando ação"
                accentColor="#EF6C00"
                icon="△"
                style={[styles.metric, isDesktop && styles.metricDesktop]}
              />
              <MetricCard
                label="Alertas críticos"
                value={fmt(summary?.alertasCriticos)}
                supportingText="Prioridade imediata"
                accentColor="#D32F2F"
                icon="!"
                style={[styles.metric, isDesktop && styles.metricDesktop]}
              />
              <MetricCard
                label="Leituras válidas"
                value={fmt(summary?.leiturasValidas)}
                supportingText="Amostras aceitas"
                accentColor="#2E7D32"
                icon="✓"
                style={[styles.metric, isDesktop && styles.metricDesktop]}
              />
              <MetricCard
                label="Maior risco atual"
                value={summary?.maiorRiscoAtual ?? '—'}
                supportingText="Nível consolidado"
                accentColor={riskAccent(summary?.maiorRiscoAtual)}
                icon="⚠"
                style={[styles.metric, isDesktop && styles.metricDesktop]}
              />
            </View>
          )}

          {/* ── Error (only when summary absent) ────── */}
          {error && !summary ? (
            <ErrorState message={error} onRetry={load} />
          ) : null}

          {/* ── Dashboard panels ────────────────────── */}
          {!isLoading ? (
            <View style={[styles.panels, isDesktop && styles.panelsDesktop]}>

              {/* Panorama */}
              <AppCard
                title="Panorama Regional"
                subtitle="Distribuição por severidade e cobertura operacional."
                variant="elevated"
                style={[styles.panel, isDesktop && styles.panelHalf]}>
                <View style={styles.table}>
                  <TableRow label="Maior risco atual">
                    {summary?.maiorRiscoAtual
                      ? <RiskBadge nivel={summary.maiorRiscoAtual} />
                      : <Text style={styles.dash}>—</Text>}
                  </TableRow>
                  <TableRow label="Regiões em risco alto/crítico" value={fmt(summary?.regioesComRiscoAltoOuCritico)} />
                  <TableRow label="Observações climáticas"        value={fmt(summary?.observacoesClimaticas)} />
                  <TableRow label="Avaliações de risco"           value={fmt(summary?.avaliacoesRisco)} />
                  <TableRow label="Clientes ativos"               value={fmt(summary?.totalClientesAtivos)} />
                </View>
              </AppCard>

              {/* Alertas */}
              <AppCard
                title="Alertas e Resposta"
                subtitle="Priorização de ocorrências para equipes institucionais."
                variant="elevated"
                style={[styles.panel, isDesktop && styles.panelHalf]}>
                <View style={styles.table}>
                  <TableRow label="Total ativos"  value={fmt(summary?.alertasAtivos)}   highlight />
                  <TableRow label="Críticos"       value={fmt(summary?.alertasCriticos)} danger />
                  <TableRow label="Altos"          value={fmt(summary?.alertasAltos)}    highlight />
                  <TableRow label="Resolvidos"     value={fmt(summary?.alertasResolvidos)} />
                </View>
              </AppCard>

              {/* Ações rápidas */}
              <AppCard
                title="Ações Rápidas"
                subtitle="Fluxos principais da operação."
                variant="elevated"
                style={[styles.panel, isDesktop && styles.panelHalf]}>
                <View style={styles.actionGrid}>
                  <ActionTile href="/regioes"           title="Regiões"          sub="Monitoramento" />
                  <ActionTile href="/gerenciar-regioes" title="Gerenciar Regiões" sub="CRUD operacional" />
                  <ActionTile href="/alertas"           title="Alertas"          sub="Resolver ocorrências" />
                  <ActionTile href="/indicadores"       title="Indicadores"      sub="Rankings e analytics" />
                </View>
              </AppCard>

              {/* Log */}
              <AppCard
                title="Log Operacional"
                subtitle="Atividade recente do sistema."
                variant="elevated"
                style={[styles.panel, isDesktop && styles.panelHalf]}>
                <View style={styles.logList}>
                  <LogRow dot="#3F51B5" title="Monitoramento ativo"
                    detail="Indicadores consolidados para leitura rápida da operação." />
                  <LogRow dot="#EF6C00" title="Prioridade operacional"
                    detail="Alertas críticos e altos orientam a resposta das equipes." />
                  <LogRow dot="#2E7D32" title="Base regional"
                    detail="Regiões e estações mantêm a visão territorial do risco." />
                </View>
              </AppCard>

            </View>
          ) : null}

        </ScrollView>
      </SafeAreaView>
    </AppShell>
  );
}

/* ── Helpers ──────────────────────────────────────────── */

function fmt(v?: number | null): string {
  return v === undefined || v === null ? '—' : String(v);
}

function riskAccent(nivel?: string): string {
  if (nivel === 'CRITICO')  return '#D32F2F';
  if (nivel === 'ALTO')     return '#EF6C00';
  if (nivel === 'MODERADO') return '#F9A825';
  return '#3F51B5';
}

function fmtTime(ts: string): string {
  try {
    return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch { return '—'; }
}

/* ── Sub-components ───────────────────────────────────── */

function TableRow({
  label, value, highlight, danger, children,
}: {
  label: string; value?: string; highlight?: boolean; danger?: boolean; children?: React.ReactNode;
}) {
  return (
    <View style={tbl.row}>
      <Text style={tbl.label}>{label}</Text>
      {children ?? (
        <Text style={[tbl.value, highlight && tbl.hi, danger && tbl.err]}>
          {value ?? '—'}
        </Text>
      )}
    </View>
  );
}

const tbl = StyleSheet.create({
  row: {
    alignItems: 'center', borderBottomColor: '#EEF0F4', borderBottomWidth: 1,
    flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between', paddingVertical: 8,
  },
  label: { color: colors.mutedText, flex: 1, fontSize: 13 },
  value: { color: colors.neutralText, fontSize: 13, fontWeight: '600' },
  hi: { color: '#EF6C00' },
  err: { color: '#D32F2F' },
});

function ActionTile({ href, title, sub }: { href: Href; title: string; sub: string }) {
  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="link"
        style={({ hovered, pressed }) => [
          act.tile,
          hovered && act.hover,
          pressed && act.pressed,
        ]}>
        <Text style={act.title}>{title}</Text>
        <Text style={act.sub}>{sub}</Text>
        <Text style={act.arrow}>Ver →</Text>
      </Pressable>
    </Link>
  );
}

const act = StyleSheet.create({
  tile: {
    backgroundColor: '#F4F5FF',
    borderColor: '#C5CAE9',
    borderRadius: 6,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    gap: 2,
    minWidth: 140,
    padding: 12,
  },
  hover: { backgroundColor: '#E8EAF6', borderColor: '#9FA8DA',
    boxShadow: '0 2px 6px rgba(63,81,181,0.15)' },
  pressed: { opacity: 0.85, transform: [{ translateY: 1 }] },
  title: { color: colors.neutralText, fontSize: 13, fontWeight: '700' },
  sub: { color: colors.mutedText, fontSize: 11 },
  arrow: { color: '#3F51B5', fontSize: 11, fontWeight: '700', marginTop: 6 },
});

function LogRow({ dot, title, detail }: { dot: string; title: string; detail: string }) {
  return (
    <View style={log.row}>
      <View style={[log.dot, { backgroundColor: dot }]} />
      <View style={log.text}>
        <Text style={log.title}>{title}</Text>
        <Text style={log.detail}>{detail}</Text>
      </View>
    </View>
  );
}

const log = StyleSheet.create({
  row: { alignItems: 'flex-start', flexDirection: 'row', gap: 10 },
  dot: { borderRadius: 99, height: 7, marginTop: 5, width: 7 },
  text: { flex: 1 },
  title: { color: colors.neutralText, fontSize: 13, fontWeight: '600' },
  detail: { color: colors.mutedText, fontSize: 12, lineHeight: 17, marginTop: 1 },
});

/* ── Screen layout ────────────────────────────────────── */

const styles = StyleSheet.create({
  pageHead: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  eyebrow: {
    color: colors.primary500,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: { color: colors.neutralText, fontSize: 22, fontWeight: '700' },
  subtitle: { color: colors.mutedText, fontSize: 13, lineHeight: 19, marginTop: 2 },
  updatedChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderRadius: 99,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  updatedText: { color: '#166534', fontSize: 11, fontWeight: '600' },

  metricsRow: { gap: spacing.sm },
  metricsRowDesktop: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  metric: { flex: 1 },
  metricDesktop: { flexBasis: '30%', flexGrow: 1, minWidth: 180 },

  panels: { gap: spacing.md },
  panelsDesktop: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  panel: { flex: 1 },
  panelHalf: { flexBasis: '48%', flexGrow: 1, minWidth: 280 },
  table: {},
  dash: { color: colors.mutedText, fontSize: 13 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  logList: { gap: 12 },
});
