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
          <View style={[styles.hero, isDesktop && styles.heroDesktop]}>
            <View style={styles.heroTop}>
              <View style={styles.heroCopy}>
                <Text style={styles.eyebrow}>Monitoramento climático e ambiental</Text>
                <Text style={styles.title}>Dashboard Operacional</Text>
                <Text style={styles.description}>
                  Visão executiva para acompanhar regiões vulneráveis, risco ambiental e alertas
                  prioritários consumidos pela API Java.
                </Text>
              </View>
              <View style={styles.apiChip}>
                <View style={styles.apiDot} />
                <View>
                  <Text style={styles.apiLabel}>API Render</Text>
                  <Text style={styles.apiValue}>{errorMessage ? 'Reconectar' : 'Operacional'}</Text>
                </View>
              </View>
            </View>
            <View style={styles.badges}>
              <RiskBadge nivel="BAIXO" />
              <RiskBadge nivel="MODERADO" />
              <RiskBadge nivel="ALTO" />
              <RiskBadge nivel="CRITICO" />
            </View>
          </View>

          {isLoading ? <LoadingState message="Carregando resumo do monitoramento..." /> : null}

          <View style={[styles.metricsGrid, isDesktop && styles.desktopGrid]}>
            <MetricCard
              label="Regiões monitoradas"
              value={formatMetric(summary?.totalRegioes)}
              supportingText="Total cadastrado na API"
              accentColor={colors.primary}
              style={isDesktop && styles.metricDesktopItem}
            />
            <MetricCard
              label="Estações ativas"
              value={formatMetric(getRawNumber(summary, ['estacoesAtivas', 'totalEstacoesAtivas']))}
              supportingText="Sensores em operação"
              accentColor={colors.primaryAccent}
              style={isDesktop && styles.metricDesktopItem}
            />
            <MetricCard
              label="Alertas ativos"
              value={formatMetric(summary?.alertasAtivos)}
              supportingText="Pendências de monitoramento"
              accentColor={colors.warningOrange}
              style={isDesktop && styles.metricDesktopItem}
            />
            <MetricCard
              label="Alertas críticos"
              value={formatMetric(summary?.alertasCriticos)}
              supportingText="Prioridade imediata"
              accentColor={colors.criticalRed}
              style={isDesktop && styles.metricDesktopItem}
            />
            <MetricCard
              label="Leituras válidas"
              value={formatMetric(getRawNumber(summary, ['leiturasValidas', 'totalLeiturasValidas']))}
              supportingText="Amostras aceitas"
              accentColor={colors.deepGreen}
              style={isDesktop && styles.metricDesktopItem}
            />
            <MetricCard
              label="Maior risco atual"
              value={summary?.maiorRiscoAtual ?? '-'}
              supportingText="Nível consolidado mais severo"
              accentColor={colors.highRisk}
              style={isDesktop && styles.metricDesktopItem}
            />
          </View>

          {errorMessage ? <ErrorState message={errorMessage} onRetry={loadDashboard} /> : null}

          <View style={[styles.dashboardGrid, isDesktop && styles.desktopGrid]}>
            <AppCard
              title="Panorama regional"
              subtitle="Distribuição rápida por severidade e cobertura operacional."
              variant="elevated"
              style={isDesktop && styles.dashboardPanel}>
              <View style={styles.panelRows}>
                <PanelRow label="Maior risco" value={summary?.maiorRiscoAtual ?? 'Indisponível'} />
                <PanelRow label="Regiões em risco crítico" value={formatMetric(getRawNumber(summary, ['regioesEmRiscoCritico']))} />
                <PanelRow label="Atualização" value={summary?.atualizadoEm ?? 'Aguardando API'} />
              </View>
            </AppCard>

            <AppCard
              title="Alertas e resposta"
              subtitle="Priorização de ocorrências para equipes institucionais."
              variant="elevated"
              style={isDesktop && styles.dashboardPanel}>
              <View style={styles.panelRows}>
                <PanelRow label="Alertas ativos" value={formatMetric(summary?.alertasAtivos)} highlight />
                <PanelRow label="Críticos" value={formatMetric(summary?.alertasCriticos)} danger />
                <PanelRow label="Resolvidos" value={formatMetric(getRawNumber(summary, ['totalAlertasResolvidos', 'alertasResolvidos']))} />
              </View>
            </AppCard>

            <AppCard
              title="Ações rápidas"
              subtitle="Fluxos principais para a demonstração."
              variant="elevated"
              style={isDesktop && styles.dashboardPanel}>
              <View style={styles.actionGrid}>
                <DashboardActionCard href="/regioes" title="Regiões" subtitle="Ver monitoramento" />
                <DashboardActionCard href="/gerenciar-regioes" title="Gerenciar" subtitle="CRUD de regiões" />
                <DashboardActionCard href="/alertas" title="Alertas" subtitle="Resolver ocorrências" />
                <DashboardActionCard href="/indicadores" title="Indicadores" subtitle="Ver rankings" />
              </View>
            </AppCard>

            <AppCard
              title="Atividade recente"
              subtitle="Notas operacionais para conduzir a leitura do dashboard."
              variant="elevated"
              style={isDesktop && styles.dashboardPanel}>
              <View style={styles.activityList}>
                <ActivityItem title="Monitoramento ativo" detail="Resumo, regiões e alertas usam dados da API." />
                <ActivityItem title="Render" detail="Primeira resposta pode levar alguns segundos." />
                <ActivityItem title="MVP escolar" detail="Sem autenticação, mapas ou bibliotecas pesadas." />
              </View>
            </AppCard>
          </View>
        </ScrollView>
      </SafeAreaView>
    </AppShell>
  );
}

