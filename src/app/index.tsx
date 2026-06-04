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
      setErrorMessage(`Não foi possível carregar o resumo do dashboard. ${getApiErrorMessage(error)}`);
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
                  Monitoramento climático e ambiental das regiões vulneráveis.
                </Text>
              </View>
              <View style={styles.apiChip}>
                <View style={styles.apiDot} />
                <View>
                  <Text style={styles.apiLabel}>API: {errorMessage ? 'Reconectar' : 'Online'}</Text>
                  <Text style={styles.apiValue}>Fonte: Render</Text>
                  <Text style={styles.apiMeta}>
                    Última atualização: {summary?.atualizadoEm ?? 'aguardando'}
                  </Text>
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
              supportingText="Regiões ativas"
              accentColor={colors.primary}
              style={isDesktop && styles.metricDesktopItem}
            />
            <MetricCard
              label="Estações ativas"
              value={formatMetric(summary?.totalEstacoesAtivas)}
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
              value={formatMetric(summary?.leiturasValidas)}
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
                <PanelRow
                  label="Regiões em risco"
                  value={formatMetric(summary?.regioesComRiscoAltoOuCritico)}
                />
                <PanelRow
                  label="Observações climáticas"
                  value={formatMetric(summary?.observacoesClimaticas)}
                />
                <PanelRow label="Avaliações de risco" value={formatMetric(summary?.avaliacoesRisco)} />
                <PanelRow label="Atualização" value={summary?.atualizadoEm ?? 'Aguardando atualização'} />
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
                <PanelRow label="Altos" value={formatMetric(summary?.alertasAltos)} highlight />
                <PanelRow label="Resolvidos" value={formatMetric(summary?.alertasResolvidos)} />
              </View>
            </AppCard>

            <AppCard
              title="Ações rápidas"
              subtitle="Fluxos principais da operação."
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
              subtitle="Sinais de acompanhamento para a operação."
              variant="elevated"
              style={isDesktop && styles.dashboardPanel}>
              <View style={styles.activityList}>
                <ActivityItem title="Monitoramento ativo" detail="Indicadores consolidados para leitura rápida da operação." />
                <ActivityItem title="Prioridade operacional" detail="Alertas críticos e altos orientam a resposta das equipes." />
                <ActivityItem title="Base regional" detail="Regiões e estações mantêm a visão territorial do risco." />
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
    borderRadius: 6,
    boxShadow:
      '0px 2px 4px -1px rgba(0,0,0,.2), 0px 4px 5px 0px rgba(0,0,0,.14), 0px 1px 10px 0px rgba(0,0,0,.12)',
    elevation: 4,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  heroDesktop: {
    padding: 24,
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
    fontSize: 30,
    fontWeight: '700',
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
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 4,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
  apiMeta: {
    color: colors.primary100,
    fontSize: 11,
    marginTop: 1,
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
    borderRadius: 6,
    borderWidth: 1,
    boxShadow:
      '0px 2px 1px -1px rgba(0,0,0,.2), 0px 1px 1px 0px rgba(0,0,0,.14), 0px 1px 3px 0px rgba(0,0,0,.12)',
    flexBasis: '48%',
    flexGrow: 1,
    gap: spacing.sm,
    minWidth: 180,
    padding: spacing.md,
  },
  actionTileHover: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary200,
    boxShadow:
      '0px 3px 1px -2px rgba(0,0,0,.2), 0px 2px 2px 0px rgba(0,0,0,.14), 0px 1px 5px 0px rgba(0,0,0,.12)',
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