function formatMetric(value?: number): string {
  return value === undefined ? '-' : String(value);
}

function getRawNumber(summary: DashboardSummary | null, keys: string[]): number | undefined {
  if (!summary?.raw) {
    return undefined;
  }

  for (const key of keys) {
    const value = summary.raw[key];
    if (typeof value === 'number') {
      return value;
    }
  }

  return undefined;
}

function PanelRow({
  label,
  value,
  highlight = false,
  danger = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  danger?: boolean;
}) {
  return (
    <View style={styles.panelRow}>
      <Text style={styles.panelLabel}>{label}</Text>
      <Text style={[styles.panelValue, highlight && styles.panelValueHighlight, danger && styles.panelValueDanger]}>
        {value}
      </Text>
    </View>
  );
}

function DashboardActionCard({ href, title, subtitle }: { href: Href; title: string; subtitle: string }) {
  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="link"
        style={({ hovered, pressed }) => [
          styles.actionTile,
          hovered && styles.actionTileHover,
          pressed && styles.actionTilePressed,
        ]}>
        <View>
          <Text style={styles.actionTileTitle}>{title}</Text>
          <Text style={styles.actionTileSubtitle}>{subtitle}</Text>
        </View>
        <Text style={styles.actionTileArrow}>Abrir</Text>
      </Pressable>
    </Link>
  );
}

function ActivityItem({ title, detail }: { title: string; detail: string }) {
  return (
    <View style={styles.activityItem}>
      <View style={styles.activityDot} />
      <View style={styles.activityText}>
        <Text style={styles.activityTitle}>{title}</Text>
        <Text style={styles.activityDetail}>{detail}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  heroDesktop: {
    padding: spacing.xl,
  },
  heroTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    justifyContent: 'space-between',
  },
  heroCopy: {
    flex: 1,
    minWidth: 280,
  },
  eyebrow: {
    color: colors.primaryLight,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.offWhite,
    fontSize: 34,
    fontWeight: '800',
  },
  description: {
    color: colors.offWhite,
    fontSize: 16,
    lineHeight: 24,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  apiChip: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF1A',
    borderColor: '#FFFFFF33',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  apiDot: {
    backgroundColor: '#22C55E',
    borderRadius: 999,
    height: 9,
    width: 9,
  },
  apiLabel: {
    color: colors.primaryLight,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  apiValue: {
    color: colors.offWhite,
    fontSize: 12,
    fontWeight: '700',
  },
  metricsGrid: {
    gap: spacing.sm,
  },
  dashboardGrid: {
    gap: spacing.md,
  },
  desktopGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metricDesktopItem: {
    flexGrow: 1,
    flexBasis: '23%',
    minWidth: 220,
  },
  dashboardPanel: {
    flexGrow: 1,
    flexBasis: '48%',
    minWidth: 280,
  },
  panelRows: {
    gap: spacing.xs,
  },
  panelRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  panelLabel: {
    color: colors.mutedText,
    fontSize: 14,
  },
  panelValue: {
    color: colors.neutralText,
    fontSize: 14,
    fontWeight: '800',
  },
  panelValueHighlight: {
    color: colors.warningOrange,
  },
  panelValueDanger: {
    color: colors.criticalRed,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionTile: {
    backgroundColor: colors.surfaceContainer,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexBasis: '48%',
    flexGrow: 1,
    gap: spacing.sm,
    minWidth: 180,
    padding: spacing.md,
  },
  actionTileHover: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryAccent,
  },
  actionTilePressed: {
    opacity: 0.9,
    transform: [{ translateY: 1 }],
  },
  actionTileTitle: {
    color: colors.neutralText,
    fontSize: 15,
    fontWeight: '800',
  },
  actionTileSubtitle: {
    color: colors.mutedText,
    fontSize: 13,
    marginTop: 2,
  },
  actionTileArrow: {
    color: colors.primaryBase,
    fontSize: 13,
    fontWeight: '800',
  },
  activityList: {
    gap: spacing.md,
  },
  activityItem: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  activityDot: {
    backgroundColor: colors.primaryAccent,
    borderRadius: 999,
    height: 8,
    marginTop: 7,
    width: 8,
  },
  activityText: {
    flex: 1,
  },
  activityTitle: {
    color: colors.neutralText,
    fontSize: 14,
    fontWeight: '800',
  },
  activityDetail: {
    color: colors.mutedText,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
});
